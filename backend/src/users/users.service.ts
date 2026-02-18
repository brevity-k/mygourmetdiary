import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
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

      const similarities = await this.prisma.tasteSimilarity.findMany({
        where: {
          OR: [
            { userAId: viewerId, userBId: userId },
            { userAId: userId, userBId: viewerId },
          ],
        },
      });
      tasteSimilarity = similarities.map((s) => ({
        category: s.category,
        score: s.score,
        overlapCount: s.overlapCount,
      }));
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
