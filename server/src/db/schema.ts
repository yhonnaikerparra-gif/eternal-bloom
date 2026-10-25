export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  app_title TEXT DEFAULT 'ETERNAL BLOOM',
  recipient_name TEXT DEFAULT 'Mi Amor',
  recipient_nickname TEXT DEFAULT 'Cariño',
  recipient_whatsapp TEXT DEFAULT '',
  recipient_email TEXT DEFAULT '',
  primary_channel TEXT DEFAULT 'GMAIL',
  fallback_channel_enabled INTEGER DEFAULT 0,
  timezone TEXT DEFAULT 'America/Bogota',
  daily_time TEXT DEFAULT '05:00',
  is_active INTEGER DEFAULT 1,
  ai_enabled INTEGER DEFAULT 0,
  signature_name TEXT DEFAULT 'Por siempre tuyo',
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  normalized_hash TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scheduled_for TEXT,
  status TEXT DEFAULT 'DRAFT',
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS dispatch_logs (
  id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  letter_id TEXT NOT NULL,
  channel_used TEXT NOT NULL,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL,
  provider_response TEXT,
  sent_at TEXT NOT NULL,
  error_message TEXT,
  is_test INTEGER DEFAULT 0,
  FOREIGN KEY (letter_id) REFERENCES letters(id)
);

-- Unique index to guarantee only 1 daily dispatch per calendar date (America/Bogota) for non-test runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatch_date_non_test 
ON dispatch_logs(date_key) 
WHERE is_test = 0 AND delivery_status = 'SENT';

CREATE TABLE IF NOT EXISTS garden_elements (
  id TEXT PRIMARY KEY,
  letter_id TEXT UNIQUE,
  element_type TEXT NOT NULL,
  variety TEXT NOT NULL,
  pos_x REAL NOT NULL,
  pos_y REAL NOT NULL,
  pos_z REAL NOT NULL,
  rot_y REAL NOT NULL,
  scale REAL NOT NULL,
  color TEXT NOT NULL,
  birth_order INTEGER UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (letter_id) REFERENCES letters(id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_letters_status ON letters(status);
CREATE INDEX IF NOT EXISTS idx_letters_normalized_hash ON letters(normalized_hash);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_date_key ON dispatch_logs(date_key);
CREATE INDEX IF NOT EXISTS idx_garden_elements_order ON garden_elements(birth_order);
`;
