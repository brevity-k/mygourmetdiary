import { describe, it, expect } from 'vitest';
import { assignTiers } from './community-gourmets.service';

describe('assignTiers', () => {
  const pinnedIds = new Set(['friend-1', 'friend-2']);
  const tssScores = new Map<string, number>([
    ['friend-1', 0.85],
    ['user-high-tss', 0.75],
    ['user-low-tss', 0.4],
  ]);

  const authors = [
    { userId: 'friend-1', noteCount: 3, displayName: 'Friend One', avatarUrl: null },
    { userId: 'friend-2', noteCount: 1, displayName: 'Friend Two', avatarUrl: null },
    { userId: 'user-high-tss', noteCount: 5, displayName: 'High TSS', avatarUrl: null },
    { userId: 'user-low-tss', noteCount: 8, displayName: 'Low TSS', avatarUrl: null },
    { userId: 'user-no-tss', noteCount: 12, displayName: 'No TSS', avatarUrl: null },
  ];

  it('assigns tier 1 to pinned friends', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier1 = result.filter((g) => g.tier === 1);
    expect(tier1).toHaveLength(2);
    expect(tier1.map((g) => g.user.id)).toContain('friend-1');
    expect(tier1.map((g) => g.user.id)).toContain('friend-2');
  });

  it('assigns tier 2 to non-pinned users with TSS >= 0.7', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier2 = result.filter((g) => g.tier === 2);
    expect(tier2).toHaveLength(1);
    expect(tier2[0].user.id).toBe('user-high-tss');
  });

  it('assigns tier 3 to remaining users', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier3 = result.filter((g) => g.tier === 3);
    expect(tier3).toHaveLength(2);
  });

  it('sorts tier 1 by TSS desc, tier 3 by noteCount desc', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    expect(result[0].user.id).toBe('friend-1');
    expect(result[3].user.id).toBe('user-no-tss');
    expect(result[4].user.id).toBe('user-low-tss');
  });

  it('respects limit', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty array when no authors', () => {
    const result = assignTiers([], pinnedIds, tssScores, 5);
    expect(result).toEqual([]);
  });
});
