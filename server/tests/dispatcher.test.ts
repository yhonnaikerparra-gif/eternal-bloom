import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { Dispatcher } from '../src/services/dispatcher.js';
import { GmailService } from '../src/services/gmailService.js';
import { getDatabase } from '../src/db/index.js';

describe('Dispatcher: Idempotency, Test Mode & Error Handling', () => {
  it('correctly formats date keys in America/Bogota timezone', () => {
    const key = Dispatcher.getCurrentDateKey('America/Bogota');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does NOT create a flower when dispatch is executed in test mode', async () => {
    const db = getDatabase();
    const flowersBefore = db.prepare("SELECT COUNT(*) as count FROM garden_elements WHERE element_type = 'GARDEN_FLOWER'").get() as { count: number };

    // Mock GmailService to return success without actually sending external network traffic
    vi.spyOn(GmailService, 'sendLetter').mockResolvedValueOnce({
      success: true,
      messageId: 'mock-test-msg-123',
      providerResponse: 'OK Mock'
    });

    const result = await Dispatcher.executeDailyDispatch({
      isTest: true,
      overrideChannel: 'GMAIL'
    });

    expect(result.success).toBe(true);
    expect(result.flowerCreated).toBe(false);

    const flowersAfter = db.prepare("SELECT COUNT(*) as count FROM garden_elements WHERE element_type = 'GARDEN_FLOWER'").get() as { count: number };
    expect(flowersAfter.count).toBe(flowersBefore.count);
  });

  it('prevents duplicate dispatches for the same calendar date (Idempotency)', async () => {
    const testDateKey = '2099-12-31';
    const db = getDatabase();
    db.prepare('DELETE FROM dispatch_logs WHERE date_key = ?').run(testDateKey);

    // Mock successful send for the first run
    vi.spyOn(GmailService, 'sendLetter').mockResolvedValueOnce({
      success: true,
      messageId: 'mock-first-run-id',
      providerResponse: 'OK Mock'
    });

    const firstRun = await Dispatcher.executeDailyDispatch({
      forceDateKey: testDateKey,
      isTest: false,
      overrideChannel: 'GMAIL'
    });

    expect(firstRun.success).toBe(true);
    expect(firstRun.deliveryStatus).toBe('SENT');
    expect(firstRun.flowerCreated).toBe(true);

    // Second run with the same date key MUST skip and NOT send or create another flower
    const secondRun = await Dispatcher.executeDailyDispatch({
      forceDateKey: testDateKey,
      isTest: false,
      overrideChannel: 'GMAIL'
    });

    expect(secondRun.channelUsed).toBe('ALREADY_SENT');
    expect(secondRun.flowerCreated).toBe(false);
  });
});
