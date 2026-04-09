import { describe, it, expect } from 'vitest';
import { assignNoteTier } from './community-notes.service';

describe('assignNoteTier', () => {
  const pinnedIds = new Set(['friend-1']);
  const tssScores = new Map([['high-tss', 0.8], ['low-tss', 0.4]]);

  it('assigns tier 1 to notes from pinned friends', () => {
    expect(assignNoteTier('friend-1', pinnedIds, tssScores)).toBe(1);
  });

  it('assigns tier 2 to notes from high-TSS authors (>= 0.7)', () => {
    expect(assignNoteTier('high-tss', pinnedIds, tssScores)).toBe(2);
  });

  it('assigns tier 3 to notes from low-TSS authors (< 0.7)', () => {
    expect(assignNoteTier('low-tss', pinnedIds, tssScores)).toBe(3);
  });

  it('assigns tier 4 to notes from unknown authors (no TSS data)', () => {
    expect(assignNoteTier('random', pinnedIds, tssScores)).toBe(4);
  });
});
