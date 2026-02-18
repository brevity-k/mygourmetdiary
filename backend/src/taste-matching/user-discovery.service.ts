import { Injectable } from '@nestjs/common';
import { TasteCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TssCacheService } from './tss-cache.service';

@Injectable()
export class UserDiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tssCache: TssCacheService,
  ) {}

  async getSimilarUsers(
    userId: string,
    category?: TasteCategory,
    limit = 20,
    offset = 0,
  ) {
    const allScores = await this.tssCache.getAllScoresForUser(userId);

    // Filter by category if specified
    let filtered = category
      ? allScores.filter((s) => s.category === category)
      : allScores;

    // Group by user, keeping best score per user
    const userMap = new Map<string, {
      userId: string;
      bestCategory: TasteCategory;
      bestScore: number;
      categories: Array<{ category: TasteCategory; score: number; overlapCount: number }>;
    }>();

    for (const entry of filtered) {
      const existing = userMap.get(entry.userId);
      if (!existing) {
        userMap.set(entry.userId, {
          userId: entry.userId,
          bestCategory: entry.category,
          bestScore: entry.score,
          categories: [{ category: entry.category, score: entry.score, overlapCount: entry.overlapCount }],
        });
      } else {
        existing.categories.push({
          category: entry.category,
          score: entry.score,
          overlapCount: entry.overlapCount,
        });
        if (entry.score > existing.bestScore) {
          existing.bestScore = entry.score;
          existing.bestCategory = entry.category;
        }
      }
    }

    // Sort by best score descending
    const sorted = Array.from(userMap.values()).sort(
      (a, b) => b.bestScore - a.bestScore,
    );

    // Paginate
    const paged = sorted.slice(offset, offset + limit);

    // Fetch user profiles
    const userIds = paged.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatarUrl: true, createdAt: true },
    });
    const userLookup = new Map(users.map((u) => [u.id, u]));

    return {
      items: paged
        .map((entry) => {
          const user = userLookup.get(entry.userId);
          if (!user) return null;
          return {
            user,
            bestCategory: entry.bestCategory,
            bestScore: entry.bestScore,
            sharedItemCount: entry.categories.reduce((sum, c) => sum + c.overlapCount, 0),
            similarities: entry.categories,
          };
        })
        .filter(Boolean),
      total: sorted.length,
      limit,
      offset,
    };
  }
}
