import { describe, it, expect } from 'vitest';
import { buildRatingDistribution, computeStats } from './community-stats.service';

describe('buildRatingDistribution', () => {
  it('builds histogram from grouped rating counts', () => {
    const grouped = [
      { rating: 7, _count: { id: 3 } },
      { rating: 9, _count: { id: 1 } },
    ];
    const dist = buildRatingDistribution(grouped);
    expect(dist['7']).toBe(3);
    expect(dist['9']).toBe(1);
    expect(dist['1']).toBe(0);
  });

  it('returns all zeros for empty input', () => {
    const dist = buildRatingDistribution([]);
    for (let i = 1; i <= 10; i++) expect(dist[String(i)]).toBe(0);
  });
});

describe('computeStats', () => {
  it('rounds avgRating to one decimal', () => {
    const result = computeStats('venue', 'v1', 15, 4, 7.666);
    expect(result.avgRating).toBe(7.7);
  });

  it('returns null avgRating when no notes', () => {
    const result = computeStats('venue', 'v1', 0, 0, null);
    expect(result.avgRating).toBeNull();
    expect(result.totalNotes).toBe(0);
  });

  it('preserves subjectType and subjectId', () => {
    const result = computeStats('product', 'p1', 5, 2, 8.0);
    expect(result.subjectType).toBe('product');
    expect(result.subjectId).toBe('p1');
  });
});
