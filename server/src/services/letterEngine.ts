import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getDatabase } from '../db/index.js';
import { config } from '../config/index.js';
import { CURATED_LETTERS, CuratedLetter } from './letterLibrary.js';

export class LetterEngine {
  /**
   * Normalizes text by removing accents/diacritics, punctuation, extra spaces,
   * and converting to lowercase to detect exact and near-exact duplicates.
   */
  public static normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // remove punctuation/symbols
      .replace(/\s+/g, ' ') // collapse multiple whitespaces
      .trim();
  }

  /**
   * Computes SHA-256 hash of the normalized content.
   */
  public static computeHash(text: string): string {
    const normalized = this.normalizeText(text);
    return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  }

  /**
   * Checks if a letter with this normalized content has ever been stored/sent.
   */
  public static isDuplicate(text: string): boolean {
    const hash = this.computeHash(text);
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM letters WHERE normalized_hash = ?').get(hash);
    return !!existing;
  }

  /**
   * Generates a new romantic letter using Gemini AI (gemini-3.8-flash).
   */
  public static async generateAILetter(
    recipientName: string = 'Mi Amor',
    nickname: string = 'Cariño',
    category?: string
  ): Promise<{ category: string; title: string; content: string } | null> {
    if (!config.geminiApiKey) {
      return null;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const targetCategory = category || "Amor profundo y sincero";

      const prompt = `Eres un poeta y escritor romántico consagrado con un talento único para escribir cartas de amor cortas, íntimas, sinceras y profundamente emotivas.
Escribe una carta de amor única dirigida a "${recipientName}" (a quien llamo cariñosamente "${nickname}").

Categoría del mensaje: ${targetCategory}.
Longitud: Entre 4 y 7 líneas (un párrafo conmovedor, directo, natural y memorable).
Estilo: Emotivo, tierno, personal, poético pero con calidez humana real (no clichés vacíos).

Responde ÚNICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "category": "${targetCategory}",
  "title": "Título corto y poético para la carta",
  "content": "Cuerpo completo de la carta de amor"
}`;

      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const outputText = response.text?.trim();
      if (!outputText) return null;

      const parsed = JSON.parse(outputText);
      if (parsed.content && parsed.content.length > 20) {
        return {
          category: parsed.category || targetCategory,
          title: parsed.title || "Para ti, con todo mi amor",
          content: parsed.content.trim()
        };
      }
      return null;
    } catch (error) {
      console.error('[LetterEngine] AI Generation failed, falling back to curated library:', error);
      return null;
    }
  }

  /**
   * Selects or generates the next unique letter that has never been used before.
   */
  public static async getNextUniqueLetter(
    recipientName: string = 'Mi Amor',
    nickname: string = 'Cariño',
    preferAI: boolean = false
  ): Promise<{ category: string; title: string; content: string; source: 'AI' | 'LIBRARY' }> {
    const db = getDatabase();

    // 1. If AI is preferred and API key is configured, attempt AI generation first
    if (preferAI && config.geminiApiKey) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const aiLetter = await this.generateAILetter(recipientName, nickname);
        if (aiLetter && !this.isDuplicate(aiLetter.content)) {
          return {
            ...aiLetter,
            source: 'AI'
          };
        }
      }
    }

    // 2. Fall back to curated library: find letters not yet used
    const usedHashesRows = db.prepare('SELECT normalized_hash FROM letters').all() as { normalized_hash: string }[];
    const usedHashSet = new Set(usedHashesRows.map(r => r.normalized_hash));

    const availableLetters = CURATED_LETTERS.filter(letter => {
      const hash = this.computeHash(letter.content);
      return !usedHashSet.has(hash);
    });

    if (availableLetters.length > 0) {
      // Pick randomly or by category diversity
      const randomIndex = Math.floor(Math.random() * availableLetters.length);
      const chosen = availableLetters[randomIndex];
      return {
        category: chosen.category,
        title: chosen.title,
        content: chosen.content,
        source: 'LIBRARY'
      };
    }

    // 3. If all curated letters are exhausted, try AI as a desperate generator
    if (config.geminiApiKey) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const aiLetter = await this.generateAILetter(recipientName, nickname, `Amor nuevo único intento ${attempt}`);
        if (aiLetter && !this.isDuplicate(aiLetter.content)) {
          return {
            ...aiLetter,
            source: 'AI'
          };
        }
      }
    }

    // 4. If all sources truly exhausted, throw error to prevent duplicate dispatch
    throw new Error('No unique love letters available in library or AI. All messages have been sent. System will not repeat past letters.');
  }

  /**
   * Stores a letter in the database with strict duplicate prevention.
   */
  public static storeLetter(data: {
    category: string;
    title?: string;
    content: string;
    source: 'LIBRARY' | 'AI' | 'MANUAL';
    scheduledFor?: string;
    status?: string;
  }): { id: string; normalizedHash: string } {
    const db = getDatabase();
    const normalizedHash = this.computeHash(data.content);

    // Strict duplicate check
    const existing = db.prepare('SELECT id FROM letters WHERE normalized_hash = ?').get(normalizedHash) as { id: string } | undefined;
    if (existing) {
      throw new Error(`Duplicate letter detected. Content already exists with ID: ${existing.id}`);
    }

    const id = crypto.randomUUID();
    const title = data.title || 'Carta de amor';
    const status = data.status || 'SCHEDULED';
    const scheduledFor = data.scheduledFor || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO letters (id, category, title, content, normalized_hash, source, created_at, scheduled_for, status, attempt_count)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 0)
    `).run(id, data.category, title, data.content, normalizedHash, data.source, scheduledFor, status);

    return { id, normalizedHash };
  }
}
