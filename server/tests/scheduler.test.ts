import { describe, it, expect } from 'vitest';
import { Scheduler } from '../src/services/scheduler.js';

describe('Scheduler: America/Bogota 5:00 AM Cron Engine', () => {
  it('correctly calculates the next 5:00 AM execution window in America/Bogota', () => {
    const nextRun = Scheduler.getNextRunInfo();

    expect(nextRun.timezone).toBe('America/Bogota');
    expect(nextRun.schedule).toBe('0 5 * * *');
    expect(nextRun.hoursRemaining).toBeGreaterThanOrEqual(0);
    expect(nextRun.hoursRemaining).toBeLessThanOrEqual(24);
    expect(nextRun.minutesRemaining).toBeGreaterThanOrEqual(0);
    expect(nextRun.minutesRemaining).toBeLessThan(60);
    expect(new Date(nextRun.nextRunDate).getTime()).toBeGreaterThan(Date.now() - 60000);
  });
});
