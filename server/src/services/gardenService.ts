import crypto from 'crypto';
import { getDatabase } from '../db/index.js';

export interface VisualElement {
  id: string;
  letter_id: string | null;
  element_type: 'PROTAGONIST_FLOWER' | 'GARDEN_FLOWER' | 'STAR' | 'COSMIC_CLUSTER';
  variety: string;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  rot_y: number;
  scale: number;
  color: string;
  birth_order: number;
  created_at: string;
  letter?: {
    id: string;
    title: string;
    category: string;
    content: string;
    sent_at?: string;
  };
}

export type StageName =
  | 'STAGE_1_FIRST_BLOOM'
  | 'STAGE_2_GARDEN_GROWTH'
  | 'STAGE_4_EARTH_ASCENT'
  | 'STAGE_5_COSMIC_STARS'
  | 'STAGE_6_UNIVERSE_OF_LOVE';

export class GardenService {
  private static FLOWER_VARIETIES = [
    { variety: 'RED_ROSE', color: '#E11D48' },
    { variety: 'PINK_PEONY', color: '#F43F5E' },
    { variety: 'BLUE_HYDRANGEA', color: '#3B82F6' },
    { variety: 'GOLDEN_BLOOM', color: '#F59E0B' },
    { variety: 'LILAC_TULIP', color: '#8B5CF6' },
    { variety: 'WHITE_LILY', color: '#FFF1F2' }
  ];

  private static STAR_VARIETIES = [
    { variety: 'RADIANT_STAR', color: '#FFFFFF' },
    { variety: 'BLUE_PULSAR', color: '#60A5FA' },
    { variety: 'GOLDEN_STELLA', color: '#FDE047' },
    { variety: 'PINK_NEBULA_STAR', color: '#F472B6' },
    { variety: 'VIOLET_SUPERNOVA', color: '#C084FC' }
  ];

  /**
   * Computes current visual stage based on confirmed sent letters count.
   */
  public static calculateStage(confirmedCount: number): StageName {
    if (confirmedCount <= 1) return 'STAGE_1_FIRST_BLOOM';
    if (confirmedCount < 365) return 'STAGE_2_GARDEN_GROWTH';
    if (confirmedCount === 365) return 'STAGE_4_EARTH_ASCENT';
    if (confirmedCount < 500) return 'STAGE_5_COSMIC_STARS';
    return 'STAGE_6_UNIVERSE_OF_LOVE';
  }

  /**
   * Calculates organic coordinates using phyllotaxis Fermat spiral algorithm for flowers.
   */
  private static calculateFlowerPosition(order: number): { x: number; y: number; z: number; rotY: number; scale: number } {
    const goldenAngle = 137.50776405 * (Math.PI / 180);
    const c = 0.85; // spacing constant
    const r = c * Math.sqrt(order);
    const theta = order * goldenAngle;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    // Subtle elevation curve forming a gentle romantic terraced hill
    const y = Math.sin(r * 0.3) * 0.15;
    const rotY = (order * 53.7) % (2 * Math.PI);
    const scale = 0.9 + ((order * 17) % 30) / 100; // between 0.9 and 1.2

    return { x, y, z, rotY, scale };
  }

  /**
   * Calculates 3D celestial coordinates for cosmic stars (Days 366+).
   */
  private static calculateStarPosition(order: number): { x: number; y: number; z: number; scale: number } {
    const starIndex = order - 365;
    // Fibonacci sphere distribution for uniform celestial placement
    const phi = Math.acos(1 - 2 * ((starIndex % 200) + 0.5) / 200);
    const theta = Math.PI * (1 + Math.sqrt(5)) * starIndex;
    const radius = 35 + ((starIndex * 13) % 25); // distance from Earth center

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const scale = 0.8 + ((starIndex * 7) % 10) / 10;

    return { x, y, z, scale };
  }

  /**
   * Creates a permanent flower or star in the database strictly linked to a confirmed sent letter.
   */
  public static createVisualElementForLetter(letterId: string, birthOrder: number): VisualElement {
    const db = getDatabase();

    // Check if an element already exists for this letter to prevent duplicates
    const existing = db.prepare('SELECT * FROM garden_elements WHERE letter_id = ?').get(letterId) as VisualElement | undefined;
    if (existing) {
      return existing;
    }

    const id = crypto.randomUUID();

    if (birthOrder <= 365) {
      // Create a garden flower
      const pos = this.calculateFlowerPosition(birthOrder);
      const varietyObj = this.FLOWER_VARIETIES[birthOrder % this.FLOWER_VARIETIES.length];

      db.prepare(`
        INSERT INTO garden_elements (
          id, letter_id, element_type, variety, pos_x, pos_y, pos_z, rot_y, scale, color, birth_order, created_at
        ) VALUES (?, ?, 'GARDEN_FLOWER', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, letterId, varietyObj.variety, pos.x, pos.y, pos.z, pos.rotY, pos.scale, varietyObj.color, birthOrder);

      return {
        id,
        letter_id: letterId,
        element_type: 'GARDEN_FLOWER',
        variety: varietyObj.variety,
        pos_x: pos.x,
        pos_y: pos.y,
        pos_z: pos.z,
        rot_y: pos.rotY,
        scale: pos.scale,
        color: varietyObj.color,
        birth_order: birthOrder,
        created_at: new Date().toISOString()
      };
    } else {
      // Create a cosmic star
      const pos = this.calculateStarPosition(birthOrder);
      const varietyObj = this.STAR_VARIETIES[(birthOrder - 365) % this.STAR_VARIETIES.length];

      db.prepare(`
        INSERT INTO garden_elements (
          id, letter_id, element_type, variety, pos_x, pos_y, pos_z, rot_y, scale, color, birth_order, created_at
        ) VALUES (?, ?, 'STAR', ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'))
      `).run(id, letterId, varietyObj.variety, pos.x, pos.y, pos.z, pos.scale, varietyObj.color, birthOrder);

      return {
        id,
        letter_id: letterId,
        element_type: 'STAR',
        variety: varietyObj.variety,
        pos_x: pos.x,
        pos_y: pos.y,
        pos_z: pos.z,
        rot_y: 0,
        scale: pos.scale,
        color: varietyObj.color,
        birth_order: birthOrder,
        created_at: new Date().toISOString()
      };
    }
  }

  /**
   * Retrieves overall garden state, telemetry, and milestone progress.
   */
  public static getGardenState(): {
    totalConfirmedSent: number;
    flowerCount: number;
    starCount: number;
    stage: StageName;
    nextMilestone: { target: number; label: string; remaining: number; progressPercent: number };
  } {
    const db = getDatabase();

    const confirmedCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM dispatch_logs 
      WHERE delivery_status = 'SENT' AND is_test = 0
    `).get() as { count: number };
    const totalConfirmedSent = confirmedCountRow ? confirmedCountRow.count : 0;

    const flowerCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM garden_elements 
      WHERE element_type IN ('PROTAGONIST_FLOWER', 'GARDEN_FLOWER')
    `).get() as { count: number };
    const flowerCount = flowerCountRow ? flowerCountRow.count : 1;

    const starCountRow = db.prepare(`
      SELECT COUNT(*) as count FROM garden_elements 
      WHERE element_type = 'STAR'
    `).get() as { count: number };
    const starCount = starCountRow ? starCountRow.count : 0;

    const stage = this.calculateStage(totalConfirmedSent);

    let nextMilestone = {
      target: 365,
      label: 'Hito de 365 Días — La Tierra desde el Espacio',
      remaining: Math.max(0, 365 - totalConfirmedSent),
      progressPercent: Math.min(100, Math.round((totalConfirmedSent / 365) * 100))
    };

    if (totalConfirmedSent >= 365 && totalConfirmedSent < 500) {
      nextMilestone = {
        target: 500,
        label: 'El Universo del Amor — Galaxias y Nebulosas',
        remaining: Math.max(0, 500 - totalConfirmedSent),
        progressPercent: Math.min(100, Math.round(((totalConfirmedSent - 365) / 135) * 100))
      };
    } else if (totalConfirmedSent >= 500) {
      nextMilestone = {
        target: 1000,
        label: 'Cosmos Infinito de Amor',
        remaining: Math.max(0, 1000 - totalConfirmedSent),
        progressPercent: Math.min(100, Math.round(((totalConfirmedSent - 500) / 500) * 100))
      };
    }

    return {
      totalConfirmedSent,
      flowerCount,
      starCount,
      stage,
      nextMilestone
    };
  }

  /**
   * Retrieves all visual elements with their associated letters for interactive inspection.
   */
  public static getAllElements(): VisualElement[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT 
        ge.*,
        l.id as l_id,
        l.title as l_title,
        l.category as l_category,
        l.content as l_content,
        dl.sent_at as l_sent_at
      FROM garden_elements ge
      LEFT JOIN letters l ON ge.letter_id = l.id
      LEFT JOIN dispatch_logs dl ON l.id = dl.letter_id AND dl.delivery_status = 'SENT'
      ORDER BY ge.birth_order ASC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      letter_id: r.letter_id,
      element_type: r.element_type,
      variety: r.variety,
      pos_x: r.pos_x,
      pos_y: r.pos_y,
      pos_z: r.pos_z,
      rot_y: r.rot_y,
      scale: r.scale,
      color: r.color,
      birth_order: r.birth_order,
      created_at: r.created_at,
      letter: r.l_id ? {
        id: r.l_id,
        title: r.l_title || 'Carta de amor',
        category: r.l_category,
        content: r.l_content,
        sent_at: r.l_sent_at
      } : (r.birth_order === 0 ? {
        id: 'initial-bloom',
        title: 'El Comienzo de Nuestra Historia',
        category: 'Nuestra Primera Flor',
        content: 'Esta flor marca el primer latido de nuestro jardín eterno. Cada amanecer que compartimos traerá una nueva flor a este rincón sagrado, hasta llenar la tierra y alcanzar las estrellas.',
        sent_at: r.created_at
      } : undefined)
    }));
  }
}
