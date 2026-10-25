import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { getDatabase } from '../db/index.js';

export const webhookRouter = Router();

// Meta WhatsApp Webhook Verification Handshake
webhookRouter.get('/whatsapp', (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('[Webhook] Meta WhatsApp webhook successfully verified.');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden: Token mismatch');
  }
});

// Meta WhatsApp Status Notifications
webhookRouter.post('/whatsapp', (req: Request, res: Response): void => {
  const body = req.body;

  try {
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value?.statuses) {
            const db = getDatabase();
            for (const statusObj of value.statuses) {
              const msgId = statusObj.id;
              const deliveryStatus = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
              console.log(`[Webhook] WhatsApp status update for ${msgId}: ${deliveryStatus}`);

              // Update dispatch log if message ID matches
              if (deliveryStatus === 'failed') {
                const errors = JSON.stringify(statusObj.errors || 'Delivery failed');
                db.prepare(`
                  UPDATE dispatch_logs 
                  SET delivery_status = 'FAILED', error_message = ? 
                  WHERE provider_message_id = ?
                `).run(errors, msgId);
              } else if (deliveryStatus === 'delivered' || deliveryStatus === 'read') {
                db.prepare(`
                  UPDATE dispatch_logs 
                  SET delivery_status = 'SENT' 
                  WHERE provider_message_id = ?
                `).run(msgId);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Error processing WhatsApp webhook:', error);
  }

  res.sendStatus(200);
});
