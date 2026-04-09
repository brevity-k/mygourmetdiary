import { describe, it, expect } from 'vitest';
import {
  createNoteSchema,
  updateNoteSchema,
  validateExtension,
} from './notes';

// ─── validateExtension ─────────────────────────────────

describe('validateExtension', () => {
  it('accepts valid restaurant extension', () => {
    const result = validateExtension('RESTAURANT', {
      dishName: 'Salmon Bowl',
      dishCategory: 'MAIN',
      wouldOrderAgain: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects restaurant extension missing required fields', () => {
    const result = validateExtension('RESTAURANT', {
      dishName: 'Salmon Bowl',
      // missing dishCategory and wouldOrderAgain
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid wine extension', () => {
    const result = validateExtension('WINE', {
      wineName: 'Opus One',
      wineType: 'RED',
    });
    expect(result.success).toBe(true);
  });

  it('rejects wine with invalid wineType', () => {
    const result = validateExtension('WINE', {
      wineName: 'Test',
      wineType: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid spirit extension', () => {
    const result = validateExtension('SPIRIT', {
      spiritName: 'Lagavulin 16',
      spiritType: 'WHISKEY',
      abv: 43,
    });
    expect(result.success).toBe(true);
  });

  it('rejects spirit with ABV > 100', () => {
    const result = validateExtension('SPIRIT', {
      spiritName: 'Test',
      spiritType: 'WHISKEY',
      abv: 150,
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid winery visit extension', () => {
    const result = validateExtension('WINERY_VISIT', {
      wouldRevisit: true,
      ambianceRating: 8,
    });
    expect(result.success).toBe(true);
  });

  it('rejects winery visit with rating > 10', () => {
    const result = validateExtension('WINERY_VISIT', {
      wouldRevisit: true,
      ambianceRating: 15,
    });
    expect(result.success).toBe(false);
  });

  it('returns error for unknown note type', () => {
    const result = validateExtension('UNKNOWN', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown note type');
  });
});

// ─── createNoteSchema ──────────────────────────────────

describe('createNoteSchema', () => {
  const validNote = {
    type: 'RESTAURANT' as const,
    title: 'Great ramen spot',
    binderId: 'binder_123',
    rating: 8,
    extension: { dishName: 'Tonkotsu', dishCategory: 'MAIN', wouldOrderAgain: true },
    experiencedAt: '2026-04-08',
  };

  it('accepts a valid note', () => {
    const result = createNoteSchema.safeParse(validNote);
    expect(result.success).toBe(true);
  });

  it('rejects rating below 1', () => {
    const result = createNoteSchema.safeParse({ ...validNote, rating: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects rating above 10', () => {
    const result = createNoteSchema.safeParse({ ...validNote, rating: 11 });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = createNoteSchema.safeParse({ ...validNote, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid note type', () => {
    const result = createNoteSchema.safeParse({ ...validNote, type: 'COCKTAIL' });
    expect(result.success).toBe(false);
  });

  it('accepts ISO datetime with offset', () => {
    const result = createNoteSchema.safeParse({
      ...validNote,
      experiencedAt: '2026-04-08T10:30:00+09:00',
    });
    expect(result.success).toBe(true);
  });
});

// ─── updateNoteSchema ──────────────────────────────────

describe('updateNoteSchema', () => {
  it('accepts partial update with just rating', () => {
    const result = updateNoteSchema.safeParse({ rating: 9 });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields updated)', () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects freeText over 5000 chars', () => {
    const result = updateNoteSchema.safeParse({ freeText: 'x'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});
