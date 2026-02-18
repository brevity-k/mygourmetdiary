import { Injectable } from '@nestjs/common';
import { TasteCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface TssCacheEntry {
  score: number;
  overlapCount: number;
}

@Injectable()
export class TssCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getPairScore(
    userAId: string,
    userBId: string,
    category: TasteCategory,
  ): Promise<TssCacheEntry | null> {
    const [canonA, canonB] = userAId < userBId
      ? [userAId, userBId]
      : [userBId, userAId];

    const cacheKey = `p2:tss:${canonA}:${canonB}:${category}`;
    const cached = await this.redis.getJson<TssCacheEntry>(cacheKey);
    if (cached) return cached;

    const row = await this.prisma.tasteSimilarity.findUnique({
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
    await this.redis.setJson(cacheKey, entry, 86400); // 24h
    return entry;
  }

  async getAllScoresForUser(userId: string): Promise<
    Array<{ userId: string; category: TasteCategory; score: number; overlapCount: number }>
  > {
    const rows = await this.prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      orderBy: { score: 'desc' },
    });

    return rows.map((r) => ({
      userId: r.userAId === userId ? r.userBId : r.userAId,
      category: r.category,
      score: r.score,
      overlapCount: r.overlapCount,
    }));
  }

  async getHighTssUserIds(userId: string, minScore = 0.7): Promise<string[]> {
    const cacheKey = `p2:tss:high:${userId}`;
    const cached = await this.redis.getJson<string[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        score: { gte: minScore },
      },
      select: { userAId: true, userBId: true },
    });

    const ids = [...new Set(
      rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId)),
    )];
    await this.redis.setJson(cacheKey, ids, 86400);
    return ids;
  }

  async getModerateTssUserIds(userId: string): Promise<string[]> {
    const cacheKey = `p2:tss:moderate:${userId}`;
    const cached = await this.redis.getJson<string[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.tasteSimilarity.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        score: { gte: 0.5, lt: 0.7 },
      },
      select: { userAId: true, userBId: true },
    });

    const ids = [...new Set(
      rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId)),
    )];
    await this.redis.setJson(cacheKey, ids, 86400);
    return ids;
  }

  async getPinnedFriendIds(userId: string): Promise<string[]> {
    const cacheKey = `p2:friends:${userId}`;
    const cached = await this.redis.getJson<string[]>(cacheKey);
    if (cached) return cached;

    const pins = await this.prisma.gourmetFriendPin.findMany({
      where: { pinnerId: userId },
      select: { pinnedId: true },
    });

    const ids = pins.map((p) => p.pinnedId);
    await this.redis.setJson(cacheKey, ids, 3600); // 1h
    return ids;
  }

  async invalidateUserCaches(userId: string) {
    const keys = [
      `p2:tss:high:${userId}`,
      `p2:tss:moderate:${userId}`,
      `p2:friends:${userId}`,
    ];
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
