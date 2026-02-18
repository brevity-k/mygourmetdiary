import { Injectable, NotFoundException } from '@nestjs/common';
import { TasteCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tssCache: TssCacheService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache
    await this.redis.del(`user:firebase:${user.firebaseUid}`);
    return user;
  }

  async getPublicProfile(userId: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [publicNoteCount, publicBinderCount] = await Promise.all([
      this.prisma.note.count({
        where: { authorId: userId, visibility: 'PUBLIC' },
      }),
      this.prisma.binder.count({
        where: { ownerId: userId, visibility: 'PUBLIC' },
      }),
    ]);

    const publicBinders = await this.prisma.binder.findMany({
      where: { ownerId: userId, visibility: 'PUBLIC' },
      include: { _count: { select: { notes: true, followers: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    let isPinned = false;
    let tasteSimilarity: Array<{ category: string; score: number; overlapCount: number }> = [];
    if (viewerId && viewerId !== userId) {
      const pin = await this.prisma.gourmetFriendPin.findUnique({
        where: { pinnerId_pinnedId: { pinnerId: viewerId, pinnedId: userId } },
      });
      isPinned = !!pin;

      const categories = [TasteCategory.RESTAURANT, TasteCategory.WINE, TasteCategory.SPIRIT];
      const scores = await Promise.all(
        categories.map(async (category) => {
          const entry = await this.tssCache.getPairScore(viewerId, userId, category);
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
  }
}
