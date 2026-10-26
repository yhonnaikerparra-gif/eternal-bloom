import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BackupMetadata {
  timestamp: string;
  recipientName: string;
  letterCount: number;
  flowerCount: number;
  logCount: number;
  settingsUpdated: string;
}

export class BackupService {
  public static getBackupDir(): string {
    const backupDir = path.resolve(config.dataDir, 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  }

  /**
   * Generates a complete atomic snapshot of the SQLite database.
   * Exports both SQL insert statements and JSON structure, plus a .db backup.
   */
  public static async createBackup(db: Database.Database): Promise<BackupMetadata> {
    const backupDir = this.getBackupDir();
    const now = new Date().toISOString();

    // 1. Read all tables
    const settings = db.prepare('SELECT * FROM settings').all();
    const letters = db.prepare('SELECT * FROM letters ORDER BY created_at ASC').all();
    const dispatchLogs = db.prepare('SELECT * FROM dispatch_logs ORDER BY sent_at ASC').all();
    const gardenElements = db.prepare('SELECT * FROM garden_elements ORDER BY birth_order ASC').all();
    const adminUsers = db.prepare('SELECT * FROM admin_users').all();

    const fullData = {
      version: '1.0',
      exportedAt: now,
      metadata: {
        totalLetters: letters.length,
        totalFlowers: gardenElements.length,
        totalLogs: dispatchLogs.length,
      },
      tables: {
        settings,
        letters,
        dispatch_logs: dispatchLogs,
        garden_elements: gardenElements,
        admin_users: adminUsers,
      }
    };

    // 2. Save JSON backup
    const jsonPath = path.join(backupDir, 'eternal_bloom_backup.json');
    fs.writeFileSync(jsonPath, JSON.stringify(fullData, null, 2), 'utf-8');

    // 3. Generate SQL dump statements
    const sqlStatements: string[] = [
      `-- MI VIDA ETERNA Database Snapshot`,
      `-- Generated At: ${now}`,
      `BEGIN TRANSACTION;`
    ];

    // Export settings
    for (const row of settings as any[]) {
      const keys = Object.keys(row);
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlStatements.push(`INSERT OR REPLACE INTO settings (${keys.join(', ')}) VALUES (${vals.join(', ')});`);
    }

    // Export letters
    for (const row of letters as any[]) {
      const keys = Object.keys(row);
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlStatements.push(`INSERT OR REPLACE INTO letters (${keys.join(', ')}) VALUES (${vals.join(', ')});`);
    }

    // Export dispatch_logs
    for (const row of dispatchLogs as any[]) {
      const keys = Object.keys(row);
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlStatements.push(`INSERT OR REPLACE INTO dispatch_logs (${keys.join(', ')}) VALUES (${vals.join(', ')});`);
    }

    // Export garden_elements
    for (const row of gardenElements as any[]) {
      const keys = Object.keys(row);
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlStatements.push(`INSERT OR REPLACE INTO garden_elements (${keys.join(', ')}) VALUES (${vals.join(', ')});`);
    }

    // Export admin_users
    for (const row of adminUsers as any[]) {
      const keys = Object.keys(row);
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sqlStatements.push(`INSERT OR REPLACE INTO admin_users (${keys.join(', ')}) VALUES (${vals.join(', ')});`);
    }

    sqlStatements.push(`COMMIT;`);

    const sqlPath = path.join(backupDir, 'eternal_bloom_snapshot.sql');
    fs.writeFileSync(sqlPath, sqlStatements.join('\n'), 'utf-8');

    // 4. Native SQLite atomic backup file
    try {
      const dbBackupPath = path.join(backupDir, 'eternal_bloom_backup.db');
      await db.backup(dbBackupPath);
    } catch (e) {
      console.warn('[BackupService] Native db.backup notice:', e);
    }

    console.log(`[BackupService] Respaldo en la nube completado: ${letters.length} cartas, ${gardenElements.length} flores guardadas.`);

    const firstSettings = (settings[0] as any) || {};

    return {
      timestamp: now,
      recipientName: firstSettings.recipient_name || 'Mi Amor',
      letterCount: letters.length,
      flowerCount: gardenElements.length,
      logCount: dispatchLogs.length,
      settingsUpdated: firstSettings.updated_at || now,
    };
  }

  /**
   * Automatically restores from cloud backup if database is fresh or empty.
   */
  public static autoRestoreIfEmpty(db: Database.Database): boolean {
    try {
      const letterCountRow = db.prepare('SELECT COUNT(*) as count FROM letters').get() as { count: number };

      // If database already has letters and data, do nothing
      if (letterCountRow && letterCountRow.count > 0) {
        return false;
      }

      const backupDir = this.getBackupDir();
      const sqlPath = path.join(backupDir, 'eternal_bloom_snapshot.sql');
      const jsonPath = path.join(backupDir, 'eternal_bloom_backup.json');

      if (fs.existsSync(sqlPath)) {
        console.log('[BackupService] Base de datos vacía detectada. Restaurando desde eternal_bloom_snapshot.sql...');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        db.exec(sql);
        console.log('[BackupService] ¡Restauración automática desde la nube exitosa!');
        return true;
      } else if (fs.existsSync(jsonPath)) {
        console.log('[BackupService] Restaurando desde eternal_bloom_backup.json...');
        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        this.restoreFromJson(db, jsonContent);
        console.log('[BackupService] ¡Restauración automática exitosa desde JSON!');
        return true;
      }
    } catch (err) {
      console.error('[BackupService] Error durante la auto-restauración:', err);
    }
    return false;
  }

  /**
   * Restores tables from parsed JSON backup object.
   */
  public static restoreFromJson(db: Database.Database, data: any): void {
    if (!data || !data.tables) throw new Error('Formato de respaldo JSON inválido.');

    const insertMany = db.transaction(() => {
      // 1. Settings
      if (Array.isArray(data.tables.settings)) {
        for (const s of data.tables.settings) {
          db.prepare(`
            INSERT OR REPLACE INTO settings (
              id, app_title, recipient_name, recipient_nickname, recipient_whatsapp,
              recipient_email, recipient_access_code, public_web_url, primary_channel,
              fallback_channel_enabled, timezone, daily_time, is_active, ai_enabled,
              signature_name, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            s.id || 1, s.app_title || 'MI VIDA ETERNA', s.recipient_name, s.recipient_nickname,
            s.recipient_whatsapp, s.recipient_email, s.recipient_access_code || '',
            s.public_web_url || '', s.primary_channel || 'WHATSAPP',
            s.fallback_channel_enabled ? 1 : 0, s.timezone || 'America/Bogota',
            s.daily_time || '05:00', s.is_active ? 1 : 0, s.ai_enabled ? 1 : 0,
            s.signature_name || 'Por siempre tuyo', s.updated_at
          );
        }
      }

      // 2. Letters
      if (Array.isArray(data.tables.letters)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO letters (
            id, category, title, content, normalized_hash, source, created_at, scheduled_for, status, attempt_count, last_error
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const l of data.tables.letters) {
          stmt.run(l.id, l.category, l.title, l.content, l.normalized_hash, l.source, l.created_at, l.scheduled_for, l.status, l.attempt_count, l.last_error);
        }
      }

      // 3. Dispatch Logs
      if (Array.isArray(data.tables.dispatch_logs)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO dispatch_logs (
            id, date_key, letter_id, channel_used, provider_message_id, delivery_status, provider_response, sent_at, error_message, is_test
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const dl of data.tables.dispatch_logs) {
          stmt.run(dl.id, dl.date_key, dl.letter_id, dl.channel_used, dl.provider_message_id, dl.delivery_status, dl.provider_response, dl.sent_at, dl.error_message, dl.is_test);
        }
      }

      // 4. Garden Elements
      if (Array.isArray(data.tables.garden_elements)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO garden_elements (
            id, letter_id, element_type, variety, pos_x, pos_y, pos_z, rot_y, scale, color, birth_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const ge of data.tables.garden_elements) {
          stmt.run(ge.id, ge.letter_id, ge.element_type, ge.variety, ge.pos_x, ge.pos_y, ge.pos_z, ge.rot_y, ge.scale, ge.color, ge.birth_order, ge.created_at);
        }
      }

      // 5. Admin Users
      if (Array.isArray(data.tables.admin_users)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO admin_users (id, username, password_hash, created_at)
          VALUES (?, ?, ?, ?)
        `);
        for (const u of data.tables.admin_users) {
          stmt.run(u.id, u.username, u.password_hash, u.created_at);
        }
      }
    });

    insertMany();
  }

  /**
   * Reads latest backup metadata from disk if available.
   */
  public static getLatestBackupInfo(): BackupMetadata | null {
    try {
      const backupDir = this.getBackupDir();
      const jsonPath = path.join(backupDir, 'eternal_bloom_backup.json');
      if (fs.existsSync(jsonPath)) {
        const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const firstSettings = (content.tables?.settings?.[0]) || {};
        return {
          timestamp: content.exportedAt || new Date().toISOString(),
          recipientName: firstSettings.recipient_name || 'Mi Amor',
          letterCount: content.metadata?.totalLetters || 0,
          flowerCount: content.metadata?.totalFlowers || 0,
          logCount: content.metadata?.totalLogs || 0,
          settingsUpdated: firstSettings.updated_at || content.exportedAt,
        };
      }
    } catch {}
    return null;
  }
}
