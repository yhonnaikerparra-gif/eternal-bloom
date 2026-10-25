import crypto from 'crypto';
import { getDatabase } from '../db/index.js';
import { LetterEngine } from './letterEngine.js';
import { GardenService } from './gardenService.js';
import { GmailService } from './gmailService.js';
import { WhatsAppService } from './whatsappService.js';

export interface DispatchResult {
  success: boolean;
  letterId?: string;
  dateKey: string;
  channelUsed: string;
  providerMessageId?: string;
  deliveryStatus: 'SENT' | 'FAILED' | 'PENDING' | 'INDETERMINATE';
  flowerCreated: boolean;
  elementId?: string;
  error?: string;
  isTest?: boolean;
}

export class Dispatcher {
  private static isDispatching = false;

  /**
   * Gets current calendar date key formatted as YYYY-MM-DD in the target timezone (e.g., America/Bogota).
   */
  public static getCurrentDateKey(timezone: string = 'America/Bogota'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Returns "YYYY-MM-DD"
  }

  /**
   * Formats a friendly Spanish date string in Colombia timezone.
   */
  public static getFriendlyDateString(timezone: string = 'America/Bogota'): string {
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(new Date());
  }

  /**
   * Core daily dispatch execution workflow.
   * Fully idempotent, transactional, and error-resilient.
   */
  public static async executeDailyDispatch(options: {
    forceDateKey?: string;
    isTest?: boolean;
    overrideChannel?: 'GMAIL' | 'WHATSAPP';
  } = {}): Promise<DispatchResult> {
    const db = getDatabase();
    const isTest = options.isTest || false;

    // Mutex lock to prevent overlapping concurrent executions
    if (this.isDispatching) {
      return {
        success: false,
        dateKey: '',
        channelUsed: 'NONE',
        deliveryStatus: 'FAILED',
        flowerCreated: false,
        error: 'Another dispatch execution is currently in progress.'
      };
    }

    this.isDispatching = true;

    try {
      // 1. Load active settings
      const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
      if (!settings) {
        throw new Error('System settings not found.');
      }

      if (!settings.is_active && !isTest) {
        return {
          success: false,
          dateKey: '',
          channelUsed: 'NONE',
          deliveryStatus: 'FAILED',
          flowerCreated: false,
          error: 'System dispatch is currently paused by admin settings.'
        };
      }

      const timezone = settings.timezone || 'America/Bogota';
      const dateKey = options.forceDateKey || this.getCurrentDateKey(timezone);
      const friendlyDate = this.getFriendlyDateString(timezone);

      // 2. Check Idempotency for non-test runs: has a message already been sent today?
      if (!isTest) {
        const alreadySent = db.prepare(`
          SELECT id, letter_id FROM dispatch_logs 
          WHERE date_key = ? AND delivery_status = 'SENT' AND is_test = 0
        `).get(dateKey) as { id: string; letter_id: string } | undefined;

        if (alreadySent) {
          console.log(`[Dispatcher] Daily dispatch already successfully completed for date ${dateKey}. Skipping.`);
          return {
            success: true,
            letterId: alreadySent.letter_id,
            dateKey,
            channelUsed: 'ALREADY_SENT',
            deliveryStatus: 'SENT',
            flowerCreated: false,
            error: `El envío de hoy (${dateKey}) ya fue realizado exitosamente con anterioridad.`
          };
        }
      }

      // 3. Obtain or select a strictly unique letter
      let letter: { id: string; title: string; category: string; content: string; source: string };

      // Check if there is an existing scheduled letter for today (e.g. from an earlier interrupted run)
      const existingScheduled = db.prepare(`
        SELECT * FROM letters 
        WHERE (scheduled_for = ? OR status = 'SCHEDULED') AND status != 'SENT'
        ORDER BY created_at ASC LIMIT 1
      `).get(dateKey) as any;

      if (existingScheduled) {
        letter = existingScheduled;
      } else {
        // Generate or select a brand new unique letter
        const newLetter = await LetterEngine.getNextUniqueLetter(
          settings.recipient_name,
          settings.recipient_nickname,
          Boolean(settings.ai_enabled)
        );

        const stored = LetterEngine.storeLetter({
          category: newLetter.category,
          title: newLetter.title,
          content: newLetter.content,
          source: newLetter.source,
          scheduledFor: dateKey,
          status: 'SCHEDULED'
        });

        letter = {
          id: stored.id,
          title: newLetter.title,
          category: newLetter.category,
          content: newLetter.content,
          source: newLetter.source
        };
      }

      // 4. Determine dispatch channel
      const channel = options.overrideChannel || settings.primary_channel || 'GMAIL';
      let sendSuccess = false;
      let providerMessageId: string | undefined;
      let providerResponseStr: string | undefined;
      let deliveryError: string | undefined;

      // 5. Execute transmission
      if (channel === 'GMAIL' || channel === 'BOTH') {
        const gmailResult = await GmailService.sendLetter(
          settings.recipient_email,
          settings.recipient_name,
          letter.title,
          letter.content,
          settings.signature_name,
          friendlyDate
        );

        if (gmailResult.success) {
          sendSuccess = true;
          providerMessageId = gmailResult.messageId;
          providerResponseStr = gmailResult.providerResponse;
        } else {
          deliveryError = `Gmail Error: ${gmailResult.error}`;
        }
      }

      // Try WhatsApp if primary or fallback
      if ((channel === 'WHATSAPP' || (!sendSuccess && settings.fallback_channel_enabled && channel === 'GMAIL')) && !sendSuccess) {
        const waResult = await WhatsAppService.sendLetter(
          settings.recipient_whatsapp,
          settings.recipient_name,
          letter.title,
          letter.content,
          settings.signature_name,
          friendlyDate
        );

        if (waResult.success) {
          sendSuccess = true;
          providerMessageId = waResult.messageId;
          providerResponseStr = waResult.providerResponse;
          deliveryError = undefined;
        } else {
          deliveryError = (deliveryError ? `${deliveryError} | ` : '') + `WhatsApp Error: ${waResult.error}`;
        }
      }

      const logId = crypto.randomUUID();
      const deliveryStatus = sendSuccess ? 'SENT' : 'FAILED';

      // 6. Record real provider response in database
      db.prepare(`
        INSERT INTO dispatch_logs (
          id, date_key, letter_id, channel_used, provider_message_id,
          delivery_status, provider_response, sent_at, error_message, is_test
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
      `).run(
        logId,
        dateKey,
        letter.id,
        channel,
        providerMessageId || null,
        deliveryStatus,
        providerResponseStr || null,
        deliveryError || null,
        isTest ? 1 : 0
      );

      // 7. If sent successfully: update letter status & strictly create exactly 1 flower/star
      let flowerCreated = false;
      let elementId: string | undefined;

      if (sendSuccess) {
        db.prepare(`
          UPDATE letters 
          SET status = 'SENT', last_error = NULL 
          WHERE id = ?
        `).run(letter.id);

        // ONLY non-test dispatches create visual elements!
        if (!isTest) {
          const maxOrderRow = db.prepare(`
            SELECT COALESCE(MAX(birth_order), 0) + 1 as next_order FROM garden_elements
          `).get() as { next_order: number };

          const birthOrder = maxOrderRow.next_order; // Guarantees unique next birth order
          const visualElement = GardenService.createVisualElementForLetter(letter.id, birthOrder);
          flowerCreated = true;
          elementId = visualElement.id;
        }
      } else {
        // Failed delivery: increment attempts, record error, NEVER create a flower
        db.prepare(`
          UPDATE letters 
          SET status = 'FAILED', attempt_count = attempt_count + 1, last_error = ? 
          WHERE id = ?
        `).run(deliveryError || 'Unknown delivery failure', letter.id);
      }

      return {
        success: sendSuccess,
        letterId: letter.id,
        dateKey,
        channelUsed: channel,
        providerMessageId,
        deliveryStatus,
        flowerCreated,
        elementId,
        error: deliveryError,
        isTest
      };

    } catch (error: any) {
      console.error('[Dispatcher] Fatal error during dispatch workflow:', error);
      return {
        success: false,
        dateKey: options.forceDateKey || '',
        channelUsed: 'ERROR',
        deliveryStatus: 'FAILED',
        flowerCreated: false,
        error: error.message
      };
    } finally {
      this.isDispatching = false;
    }
  }

  /**
   * Sends an isolated test message to verify recipient credentials.
   * Does NOT mark a calendar day as sent and does NOT create a flower.
   */
  public static async sendTestMessage(channel?: 'GMAIL' | 'WHATSAPP'): Promise<DispatchResult> {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    const targetChannel = channel || settings?.primary_channel || 'GMAIL';

    return this.executeDailyDispatch({
      isTest: true,
      overrideChannel: targetChannel
    });
  }
}
