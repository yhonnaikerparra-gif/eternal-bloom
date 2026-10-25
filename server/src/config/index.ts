import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or server folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: process.env.DATA_DIR || path.resolve(__dirname, '../../data'),
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../data/eternal_bloom.db'),
  
  // Timezone & Scheduler
  timezone: process.env.TIMEZONE || 'America/Bogota',
  cronSchedule: process.env.CRON_SCHEDULE || '0 5 * * *', // 5:00 AM every day
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'eternal-bloom-secret-key-heartbeat-2026',
  jwtExpiresIn: '7d',
  adminDefaultPassword: process.env.ADMIN_PASSWORD || 'amor-eterno-2026',
  
  // Messaging Integrations
  gmail: {
    user: process.env.GMAIL_USER || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || '',
    senderName: process.env.GMAIL_SENDER_NAME || 'ETERNAL BLOOM',
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
  },
  
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'eternal-bloom-verify-token',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'daily_love_letter',
  },
  
  // AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
};
