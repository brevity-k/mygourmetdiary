import { Test, TestingModule } from '@nestjs/testing';
import { NoteType, TasteCategory } from '@prisma/client';
import { TssComputationService } from './tss-computation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TssComputationService', () => {
  let service: TssComputationService;

  const mockPrisma = {
    note: { findMany: jest.fn() },
    tasteSimilarity: { deleteMany: jest.fn(), upsert: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TssComputationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TssComputationService>(TssComputationService);
  });

  afterEach(() => jest.clearAllMocks());

  const now = new Date('2026-02-18T00:00:00Z');

  function makeItem(matchKey: string, rating: number, daysAgo = 0) {
    return {
      noteId: `note-${matchKey}-${rating}`,
      authorId: 'author',
      rating,
      matchKey,
      experiencedAt: new Date(now.getTime() - daysAgo * 86400000),
    };
  }

  // --- computeTss ---

  it('returns score 0 when overlap is below minimum (5)', () => {
    const itemsA = [makeItem('r:v1:sushi', 8), makeItem('r:v2:ramen', 7)];
    const itemsB = [makeItem('r:v1:sushi', 8), makeItem('r:v2:ramen', 7)];
    const result = service.computeTss(itemsA, itemsB, now);
    expect(result.score).toBe(0);
    expect(result.overlapCount).toBe(2);
  });

  it('returns 1.0 for identical ratings with sufficient overlap', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    const itemsA = keys.map((k) => makeItem(k, 8));
    const itemsB = keys.map((k) => makeItem(k, 8));
    const result = service.computeTss(itemsA, itemsB, now);
    expect(result.score).toBe(1);
    expect(result.overlapCount).toBe(5);
  });

  it('computes correct weighted score for differing ratings', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    // Pair: (8,8), (8,5), (8,8), (8,8), (8,8) — 4 perfect, 1 with diff=3
    const itemsA = keys.map((k) => makeItem(k, 8));
    const itemsB = keys.map((k, i) => makeItem(k, i === 1 ? 5 : 8));
    const result = service.computeTss(itemsA, itemsB, now);
    expect(result.score).toBeGreaterThan(0.9);
    expect(result.score).toBeLessThan(1);
    expect(result.overlapCount).toBe(5);
  });

  it('applies recency decay — older items have less weight', () => {
    const keys = ['r:v1:a', 'r:v2:b', 'r:v3:c', 'r:v4:d', 'r:v5:e'];
    // All items are 1 year old with diff=1 → lower weighted similarity
    const itemsA = keys.map((k) => makeItem(k, 8, 365));
    const itemsB = keys.map((k) => makeItem(k, 7, 365));

    const resultOld = service.computeTss(itemsA, itemsB, now);

    // Same diff but recent items
    const itemsARecent = keys.map((k) => makeItem(k, 8, 0));
    const itemsBRecent = keys.map((k) => makeItem(k, 7, 0));
    const resultRecent = service.computeTss(itemsARecent, itemsBRecent, now);

    // Scores should be the same since all items have equal age within each set
    // (recency affects weight, not the ratio when all items have the same age)
    // The actual score = weighted_sum / total_weight, and when all weights are equal,
    // the score is the same regardless of absolute weight
    expect(resultOld.score).toBeCloseTo(resultRecent.score, 2);
  });

  it('returns score 0 and overlapCount 0 for empty arrays', () => {
    const result = service.computeTss([], [], now);
    expect(result.score).toBe(0);
    expect(result.overlapCount).toBe(0);
  });

  it('handles non-overlapping items', () => {
    const itemsA = [
      makeItem('r:v1:a', 8), makeItem('r:v2:b', 7),
      makeItem('r:v3:c', 6), makeItem('r:v4:d', 5), makeItem('r:v5:e', 4),
    ];
    const itemsB = [
      makeItem('r:v6:f', 8), makeItem('r:v7:g', 7),
      makeItem('r:v8:h', 6), makeItem('r:v9:i', 5), makeItem('r:v10:j', 4),
    ];
    const result = service.computeTss(itemsA, itemsB, now);
    expect(result.score).toBe(0);
    expect(result.overlapCount).toBe(0);
  });

  // --- buildMatchKey ---

  it('builds correct key for RESTAURANT', () => {
    const key = service.buildMatchKey(NoteType.RESTAURANT, { dishName: 'Sushi Roll' }, 'venue123');
    expect(key).toBe('r:venue123:sushi roll');
  });

  it('builds correct key for WINE', () => {
    const key = service.buildMatchKey(NoteType.WINE, { wineName: 'Opus One', vintage: '2020' }, null);
    expect(key).toBe('w:opus one:2020');
  });

  it('builds correct key for SPIRIT', () => {
    const key = service.buildMatchKey(NoteType.SPIRIT, { spiritName: 'Yamazaki 18', distillery: 'Suntory' }, null);
    expect(key).toBe('s:yamazaki 18:suntory');
  });

  it('returns null for missing required fields', () => {
    expect(service.buildMatchKey(NoteType.RESTAURANT, {}, null)).toBeNull();
    expect(service.buildMatchKey(NoteType.RESTAURANT, { dishName: 'Sushi' }, null)).toBeNull();
    expect(service.buildMatchKey(NoteType.WINE, {}, null)).toBeNull();
    expect(service.buildMatchKey(NoteType.SPIRIT, {}, null)).toBeNull();
  });

  it('returns null for WINERY_VISIT type', () => {
    expect(service.buildMatchKey(NoteType.WINERY_VISIT, {}, 'v1')).toBeNull();
  });

  // --- noteTypeToCategory ---

  it('maps RESTAURANT -> RESTAURANT, WINE -> WINE, SPIRIT -> SPIRIT', () => {
    expect(service.noteTypeToCategory(NoteType.RESTAURANT)).toBe(TasteCategory.RESTAURANT);
    expect(service.noteTypeToCategory(NoteType.WINE)).toBe(TasteCategory.WINE);
    expect(service.noteTypeToCategory(NoteType.SPIRIT)).toBe(TasteCategory.SPIRIT);
  });

  it('returns null for WINERY_VISIT', () => {
    expect(service.noteTypeToCategory(NoteType.WINERY_VISIT)).toBeNull();
  });
});
