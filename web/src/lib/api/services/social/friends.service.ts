import type { TasteCategory } from '@prisma/client';
import { prisma } from '../../clients/prisma';
import { tssCacheService } from '../taste-matching/tss-cache.service';
import { notificationsService } from '../notifications.service';

const MIN_TSS = 0.7;
const MIN_OVERLAP = 5;
const FREE_PIN_LIMIT = 3;
const PREMIUM_TIER = 'CONNOISSEUR';

export const friendsService = {
  async pinFriend(pinnerId: string, dto: { pinnedId: string; categories: TasteCategory[] }) {
    if (pinnerId === dto.pinnedId) {
      throw new Error('Cannot pin yourself');
    }

    // Verify the pinned user exists
    const pinnedUser = await prisma.user.findUnique({
      where: { id: dto.pinnedId },
    });
    if (!pinnedUser) throw new Error('User not found');

    // Enforce pin limit for free users
    const pinner = await prisma.user.findUnique({
      where: { id: pinnerId },
      select: { subscriptionTier: true },
    });
    if (pinner?.subscriptionTier !== PREMIUM_TIER) {
      const existing = await prisma.gourmetFriendPin.findUnique({
        where: { pinnerId_pinnedId: { pinnerId, pinnedId: dto.pinnedId } },
      });
      if (!existing) {
        const count = await prisma.gourmetFriendPin.count({
          where: { pinnerId },
        });
        if (count >= FREE_PIN_LIMIT) {
          throw new Error(
            `Free tier limited to ${FREE_PIN_LIMIT} Gourmet Friend pins. Upgrade to Connoisseur for unlimited.`,
          );
        }
      }
    }

    // Validate TSS requirements for each requested category
    await validatePinCategories(pinnerId, dto.pinnedId, dto.categories);

    const pin = await prisma.gourmetFriendPin.upsert({
      where: {
        pinnerId_pinnedId: { pinnerId, pinnedId: dto.pinnedId },
      },
      create: {
        pinnerId,
        pinnedId: dto.pinnedId,
        categories: dto.categories,
      },
      update: {
        categories: dto.categories,
      },
      include: {
        pinned: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    await tssCacheService.invalidateUserCaches(pinnerId);

    // Notify pinned user (fire-and-forget)
    const pinnerUser = await prisma.user.findUnique({
      where: { id: pinnerId },
      select: { displayName: true },
    });
    notificationsService
      .notifyNewGourmetFriend(
        pinnerUser?.displayName ?? 'Someone',
        dto.pinnedId,
        pinnerId,
      )
      .catch((e) => console.warn('Failed to send gourmet friend notification', e));

    return pin;
  },

  async unpinFriend(pinnerId: string, pinnedId: string) {
    await prisma.gourmetFriendPin.deleteMany({
      where: { pinnerId, pinnedId },
    });
    await tssCacheService.invalidateUserCaches(pinnerId);
  },

  async updatePin(pinnerId: string, pinnedId: string, dto: { categories: TasteCategory[] }) {
    const existing = await prisma.gourmetFriendPin.findUnique({
      where: { pinnerId_pinnedId: { pinnerId, pinnedId } },
    });
    if (!existing) throw new Error('Pin not found');

    await validatePinCategories(pinnerId, pinnedId, dto.categories);

    return prisma.gourmetFriendPin.update({
      where: { pinnerId_pinnedId: { pinnerId, pinnedId } },
      data: { categories: dto.categories },
      include: {
        pinned: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  },

  async listFriends(pinnerId: string) {
    const pins = await prisma.gourmetFriendPin.findMany({
      where: { pinnerId },
      include: {
        pinned: {
          select: { id: true, displayName: true, avatarUrl: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Single cached call instead of N+1 per-friend cache lookups
    const allScores = await tssCacheService.getAllScoresForUser(pinnerId);
    const scoreMap = new Map<string, Map<TasteCategory, { score: number; overlapCount: number }>>();
    for (const entry of allScores) {
      if (!scoreMap.has(entry.userId)) scoreMap.set(entry.userId, new Map());
      scoreMap.get(entry.userId)!.set(entry.category, {
        score: entry.score,
        overlapCount: entry.overlapCount,
      });
    }

    const categories: TasteCategory[] = ['RESTAURANT', 'WINE', 'SPIRIT'];
    return pins.map((pin: { pinnedId: string; [key: string]: unknown }) => {
      const userScores = scoreMap.get(pin.pinnedId);
      const similarities = categories.map((category) => {
        const entry = userScores?.get(category);
        return {
          category,
          score: entry?.score ?? null,
          overlapCount: entry?.overlapCount ?? 0,
        };
      });
      return { ...pin, similarities };
    });
  },

  async getCompatibility(userId: string, targetId: string) {
    const categories: TasteCategory[] = ['RESTAURANT', 'WINE', 'SPIRIT'];
    const results = await Promise.all(
      categories.map(async (category) => {
        const entry = await tssCacheService.getPairScore(userId, targetId, category);
        return {
          category,
          score: entry?.score ?? null,
          overlapCount: entry?.overlapCount ?? 0,
        };
      }),
    );
    return results;
  },

  async canPin(pinnerId: string, pinnedId: string) {
    const compatibility = await friendsService.getCompatibility(pinnerId, pinnedId);
    const eligible = compatibility.filter(
      (c) => c.score !== null && c.score >= MIN_TSS && c.overlapCount >= MIN_OVERLAP,
    );
    return {
      canPin: eligible.length > 0,
      eligibleCategories: eligible.map((c) => c.category),
      compatibility,
    };
  },

  async discoverSimilarUsers(
    userId: string,
    category?: TasteCategory,
    limit = 20,
    offset = 0,
  ) {
    const allScores = await tssCacheService.getAllScoresForUser(userId);

    // Filter by category if specified
    const filtered = category
      ? allScores.filter((s) => s.category === category)
      : allScores;

    // Group by user, keeping best score per user
    const userMap = new Map<
      string,
      {
        userId: string;
        bestCategory: TasteCategory;
        bestScore: number;
        categories: Array<{ category: TasteCategory; score: number; overlapCount: number }>;
      }
    >();

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
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatarUrl: true, createdAt: true },
    });
    const userLookup = new Map(users.map((u: { id: string; displayName: string; avatarUrl: string | null; createdAt: Date }) => [u.id, u] as const));

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
  },
};

async function validatePinCategories(
  pinnerId: string,
  pinnedId: string,
  categories: TasteCategory[],
) {
  for (const category of categories) {
    const entry = await tssCacheService.getPairScore(pinnerId, pinnedId, category);
    if (!entry || entry.score < MIN_TSS || entry.overlapCount < MIN_OVERLAP) {
      throw new Error(
        `Insufficient taste overlap for ${category}. Need TSS >= 0.7 and at least 5 shared items.`,
      );
    }
  }
}
