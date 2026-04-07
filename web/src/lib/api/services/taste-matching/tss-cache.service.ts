import type { TasteCategory, TasteSimilarity } from '@prisma/client';
import { prisma } from '../../clients/prisma';
import { redis, getJson, setJson } from '../../clients/redis';

interface TssCacheEntry {
  score: number;
  overlapCount: number;
}

export const tssCacheService = {
  async getPairScore(
    userAId: string,
    userBId: string,
    category: TasteCategory,
  ): Promise<TssCacheEntry | null> {
    const [canonA, canonB] = userAId < userBId
      ? [userAId, userBId]
      : [userBId, userAId];

    const cacheKey = `p2:tss:${canonA}:${canonB}:${category}`;
    const cached = await getJson<TssCacheEntry>(cacheKey);
    if (cached) return cached;

    const row = await prisma.tasteSimilarity.findUnique({
      where: {
        userAId_userBId_category: {
          userAId: canonA,
          userBId: canonB,
          category,
        },
      },
    });
    if (!row) return null;

    const entry = { score: row.score, overlapCount: row.overlapCount };
    await setJson(cacheKey, entry, 86400); // 24h
    return entry;
  },

  async getAllScoresForUser(userId: string): Promise<
    Array<{ userId: string; category: TasteCategory; score: number; overlapCount: number }>
  > {
    const cacheKey = `p2:tss:all:${userId}`;
    const cached = await getJson<
      Array<{ userId: string; category: TasteCategory; score: number; overlapCount: number }>
    >(cacheKey);
    if (cached) return cached;

    const rows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { score: 'desc' },
    });

    const result = rows.map((r: TasteSimilarity) => ({
      userId: r.userAId === userId ? r.userBId : r.userAId,
      category: r.category,
      score: r.score,
      overlapCount: r.overlapCount,
    }));

    await setJson(cacheKey, result, 86400); // 24h
    return result;
  },

  async getHighTssUserIds(userId: string, minScore = 0.7): Promise<string[]> {
    const cacheKey = `p2:tss:high:${userId}`;
    const cached = await getJson<string[]>(cacheKey);
    if (cached) return cached;

    const rows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        score: { gte: minScore },
      },
      select: { userAId: true, userBId: true },
    });

    const ids: string[] = [...new Set<string>(
      rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId)),
    )];
    await setJson(cacheKey, ids, 86400);
    return ids;
  },

  async getModerateTssUserIds(userId: string): Promise<string[]> {
    const cacheKey = `p2:tss:moderate:${userId}`;
    const cached = await getJson<string[]>(cacheKey);
    if (cached) return cached;

    const rows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        score: { gte: 0.5, lt: 0.7 },
      },
      select: { userAId: true, userBId: true },
    });

    const ids: string[] = [...new Set<string>(
      rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId)),
    )];
    await setJson(cacheKey, ids, 86400);
    return ids;
  },

  async getPinnedFriendIds(userId: string): Promise<string[]> {
    const cacheKey = `p2:friends:${userId}`;
    const cached = await getJson<string[]>(cacheKey);
    if (cached) return cached;

    const pins = await prisma.gourmetFriendPin.findMany({
      where: { pinnerId: userId },
      select: { pinnedId: true },
    });

    const ids = pins.map((p) => p.pinnedId);
    await setJson(cacheKey, ids, 3600); // 1h
    return ids;
  },

  async invalidateUserCaches(userId: string) {
    const keys = [
      `p2:tss:high:${userId}`,
      `p2:tss:moderate:${userId}`,
      `p2:tss:all:${userId}`,
      `p2:friends:${userId}`,
    ];
    await redis.del(...keys);
  },
};
