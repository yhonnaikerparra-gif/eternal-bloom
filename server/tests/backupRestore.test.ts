import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { BackupService } from '../src/db/backupService.js';
import { SCHEMA_SQL } from '../src/db/schema.js';

describe('Cloud Backup & Auto-Restore System', () => {
  it('successfully auto-restores tables and letters into an empty database from cloud snapshot', () => {
    // In-memory clean database simulating fresh install on a new PC
    const freshDb = new Database(':memory:');
    freshDb.exec(SCHEMA_SQL);

    // Initial check: zero letters
    const beforeCount = freshDb.prepare('SELECT COUNT(*) as count FROM letters').get() as { count: number };
    expect(beforeCount.count).toBe(0);

    // Run auto-restore
    const restored = BackupService.autoRestoreIfEmpty(freshDb);
    expect(restored).toBe(true);

    // Check after: letters, flowers, and settings are restored!
    const afterCount = freshDb.prepare('SELECT COUNT(*) as count FROM letters').get() as { count: number };
    expect(afterCount.count).toBeGreaterThan(0);

    const flowersCount = freshDb.prepare('SELECT COUNT(*) as count FROM garden_elements').get() as { count: number };
    expect(flowersCount.count).toBeGreaterThan(0);

    const settings = freshDb.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    expect(settings).toBeDefined();
    expect(settings.recipient_name).toBeDefined();

    freshDb.close();
  });

  it('reads latest backup info accurately', () => {
    const info = BackupService.getLatestBackupInfo();
    expect(info).toBeDefined();
    expect(info?.letterCount).toBeGreaterThan(0);
    expect(info?.flowerCount).toBeGreaterThan(0);
  });
});
