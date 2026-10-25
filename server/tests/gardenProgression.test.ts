import { describe, it, expect } from 'vitest';
import { GardenService } from '../src/services/gardenService.js';
import { getDatabase } from '../src/db/index.js';

describe('GardenService: Visual Progression & Milestones', () => {
  it('correctly maps milestone stages based on confirmed sent counts', () => {
    expect(GardenService.calculateStage(0)).toBe('STAGE_1_FIRST_BLOOM');
    expect(GardenService.calculateStage(1)).toBe('STAGE_1_FIRST_BLOOM');
    expect(GardenService.calculateStage(2)).toBe('STAGE_2_GARDEN_GROWTH');
    expect(GardenService.calculateStage(100)).toBe('STAGE_2_GARDEN_GROWTH');
    expect(GardenService.calculateStage(364)).toBe('STAGE_2_GARDEN_GROWTH');
    expect(GardenService.calculateStage(365)).toBe('STAGE_4_EARTH_ASCENT');
    expect(GardenService.calculateStage(366)).toBe('STAGE_5_COSMIC_STARS');
    expect(GardenService.calculateStage(499)).toBe('STAGE_5_COSMIC_STARS');
    expect(GardenService.calculateStage(500)).toBe('STAGE_6_UNIVERSE_OF_LOVE');
    expect(GardenService.calculateStage(1000)).toBe('STAGE_6_UNIVERSE_OF_LOVE');
  });

  it('guarantees Stage 1 protagonist flower exists at order 0', () => {
    const db = getDatabase();
    const protagonist = db.prepare('SELECT * FROM garden_elements WHERE birth_order = 0').get() as any;

    expect(protagonist).toBeDefined();
    expect(protagonist.element_type).toBe('PROTAGONIST_FLOWER');
    expect(protagonist.pos_x).toBe(0);
    expect(protagonist.pos_y).toBe(0);
    expect(protagonist.pos_z).toBe(0);
  });

  it('creates a flower for order <= 365 and a star for order > 365', () => {
    const db = getDatabase();
    // Insert valid dummy letters for foreign key integrity
    db.prepare(`
      INSERT OR IGNORE INTO letters (id, category, title, content, normalized_hash, source, created_at)
      VALUES 
        ('test-letter-10', 'Amor', 'Carta 10', 'Contenido 10', 'hash-10', 'MANUAL', datetime('now')),
        ('test-letter-366', 'Estrellas', 'Carta 366', 'Contenido 366', 'hash-366', 'MANUAL', datetime('now'))
    `).run();

    const flowerElement = GardenService.createVisualElementForLetter('test-letter-10', 10);
    expect(flowerElement.element_type).toBe('GARDEN_FLOWER');
    expect(flowerElement.birth_order).toBe(10);
    expect(flowerElement.variety).toBeDefined();

    const starElement = GardenService.createVisualElementForLetter('test-letter-366', 366);
    expect(starElement.element_type).toBe('STAR');
    expect(starElement.birth_order).toBe(366);
    expect(starElement.variety).toBeDefined();
  });

  it('does not duplicate elements if called multiple times for the same letter', () => {
    const db = getDatabase();
    db.prepare(`
      INSERT OR IGNORE INTO letters (id, category, title, content, normalized_hash, source, created_at)
      VALUES ('test-letter-repeat', 'Amor', 'Repetida', 'Contenido Repetido', 'hash-repeat', 'MANUAL', datetime('now'))
    `).run();

    const first = GardenService.createVisualElementForLetter('test-letter-repeat', 15);
    const second = GardenService.createVisualElementForLetter('test-letter-repeat', 15);

    expect(first.id).toBe(second.id);
  });
});
