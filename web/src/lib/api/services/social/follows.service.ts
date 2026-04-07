import { prisma } from '../../clients/prisma';

const FREE_FOLLOW_LIMIT = 5;
const PREMIUM_TIER = 'CONNOISSEUR';

function clampLimit(limit?: number, defaultVal = 20, max = 100): number {
  return Math.min(Math.max(limit || defaultVal, 1), max);
}

function paginateResults<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
): { items: T[]; hasMore: boolean; nextCursor: string | null } {
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getCursor(page[page.length - 1]) : null;
  return { items: page, hasMore, nextCursor };
}

export const followsService = {
  clampLimit,

  async follow(userId: string, binderId: string) {
    // Verify binder exists and is public
    const binder = await prisma.binder.findUnique({
      where: { id: binderId },
    });
    if (!binder) throw new Error('Binder not found');
    if (binder.visibility !== 'PUBLIC') throw new Error('Binder not found');
    if (binder.ownerId === userId) {
      throw new Error('Cannot follow your own binder');
    }

    // Enforce follow limit for free users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    if (user?.subscriptionTier !== PREMIUM_TIER) {
      const count = await prisma.binderFollow.count({
        where: { followerId: userId },
      });
      if (count >= FREE_FOLLOW_LIMIT) {
        throw new Error(
          `Free tier limited to ${FREE_FOLLOW_LIMIT} binder follows. Upgrade to Connoisseur for unlimited.`,
        );
      }
    }

    return prisma.binderFollow.upsert({
      where: { followerId_binderId: { followerId: userId, binderId } },
      create: { followerId: userId, binderId },
      update: {},
      include: {
        binder: {
          include: {
            owner: { select: { id: true, displayName: true, avatarUrl: true } },
            _count: { select: { notes: true, followers: true } },
          },
        },
      },
    });
  },

  async unfollow(userId: string, binderId: string) {
    await prisma.binderFollow.deleteMany({
      where: { followerId: userId, binderId },
    });
  },

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const where: Record<string, unknown> = { followerId: userId };
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (isNaN(cursorDate.getTime())) {
        throw new Error('Invalid cursor format');
      }
      where.createdAt = { lt: cursorDate };
    }

    const follows = await prisma.binderFollow.findMany({
      where,
      include: {
        binder: {
          include: {
            owner: { select: { id: true, displayName: true, avatarUrl: true } },
            _count: { select: { notes: true, followers: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    return paginateResults(follows, limit, (f) => f.createdAt.toISOString());
  },

  async isFollowing(userId: string, binderId: string): Promise<boolean> {
    const follow = await prisma.binderFollow.findUnique({
      where: { followerId_binderId: { followerId: userId, binderId } },
    });
    return !!follow;
  },
};
