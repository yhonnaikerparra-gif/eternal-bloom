import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { SCHEMA_SQL } from './schema.js';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize Schema
  db.exec(SCHEMA_SQL);

  // Initialize Default Settings (id = 1)
  const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO settings (
        id, app_title, recipient_name, recipient_nickname, recipient_whatsapp,
        recipient_email, primary_channel, fallback_channel_enabled, timezone,
        daily_time, is_active, ai_enabled, signature_name, updated_at
      ) VALUES (
        1, 'ETERNAL BLOOM', 'Mi Amor', 'Cariño', '',
        '', 'GMAIL', 0, 'America/Bogota',
        '05:00', 1, 0, 'Por siempre tuyo', datetime('now')
      )
    `).run();
  }

  // Initialize Admin User if none exists
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(config.adminDefaultPassword, salt);
    db.prepare(`
      INSERT INTO admin_users (id, username, password_hash, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run('admin-1', 'admin', passwordHash);
  }

  // Ensure Stage 1 Protagonist Flower exists (birth_order = 0)
  const protagonistFlower = db.prepare('SELECT id FROM garden_elements WHERE birth_order = 0').get();
  if (!protagonistFlower) {
    db.prepare(`
      INSERT INTO garden_elements (
        id, letter_id, element_type, variety, pos_x, pos_y, pos_z, rot_y, scale, color, birth_order, created_at
      ) VALUES (
        'protagonist-flower-0', NULL, 'PROTAGONIST_FLOWER', 'RED_ROSE', 0, 0, 0, 0, 1.2, '#E11D48', 0, datetime('now')
      )
    `).run();
  }

  dbInstance = db;
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
