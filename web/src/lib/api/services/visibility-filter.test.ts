import { describe, it, expect } from 'vitest';
import { buildVisibilityFilter } from './visibility-filter';

describe('buildVisibilityFilter', () => {
  const viewerId = 'viewer-123';

  it('includes PUBLIC notes', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toContainEqual({ visibility: 'PUBLIC' });
  });

  it('includes own notes', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toContainEqual({ authorId: viewerId });
  });

  it('includes FRIENDS notes where author pinned the viewer', () => {
    const f = buildVisibilityFilter(viewerId);
    const friendsClause = f.OR.find(
      (c: Record<string, unknown>) => c.visibility === 'FRIENDS',
    );
    expect(friendsClause).toEqual({
      visibility: 'FRIENDS',
      author: { pinnedFriends: { some: { pinnedId: viewerId } } },
    });
  });

  it('returns exactly three OR clauses', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toHaveLength(3);
  });
});
