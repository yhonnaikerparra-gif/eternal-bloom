import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config/index.js';
import { closeDatabase, getDatabase } from '../src/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function resetTestDatabase(): void {
  closeDatabase();
  const testDbPath = path.resolve(__dirname, '../data/test_bloom.db');
  config.dbPath = testDbPath;
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch {}
  }
  getDatabase();
}
