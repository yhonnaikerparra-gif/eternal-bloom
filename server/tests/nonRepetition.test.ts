import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { LetterEngine } from '../src/services/letterEngine.js';
import { getDatabase } from '../src/db/index.js';

describe('LetterEngine: Non-Repetition & Fingerprint Hashing', () => {
  beforeEach(() => {
    getDatabase();
  });

  it('normalizes text by stripping accents, punctuation, and extra whitespace', () => {
    const raw1 = '  ¡Hola, mi amor! ¿Cómo estás hoy?   ';
    const raw2 = 'hola mi amor como estas hoy';

    const normalized1 = LetterEngine.normalizeText(raw1);
    const normalized2 = LetterEngine.normalizeText(raw2);

    expect(normalized1).toBe('hola mi amor como estas hoy');
    expect(normalized2).toBe('hola mi amor como estas hoy');
    expect(LetterEngine.computeHash(raw1)).toBe(LetterEngine.computeHash(raw2));
  });

  it('prevents saving identical or near-identical letters', () => {
    const rand = crypto.randomBytes(4).toString('hex');
    const text1 = `Eres la persona más maravillosa del universo ${rand}.`;
    const text2 = `  ¡Eres la persona mas maravillosa del universo ${rand}!  `;

    // First store should succeed
    const first = LetterEngine.storeLetter({
      category: 'Amor profundo',
      title: 'Prueba 1',
      content: text1,
      source: 'MANUAL'
    });

    expect(first.id).toBeDefined();

    // Second store with equivalent normalized text must throw
    expect(() => {
      LetterEngine.storeLetter({
        category: 'Ternura',
        title: 'Prueba 2',
        content: text2,
        source: 'MANUAL'
      });
    }).toThrow(/Duplicate letter detected/);
  });

  it('selects unique letters from curated library without repeating', async () => {
    const letter1 = await LetterEngine.getNextUniqueLetter('Valeria', 'Mi Sol');
    expect(letter1.content).toBeDefined();
    expect(LetterEngine.isDuplicate(letter1.content)).toBe(false);

    // Store it
    LetterEngine.storeLetter({
      category: letter1.category,
      title: letter1.title,
      content: letter1.content,
      source: letter1.source
    });

    // Next selection should be different and not match the one just stored
    const letter2 = await LetterEngine.getNextUniqueLetter('Valeria', 'Mi Sol');
    expect(letter2.content).not.toBe(letter1.content);
  });
});
