import type { User, TasteCategory } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { redis } from '../clients/redis';

const SENSITIVE_FIELDS = ['supabaseId', 'rcCustomerId', 'subscriptionExpiresAt', 'updatedAt'] as const;

type SanitizedUser = Omit<User, (typeof SENSITIVE_FIELDS)[number]>;

export function sanitizeUser(user: User): SanitizedUser {
  const result = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete (result as Record<string, unknown>)[field];
  }
  return result as SanitizedUser;
}

export const usersService = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async update(id: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await redis.del(`user:supabase:${user.supabaseId}`);
    return user;
  },

  async getPublicProfile(userId: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error('User not found');

    const [publicNoteCount, publicBinderCount] = await Promise.all([
      prisma.note.count({
        where: { authorId: userId, visibility: 'PUBLIC' },
      }),
      prisma.binder.count({
        where: { ownerId: userId, visibility: 'PUBLIC' },
      }),
    ]);

    const publicBinders = await prisma.binder.findMany({
      where: { ownerId: userId, visibility: 'PUBLIC' },
      include: { _count: { select: { notes: true, followers: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    let isPinned = false;
    let tasteSimilarity: Array<{ category: string; score: number; overlapCount: number }> = [];

    if (viewerId && viewerId !== userId) {
      const pin = await prisma.gourmetFriendPin.findUnique({
        where: { pinnerId_pinnedId: { pinnerId: viewerId, pinnedId: userId } },
      });
      isPinned = !!pin;

      const categories: TasteCategory[] = ['RESTAURANT', 'WINE', 'SPIRIT'];
      const scores = await Promise.all(
        categories.map(async (category) => {
          const entry = await prisma.tasteSimilarity.findUnique({
            where: {
              userAId_userBId_category: {
                userAId: viewerId,
                userBId: userId,
                category,
              },
            },
          });
          return entry
            ? { category: category as string, score: entry.score, overlapCount: entry.overlapCount }
            : null;
        }),
      );
      tasteSimilarity = scores.filter(
        (s): s is { category: string; score: number; overlapCount: number } => s !== null,
      );
    }

    return {
      ...user,
      stats: { publicNoteCount, publicBinderCount },
      publicBinders,
      tasteSimilarity,
      isPinned,
    };
  },
};
