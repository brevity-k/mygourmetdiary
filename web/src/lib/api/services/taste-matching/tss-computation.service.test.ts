import { describe, it, expect } from 'vitest';
import { tssComputationService } from './tss-computation.service';

const { buildMatchKey, computeTss, noteTypeToCategory } = tssComputationService;

// ─── buildMatchKey ──────────────────────────────────────

describe('buildMatchKey', () => {
  it('builds restaurant key from venueId + dishName', () => {
    const key = buildMatchKey('RESTAURANT', { dishName: 'Salmon Bowl' }, 'venue_123');
    expect(key).toBe('r:venue_123:salmon bowl');
  });

  it('returns null for restaurant without venueId', () => {
    expect(buildMatchKey('RESTAURANT', { dishName: 'Salmon' }, null)).toBeNull();
  });

  it('returns null for restaurant without dishName', () => {
    expect(buildMatchKey('RESTAURANT', {}, 'venue_123')).toBeNull();
  });

  it('builds wine key from name + vintage', () => {
    const key = buildMatchKey('WINE', { wineName: 'Opus One', vintage: 2019 }, null);
    expect(key).toBe('w:opus one:2019');
  });

  it('uses nv for wine without vintage', () => {
    const key = buildMatchKey('WINE', { wineName: 'Champagne Brut' }, null);
    expect(key).toBe('w:champagne brut:nv');
  });

  it('returns null for wine without name', () => {
    expect(buildMatchKey('WINE', {}, null)).toBeNull();
  });

  it('builds spirit key from name + distillery', () => {
    const key = buildMatchKey('SPIRIT', { spiritName: 'Lagavulin 16', distillery: 'Lagavulin' }, null);
    expect(key).toBe('s:lagavulin 16:lagavulin');
  });

  it('handles spirit without distillery', () => {
    const key = buildMatchKey('SPIRIT', { spiritName: 'Nikka Coffey' }, null);
    expect(key).toBe('s:nikka coffey:');
  });

  it('returns null for WINERY_VISIT type', () => {
    expect(buildMatchKey('WINERY_VISIT', {}, 'venue_1')).toBeNull();
  });
});

// ─── noteTypeToCategory ────────────────────────────────

describe('noteTypeToCategory', () => {
  it('maps RESTAURANT → RESTAURANT', () => {
    expect(noteTypeToCategory('RESTAURANT')).toBe('RESTAURANT');
  });

  it('maps WINE → WINE', () => {
    expect(noteTypeToCategory('WINE')).toBe('WINE');
  });

  it('maps SPIRIT → SPIRIT', () => {
    expect(noteTypeToCategory('SPIRIT')).toBe('SPIRIT');
  });

  it('returns null for WINERY_VISIT', () => {
    expect(noteTypeToCategory('WINERY_VISIT')).toBeNull();
  });
});

// ─── computeTss ────────────────────────────────────────

describe('computeTss', () => {
  const now = new Date('2026-04-08');

  function makeItem(matchKey: string, rating: number, daysAgo = 0) {
    return {
      noteId: `note_${matchKey}_${rating}`,
      authorId: 'user_a',
      rating,
      matchKey,
      experiencedAt: new Date(now.getTime() - daysAgo * 86400000),
    };
  }

  it('returns score 0 with overlapCount when below MIN_OVERLAP (5)', () => {
    const itemsA = [makeItem('r:v1:ramen', 8), makeItem('r:v2:sushi', 7)];
    const itemsB = [makeItem('r:v1:ramen', 8), makeItem('r:v2:sushi', 6)];

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(2);
    expect(result.score).toBe(0);
  });

  it('returns perfect score (1.0) for identical ratings', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    const itemsA = keys.map((k) => makeItem(k, 8));
    const itemsB = keys.map((k) => makeItem(k, 8));

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(5);
    expect(result.score).toBe(1);
  });

  it('returns 0 score for maximally different ratings (1 vs 10)', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    const itemsA = keys.map((k) => makeItem(k, 1));
    const itemsB = keys.map((k) => makeItem(k, 10));

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(5);
    expect(result.score).toBe(0);
  });

  it('calculates correct score for partial agreement', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    // All ratings differ by 1 → similarity per item = 1 - 1/9 = 8/9
    const itemsA = keys.map((k) => makeItem(k, 7));
    const itemsB = keys.map((k) => makeItem(k, 8));

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(5);
    expect(result.score).toBeCloseTo(8 / 9, 2);
  });

  it('only counts overlapping items', () => {
    const sharedKeys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    const itemsA = [
      ...sharedKeys.map((k) => makeItem(k, 8)),
      makeItem('r:v6:extra', 3), // no overlap
    ];
    const itemsB = [
      ...sharedKeys.map((k) => makeItem(k, 8)),
      makeItem('r:v7:unique', 9), // no overlap
    ];

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(5);
    expect(result.score).toBe(1);
  });

  it('applies recency weighting — recent items weigh more', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];

    // All items experienced recently with same rating → score 1.0
    const recentA = keys.map((k) => makeItem(k, 8, 0));
    const recentB = keys.map((k) => makeItem(k, 8, 0));
    const recentResult = computeTss(recentA, recentB, now);

    // All items experienced long ago with same rating → still perfect but weights are lower
    const oldA = keys.map((k) => makeItem(k, 8, 365));
    const oldB = keys.map((k) => makeItem(k, 8, 365));
    const oldResult = computeTss(oldA, oldB, now);

    // Same ratings means same score regardless of recency (weights cancel out)
    expect(recentResult.score).toBe(1);
    expect(oldResult.score).toBe(1);
  });

  it('returns 0 overlapCount when no items match', () => {
    const itemsA = [makeItem('r:v1:a', 8)];
    const itemsB = [makeItem('r:v2:b', 8)];

    const result = computeTss(itemsA, itemsB, now);
    expect(result.overlapCount).toBe(0);
    expect(result.score).toBe(0);
  });

  it('handles empty arrays', () => {
    const result = computeTss([], [], now);
    expect(result.overlapCount).toBe(0);
    expect(result.score).toBe(0);
  });
});
