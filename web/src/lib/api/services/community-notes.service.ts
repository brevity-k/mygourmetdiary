import type { CommunitySubjectType } from '@mygourmetdiary/shared-types';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { buildVisibilityFilter } from './visibility-filter';
import { tssCacheService } from './taste-matching/tss-cache.service';

const CACHE_TTL = 60; // 1 minute

// ─── Pure function: assign tier based on author relationship ────────

export function assignNoteTier(
  authorId: string,
  pinnedIds: Set<string>,
  tssScores: Map<string, number>,
): 1 | 2 | 3 | 4 {
  if (pinnedIds.has(authorId)) return 1;
  const tss = tssScores.get(authorId);
  if (tss !== undefined && tss >= 0.7) return 2;
  if (tss !== undefined) return 3;
  return 4;
}

// ─── Service: paginated community notes with tier assignment ────────

export const communityNotesService = {
  async getBySubject(
    viewerId: string,
    subjectType: CommunitySubjectType,
    subjectId: string,
    noteField: string,
    cursor?: string,
    limit = 20,
  ) {
    const cacheKey = `community-notes:${subjectType}:${subjectId}:${viewerId}:${cursor || 'first'}`;
    const cached = await getJson<{
      items: Array<Record<string, unknown>>;
      nextCursor: string | null;
      hasMore: boolean;
    }>(cacheKey);
    if (cached) return cached;

    // Build WHERE clause with visibility filter + subject filter
    const where: Record<string, unknown> = {
      ...buildVisibilityFilter(viewerId),
      [noteField]: subjectId,
    };

    // Cursor-based pagination: fetch notes older than cursor
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Fetch limit + 1 to detect if there are more results
    const notes = await prisma.note.findMany({
      where,
      include: {
        venue: true,
        product: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        author: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notes.length > limit;
    const trimmed = hasMore ? notes.slice(0, limit) : notes;

    // Get author IDs for tier assignment
    const authorIds = [...new Set(trimmed.map((n) => n.authorId))];

    // Fetch pinned friend IDs and TSS scores
    const [pinnedIdsList, tssRows] = await Promise.all([
      tssCacheService.getPinnedFriendIds(viewerId),
      authorIds.length > 0
        ? prisma.tasteSimilarity.findMany({
            where: {
              OR: [
                { userAId: viewerId, userBId: { in: authorIds } },
                { userBId: viewerId, userAId: { in: authorIds } },
              ],
            },
            select: { userAId: true, userBId: true, score: true },
          })
        : Promise.resolve([]),
    ]);

    const pinnedIds = new Set(pinnedIdsList);

    // Build per-author max TSS score
    const tssMaxScores = new Map<string, number>();
    for (const row of tssRows) {
      const otherId = row.userAId === viewerId ? row.userBId : row.userAId;
      const existing = tssMaxScores.get(otherId);
      if (existing === undefined || row.score > existing) {
        tssMaxScores.set(otherId, row.score);
      }
    }

    // Assign tiers and serialize
    const items = trimmed.map((note) => {
      const tier = assignNoteTier(note.authorId, pinnedIds, tssMaxScores);
      return {
        ...note,
        tier,
        experiencedAt: note.experiencedAt.toISOString(),
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      };
    });

    // Sort: tier asc, then createdAt desc within tier
    items.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const nextCursor = hasMore
      ? trimmed[trimmed.length - 1].createdAt.toISOString()
      : null;

    const result = { items, nextCursor, hasMore };

    await setJson(cacheKey, result, CACHE_TTL);
    return result;
  },
};
