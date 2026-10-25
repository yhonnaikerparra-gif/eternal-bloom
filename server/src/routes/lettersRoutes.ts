import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/index.js';
import { LetterEngine } from '../services/letterEngine.js';
import { authMiddleware } from './authRoutes.js';

export const lettersRouter = Router();

// Public: Get latest sent letter or protagonist message for romantic reader
lettersRouter.get('/latest', (req: Request, res: Response): void => {
  const db = getDatabase();

  const latest = db.prepare(`
    SELECT l.*, dl.sent_at, dl.channel_used
    FROM letters l
    INNER JOIN dispatch_logs dl ON l.id = dl.letter_id
    WHERE dl.delivery_status = 'SENT' AND dl.is_test = 0
    ORDER BY dl.sent_at DESC
    LIMIT 1
  `).get() as any;

  if (latest) {
    res.json(latest);
    return;
  }

  // Fallback to the initial story note if no dispatch has occurred yet
  res.json({
    id: 'initial-bloom',
    title: 'El Comienzo de Nuestra Historia',
    category: 'Nuestra Primera Flor',
    content: 'Hoy comienza a florecer nuestro jardín eterno. Cada amanecer traerá consigo una nueva carta escrita con devoción, y con ella, una nueva flor que nunca marchitará.',
    created_at: new Date().toISOString(),
    status: 'SENT'
  });
});

// Public: Get all sent letters for romantic history browser
lettersRouter.get('/history', (req: Request, res: Response): void => {
  const db = getDatabase();
  const letters = db.prepare(`
    SELECT 
      l.id, l.title, l.category, l.content, l.source,
      dl.sent_at, dl.channel_used, ge.variety as flower_variety, ge.element_type
    FROM letters l
    INNER JOIN dispatch_logs dl ON l.id = dl.letter_id
    LEFT JOIN garden_elements ge ON l.id = ge.letter_id
    WHERE dl.delivery_status = 'SENT' AND dl.is_test = 0
    ORDER BY dl.sent_at DESC
  `).all();

  res.json(letters);
});

// Admin: Get all letters including drafts, scheduled, failed
lettersRouter.get('/', authMiddleware, (req: Request, res: Response): void => {
  const db = getDatabase();
  const letters = db.prepare(`
    SELECT l.*, dl.sent_at, dl.delivery_status, dl.channel_used
    FROM letters l
    LEFT JOIN dispatch_logs dl ON l.id = dl.letter_id
    ORDER BY l.created_at DESC
  `).all();

  res.json(letters);
});

// Admin: Create manual custom letter with duplicate detection
lettersRouter.post('/', authMiddleware, (req: Request, res: Response): void => {
  const { category, title, content, scheduledFor } = req.body;

  if (!content || content.trim().length < 10) {
    res.status(400).json({ error: 'El contenido de la carta debe tener al menos 10 caracteres.' });
    return;
  }

  try {
    const result = LetterEngine.storeLetter({
      category: category || 'Amor profundo',
      title: title || 'Carta de amor',
      content: content.trim(),
      source: 'MANUAL',
      scheduledFor: scheduledFor || undefined,
      status: 'SCHEDULED'
    });

    res.status(201).json({
      message: 'Carta guardada exitosamente en el archivo.',
      id: result.id,
      normalizedHash: result.normalizedHash
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Preview sample letter without saving
lettersRouter.post('/preview-sample', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { recipientName, nickname, preferAI } = req.body;

  try {
    const sample = await LetterEngine.getNextUniqueLetter(
      recipientName || 'Mi Amor',
      nickname || 'Cariño',
      Boolean(preferAI)
    );
    res.json(sample);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
