import cron from 'node-cron';
import { config } from '../config/index.js';
import { Dispatcher } from './dispatcher.js';
import { getDatabase } from '../db/index.js';

export class Scheduler {
  private static task: cron.ScheduledTask | null = null;
  private static lastRunTime: string | null = null;
  private static lastRunStatus: string | null = null;

  /**
   * Initializes the persistent 5:00 AM America/Bogota scheduler and task recovery.
   */
  public static init(): void {
    const timezone = config.timezone;
    const schedule = config.cronSchedule; // '0 5 * * *' (5:00 AM)

    console.log(`[Scheduler] Initializing daily romantic dispatch job at ${schedule} (Timezone: ${timezone})`);

    // Verify cron syntax
    if (!cron.validate(schedule)) {
      console.error(`[Scheduler] Invalid cron schedule: ${schedule}`);
      return;
    }

    this.task = cron.schedule(
      schedule,
      async () => {
        console.log(`[Scheduler] 🌸 Triggering scheduled 5:00 AM dispatch for Colombia time (${new Date().toISOString()})`);
        const result = await Dispatcher.executeDailyDispatch();
        this.lastRunTime = new Date().toISOString();
        this.lastRunStatus = result.success ? 'SUCCESS' : `FAILED: ${result.error}`;
      },
      {
        timezone: timezone,
      }
    );

    // Boot check: If server was restarted after 5:00 AM Bogota and today's letter wasn't sent, trigger recovery
    this.checkAndRecoverPendingDispatch();

    // Keep-alive heartbeat: Pings public health endpoint every 10 minutes to prevent Render free instance sleep
    this.initKeepAlive();
  }

  /**
   * Periodically pings the public web health endpoint to keep cloud container awake 24/7.
   */
  private static initKeepAlive(): void {
    if (process.env.NODE_ENV === 'test') return;

    const rawUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || 'https://amor-de-mi-vida-llxh.onrender.com';
    if (!rawUrl) return;

    const healthUrl = `${rawUrl.replace(/\/+$/, '')}/api/health`;
    console.log(`[Scheduler] Keep-alive heartbeat configured for ${healthUrl} (interval: 10m)`);

    setInterval(async () => {
      try {
        const res = await fetch(healthUrl);
        if (res.ok) {
          console.log(`[Scheduler] Keep-alive ping OK (${new Date().toISOString()})`);
        }
      } catch (err: any) {
        console.warn(`[Scheduler] Keep-alive ping warning: ${err.message}`);
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Recovers any missed dispatch if the server was restarted or temporarily offline.
   */
  public static async checkAndRecoverPendingDispatch(): Promise<void> {
    try {
      const db = getDatabase();
      const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
      if (!settings || !settings.is_active) return;

      const timezone = settings.timezone || 'America/Bogota';
      const todayKey = Dispatcher.getCurrentDateKey(timezone);

      // Current time in Colombia
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      const currentHour = parseInt(formatter.format(new Date()), 10);

      // If it's already past 5:00 AM (e.g. 5 AM to 23 PM) and today's letter is NOT yet sent
      if (currentHour >= 5) {
        const alreadySent = db.prepare(`
          SELECT id FROM dispatch_logs 
          WHERE date_key = ? AND delivery_status = 'SENT' AND is_test = 0
        `).get(todayKey);

        if (!alreadySent) {
          console.log(`[Scheduler] Found missing daily dispatch for today (${todayKey}, hour ${currentHour}:00). Initiating recovery...`);
          const result = await Dispatcher.executeDailyDispatch();
          console.log(`[Scheduler] Recovery result for ${todayKey}:`, result.success ? 'SENT' : result.error);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error checking pending recovery dispatch:', err);
    }
  }

  /**
   * Computes the next scheduled execution time for 5:00 AM Colombia.
   */
  public static getNextRunInfo(): {
    schedule: string;
    timezone: string;
    nextRunDate: string;
    hoursRemaining: number;
    minutesRemaining: number;
    lastRunTime: string | null;
    lastRunStatus: string | null;
  } {
    const timezone = config.timezone;
    const now = new Date();

    // Get current time in Bogota
    const bogotaDateStr = now.toLocaleString('en-US', { timeZone: timezone });
    const bogotaNow = new Date(bogotaDateStr);

    // Target is today at 5:00 AM Bogota
    const target = new Date(bogotaNow);
    target.setHours(5, 0, 0, 0);

    // If already past 5:00 AM today, next run is tomorrow at 5:00 AM
    if (bogotaNow.getTime() >= target.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - bogotaNow.getTime();
    const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      schedule: config.cronSchedule,
      timezone: timezone,
      nextRunDate: target.toISOString(),
      hoursRemaining,
      minutesRemaining,
      lastRunTime: this.lastRunTime,
      lastRunStatus: this.lastRunStatus,
    };
  }
}
