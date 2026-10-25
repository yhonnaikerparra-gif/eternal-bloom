import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/index.js';
import { config } from '../config/index.js';
import { Dispatcher } from '../services/dispatcher.js';

export const recipientRouter = Router();

/**
 * GET /api/recipient/status
 * Informs frontend whether the recipient profile and >=6 digit code have been configured.
 */
recipientRouter.get('/status', (req: Request, res: Response): void => {
  const db = getDatabase();
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

  if (!settings) {
    res.json({ isConfigured: false });
    return;
  }

  const hasCode = !!(settings.recipient_access_code && settings.recipient_access_code.trim().length >= 6);
  const hasPhone = !!(settings.recipient_whatsapp && settings.recipient_whatsapp.trim().length >= 7);

  res.json({
    isConfigured: hasCode && hasPhone,
    recipientName: settings.recipient_name || 'Mi Amor',
    recipientNickname: settings.recipient_nickname || '',
    recipientWhatsapp: settings.recipient_whatsapp || '',
    hasAccessCode: hasCode,
    publicWebUrl: settings.public_web_url || '',
    isActive: !!settings.is_active
  });
});

/**
 * POST /api/recipient/access
 * Handles both first-time registration and ongoing login with WhatsApp number + secret code (>= 6 digits).
 * Gathers/saves the recipient information, activates the process, and prepares today's love letter.
 */
recipientRouter.post('/access', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, whatsapp, accessCode, publicWebUrl } = req.body;

    if (!whatsapp || typeof whatsapp !== 'string') {
      res.status(400).json({ error: 'Por favor ingresa tu número de WhatsApp.' });
      return;
    }

    const cleanPhone = whatsapp.replace(/[^\d]/g, '');
    if (cleanPhone.length < 7) {
      res.status(400).json({ error: 'El número de WhatsApp debe contener al menos 7 dígitos.' });
      return;
    }

    if (!accessCode || typeof accessCode !== 'string' || accessCode.trim().length < 6) {
      res.status(400).json({ error: 'La clave de acceso debe tener un mínimo de 6 dígitos.' });
      return;
    }

    const inputCode = accessCode.trim();
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;

    if (!settings) {
      res.status(500).json({ error: 'Configuración del sistema no encontrada.' });
      return;
    }

    const existingCode = settings.recipient_access_code ? settings.recipient_access_code.trim() : '';

    // If an access code was already established, verify it
    if (existingCode && existingCode !== inputCode) {
      res.status(401).json({
        error: 'Clave incorrecta. Por favor verifica tu clave secreta de mínimo 6 dígitos.'
      });
      return;
    }

    // Determine target name and public URL
    const targetName = name && name.trim() ? name.trim() : (settings.recipient_name || 'Mi Amor');
    const targetUrl = publicWebUrl && publicWebUrl.trim() ? publicWebUrl.trim() : (settings.public_web_url || '');

    // Persist recipient information in database and activate process
    db.prepare(`
      UPDATE settings SET
        recipient_name = ?,
        recipient_whatsapp = ?,
        recipient_access_code = ?,
        public_web_url = CASE WHEN ? != '' THEN ? ELSE public_web_url END,
        is_active = 1,
        primary_channel = 'WHATSAPP',
        updated_at = datetime('now')
      WHERE id = 1
    `).run(targetName, cleanPhone, inputCode, targetUrl, targetUrl);

    // Launch the ongoing romantic process: ensure today's letter and flower are generated
    const timezone = settings.timezone || 'America/Bogota';
    const todayKey = Dispatcher.getCurrentDateKey(timezone);
    const existingDispatch = db.prepare(`
      SELECT id FROM dispatch_logs WHERE date_key = ? AND is_test = 0 AND delivery_status = 'SENT'
    `).get(todayKey);

    if (!existingDispatch) {
      try {
        await Dispatcher.executeDailyDispatch();
      } catch (err) {
        console.warn('[RecipientAccess] Auto-dispatch execution notice:', err);
      }
    }

    // Issue JWT token for recipient session
    const token = jwt.sign(
      { role: 'recipient', whatsapp: cleanPhone, name: targetName },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      recipient: {
        name: targetName,
        whatsapp: cleanPhone
      },
      message: `¡Bienvenida a nuestro espacio eterno, ${targetName}! 💖`
    });
  } catch (error: any) {
    console.error('[RecipientAccess] Error processing access:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el acceso del destinatario.' });
  }
});

/**
 * GET /api/recipient/verify
 * Validates active recipient session token.
 */
recipientRouter.get('/verify', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    res.json({
      valid: true,
      recipient: {
        name: decoded.name,
        whatsapp: decoded.whatsapp
      }
    });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Token expirado o inválido' });
  }
});
