import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/index.js';
import { authMiddleware } from './authRoutes.js';
import { Scheduler } from '../services/scheduler.js';
import { Dispatcher } from '../services/dispatcher.js';
import { GmailService } from '../services/gmailService.js';
import { WhatsAppService } from '../services/whatsappService.js';
import { WhatsAppWebClient } from '../services/whatsappWebClient.js';
import { config } from '../config/index.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware);

// Get settings
adminRouter.get('/settings', (req: Request, res: Response): void => {
  const db = getDatabase();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

// Update settings
adminRouter.put('/settings', (req: Request, res: Response): void => {
  const {
    app_title,
    recipient_name,
    recipient_nickname,
    recipient_whatsapp,
    recipient_email,
    recipient_access_code,
    public_web_url,
    primary_channel,
    fallback_channel_enabled,
    timezone,
    daily_time,
    is_active,
    ai_enabled,
    signature_name
  } = req.body;

  const db = getDatabase();
  db.prepare(`
    UPDATE settings SET
      app_title = COALESCE(?, app_title),
      recipient_name = COALESCE(?, recipient_name),
      recipient_nickname = COALESCE(?, recipient_nickname),
      recipient_whatsapp = COALESCE(?, recipient_whatsapp),
      recipient_email = COALESCE(?, recipient_email),
      recipient_access_code = COALESCE(?, recipient_access_code),
      public_web_url = COALESCE(?, public_web_url),
      primary_channel = COALESCE(?, primary_channel),
      fallback_channel_enabled = COALESCE(?, fallback_channel_enabled),
      timezone = COALESCE(?, timezone),
      daily_time = COALESCE(?, daily_time),
      is_active = COALESCE(?, is_active),
      ai_enabled = COALESCE(?, ai_enabled),
      signature_name = COALESCE(?, signature_name),
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    app_title,
    recipient_name,
    recipient_nickname,
    recipient_whatsapp,
    recipient_email,
    recipient_access_code,
    public_web_url,
    primary_channel,
    fallback_channel_enabled !== undefined ? (fallback_channel_enabled ? 1 : 0) : null,
    timezone,
    daily_time,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    ai_enabled !== undefined ? (ai_enabled ? 1 : 0) : null,
    signature_name
  );

  const updated = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json({ message: 'Configuración actualizada correctamente', settings: updated });
});

// Get scheduler telemetry
adminRouter.get('/scheduler', (req: Request, res: Response): void => {
  const nextRun = Scheduler.getNextRunInfo();
  res.json(nextRun);
});

// Trigger daily dispatch immediately
adminRouter.post('/dispatch/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await Dispatcher.executeDailyDispatch();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger isolated test message (does NOT increment flowers or mark day as sent)
adminRouter.post('/dispatch/test', async (req: Request, res: Response): Promise<void> => {
  const { channel } = req.body;
  try {
    const result = await Dispatcher.sendTestMessage(channel);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check integration status (Gmail, WhatsApp, Gemini AI)
adminRouter.get('/integrations/status', async (req: Request, res: Response): Promise<void> => {
  const gmailStatus = await GmailService.testConnection();
  const waStatus = await WhatsAppService.testConnection();
  const aiConfigured = !!config.geminiApiKey;

  res.json({
    gmail: {
      configured: !!(config.gmail.user && config.gmail.appPassword),
      user: config.gmail.user ? config.gmail.user.replace(/(.{3})(.*)(@.*)/, '$1***$3') : '',
      connected: gmailStatus.connected,
      message: gmailStatus.message
    },
    whatsapp: {
      configured: WhatsAppService.isConfigured(),
      phoneNumberId: config.whatsapp.phoneNumberId ? `${config.whatsapp.phoneNumberId.slice(0, 4)}...` : '',
      connected: waStatus.connected,
      message: waStatus.message
    },
    geminiAi: {
      configured: aiConfigured,
      model: config.geminiModel,
      message: aiConfigured ? 'Gemini AI API Key configurada para generación poética' : 'API Key no configurada (usando biblioteca local)'
    }
  });
});

// Get dispatch logs
adminRouter.get('/logs', (req: Request, res: Response): void => {
  const db = getDatabase();
  const logs = db.prepare(`
    SELECT dl.*, l.title as letter_title, l.category as letter_category
    FROM dispatch_logs dl
    LEFT JOIN letters l ON dl.letter_id = l.id
    ORDER BY dl.sent_at DESC
    LIMIT 100
  `).all();

  res.json(logs);
});

// WhatsApp Web Personal QR Link Endpoints
adminRouter.get('/whatsapp-web/status', (req: Request, res: Response): void => {
  const status = WhatsAppWebClient.getStatus();
  res.json(status);
});

adminRouter.post('/whatsapp-web/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await WhatsAppWebClient.startClient();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminRouter.post('/whatsapp-web/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    await WhatsAppWebClient.logout();
    res.json({ message: 'WhatsApp desvinculado correctamente', status: WhatsAppWebClient.getStatus() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

adminRouter.post('/whatsapp-web/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

    if (!settings || !settings.recipient_whatsapp) {
      res.status(400).json({ error: 'Configura primero el número de WhatsApp del destinatario.' });
      return;
    }

    const testMessage = `🌸 *MI VIDA ETERNA* 🌸\n\nHola ${settings.recipient_name || 'mi amor'} ❤️,\n\nEste es un mensaje de prueba desde mi propio WhatsApp. El jardín eterno ha quedado vinculado con éxito y a partir de ahora recibirás aquí tus cartas de amor cada mañana a las 5:00 AM.\n\n✨ Te amo con toda mi alma. 🌹`;

    const result = await WhatsAppWebClient.sendMessage(settings.recipient_whatsapp, testMessage);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
