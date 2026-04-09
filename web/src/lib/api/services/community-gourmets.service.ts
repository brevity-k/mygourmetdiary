import type { CommunityGourmet, CommunitySubjectType, TasteSimilarity as TSSType } from '@mygourmetdiary/shared-types';
import type { TasteCategory } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { buildVisibilityFilter } from './visibility-filter';
import { tssCacheService } from './taste-matching/tss-cache.service';

const CACHE_TTL = 300; // 5 minutes

// ─── Author shape coming from groupBy + user lookup ─────────────────

interface AuthorRow {
  userId: string;
  noteCount: number;
  displayName: string;
  avatarUrl: string | null;
}

// ─── Pure function: assign tiers and sort ───────────────────────────

export function assignTiers(
  authors: AuthorRow[],
  pinnedIds: Set<string>,
  tssScores: Map<string, number>,
  limit: number,
): CommunityGourmet[] {
  if (authors.length === 0) return [];

  const gourmets: CommunityGourmet[] = authors.map((a) => {
    const isPinned = pinnedIds.has(a.userId);
    const tss = tssScores.get(a.userId) ?? null;

    let tier: 1 | 2 | 3;
    if (isPinned) {
      tier = 1;
    } else if (tss !== null && tss >= 0.7) {
      tier = 2;
    } else {
      tier = 3;
    }

    return {
      user: {
        id: a.userId,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        createdAt: '',
      },
      tier,
      noteCount: a.noteCount,
      tasteSimilarity: null,
      isPinned,
    };
  });

  gourmets.sort((a, b) => {
    // Primary: tier ascending (1 before 2 before 3)
    if (a.tier !== b.tier) return a.tier - b.tier;

    // Within tier 1 and 2: sort by TSS descending
    if (a.tier <= 2) {
      const tssA = tssScores.get(a.user.id) ?? 0;
      const tssB = tssScores.get(b.user.id) ?? 0;
      return tssB - tssA;
    }

    // Tier 3: sort by noteCount descending
    return b.noteCount - a.noteCount;
  });

  return gourmets.slice(0, limit);
}

// ─── Service: full data fetching + caching ──────────────────────────

export const communityGourmetsService = {
  async getGourmets(
    viewerId: string,
    subjectType: CommunitySubjectType,
    subjectId: string,
    noteField: string,
    limit: number,
  ): Promise<CommunityGourmet[]> {
    const cacheKey = `community-gourmets:${subjectType}:${subjectId}:${viewerId}`;
    const cached = await getJson<CommunityGourmet[]>(cacheKey);
    if (cached) return cached;

    // groupBy doesn't support relation-based filters, so use a simplified
    // visibility check: PUBLIC notes + viewer's own notes.
    // FRIENDS visibility requires a relation join which groupBy cannot do.
    const groupByWhere = {
      [noteField]: subjectId,
      OR: [
        { visibility: 'PUBLIC' as const },
        { authorId: viewerId },
      ],
    };

    // 1. Group notes by author for this subject
    const grouped = await prisma.note.groupBy({
      by: ['authorId'],
      where: groupByWhere,
      _count: { id: true },
    });

    // Exclude the viewer from results
    const authorEntries = grouped.filter((g) => g.authorId !== viewerId);
    const authorIds = authorEntries.map((g) => g.authorId);

    if (authorIds.length === 0) {
      await setJson(cacheKey, [], CACHE_TTL);
      return [];
    }

    // 2. Build note count map
    const noteCountMap = new Map<string, number>();
    for (const g of authorEntries) {
      const count = typeof g._count === 'object' && g._count !== null
        ? (g._count as { id: number }).id
        : 0;
      noteCountMap.set(g.authorId, count);
    }

    // 3. Fetch user profiles for author IDs
    const users = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const authors: AuthorRow[] = authorIds
      .map((id) => {
        const user = userMap.get(id);
        if (!user) return null;
        return {
          userId: id,
          noteCount: noteCountMap.get(id) ?? 0,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        };
      })
      .filter((a): a is AuthorRow => a !== null);

    // 4. Fetch viewer's pinned friend IDs
    const pinnedIdsList = await tssCacheService.getPinnedFriendIds(viewerId);
    const pinnedIds = new Set(pinnedIdsList);

    // 5. Fetch TSS scores between viewer and these authors
    const tssRows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [
          { userAId: viewerId, userBId: { in: authorIds } },
          { userBId: viewerId, userAId: { in: authorIds } },
        ],
      },
      select: { userAId: true, userBId: true, category: true, score: true, overlapCount: true },
    });

    // Build per-author max score (for tier assignment) and full TSS list
    const tssMaxScores = new Map<string, number>();
    const tssPerAuthor = new Map<string, TSSType[]>();
    for (const row of tssRows) {
      const otherId = row.userAId === viewerId ? row.userBId : row.userAId;

      // Max score for tier sorting
      const existing = tssMaxScores.get(otherId);
      if (existing === undefined || row.score > existing) {
        tssMaxScores.set(otherId, row.score);
      }

      // Full per-category breakdown
      const list = tssPerAuthor.get(otherId) ?? [];
      list.push({
        category: row.category as unknown as TSSType['category'],
        score: row.score,
        overlapCount: row.overlapCount,
      });
      tssPerAuthor.set(otherId, list);
    }

    // 6. Assign tiers and sort
    const result = assignTiers(authors, pinnedIds, tssMaxScores, limit);

    // 7. Attach full per-category TSS to each gourmet
    for (const gourmet of result) {
      const tssList = tssPerAuthor.get(gourmet.user.id);
      if (tssList && tssList.length > 0) {
        gourmet.tasteSimilarity = tssList;
      }
    }

    await setJson(cacheKey, result, CACHE_TTL);
    return result;
  },
};
