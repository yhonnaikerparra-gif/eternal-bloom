import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { getDatabase } from '../src/db/index.js';
import { WhatsAppService } from '../src/services/whatsappService.js';

describe('Recipient Access & Security (>= 6 digits code & Public URL)', () => {
  beforeEach(() => {
    const db = getDatabase();
    // Reset settings for testing
    db.prepare(`
      UPDATE settings SET
        recipient_name = 'Mi Amor',
        recipient_whatsapp = '573001234567',
        recipient_access_code = '',
        public_web_url = 'https://mi-vida-eterna.onrender.com',
        is_active = 1
      WHERE id = 1
    `).run();
  });

  it('rejects an access code shorter than 6 digits/characters', async () => {
    const res = await request(app)
      .post('/api/recipient/access')
      .send({
        name: 'Valentina',
        whatsapp: '+57 300 123 4567',
        accessCode: '12345' // only 5 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('mínimo de 6 dígitos');
  });

  it('rejects an invalid WhatsApp number', async () => {
    const res = await request(app)
      .post('/api/recipient/access')
      .send({
        name: 'Valentina',
        whatsapp: '123', // too short
        accessCode: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('al menos 7 dígitos');
  });

  it('successfully registers and sets up recipient on first access with >= 6 digits code', async () => {
    const res = await request(app)
      .post('/api/recipient/access')
      .send({
        name: 'Valentina',
        whatsapp: '+57 300 987 6543',
        accessCode: '654321',
        publicWebUrl: 'https://mi-vida-eterna.onrender.com'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.recipient.name).toBe('Valentina');
    expect(res.body.recipient.whatsapp).toBe('573009876543');

    // Verify persisted in SQLite database
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    expect(settings.recipient_name).toBe('Valentina');
    expect(settings.recipient_whatsapp).toBe('573009876543');
    expect(settings.recipient_access_code).toBe('654321');
    expect(settings.is_active).toBe(1);
  });

  it('rejects invalid access code once code is established', async () => {
    const db = getDatabase();
    db.prepare(`
      UPDATE settings SET
        recipient_access_code = 'secreto2026'
      WHERE id = 1
    `).run();

    const res = await request(app)
      .post('/api/recipient/access')
      .send({
        whatsapp: '+57 300 987 6543',
        accessCode: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Clave incorrecta');
  });

  it('allows recipient to login with valid code and verifies session token', async () => {
    const db = getDatabase();
    db.prepare(`
      UPDATE settings SET
        recipient_name = 'Valentina',
        recipient_whatsapp = '573009876543',
        recipient_access_code = 'amor2026'
      WHERE id = 1
    `).run();

    const loginRes = await request(app)
      .post('/api/recipient/access')
      .send({
        whatsapp: '+57 300 987 6543',
        accessCode: 'amor2026'
      });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // Verify session
    const verifyRes = await request(app)
      .get('/api/recipient/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.valid).toBe(true);
    expect(verifyRes.body.recipient.name).toBe('Valentina');
  });

  it('builds romantic WhatsApp reminder containing actual public URL and never localhost', () => {
    const publicUrl = 'https://mi-vida-eterna.onrender.com';
    const text = WhatsAppService.buildReminderText(
      'Valentina',
      'Nuestro Amor Infinito',
      'Cada segundo a tu lado es un regalo del universo.',
      'Por siempre tuyo',
      'Domingo 25 de Octubre',
      publicUrl
    );

    expect(text).toContain(publicUrl);
    expect(text).not.toContain('localhost:3001');
    expect(text).toContain('Querida Valentina');
  });
});
