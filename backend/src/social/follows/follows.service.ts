import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BindersService } from '../../binders/binders.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bindersService: BindersService,
  ) {}

  async follow(userId: string, binderId: string) {
    const binder = await this.bindersService.findPublicById(binderId);
    if (binder.ownerId === userId) {
      throw new BadRequestException('Cannot follow your own binder');
    }

    return this.prisma.binderFollow.upsert({
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
  }

  async unfollow(userId: string, binderId: string) {
    await this.prisma.binderFollow.deleteMany({
      where: { followerId: userId, binderId },
    });
  }

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    const where: Record<string, unknown> = { followerId: userId };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const follows = await this.prisma.binderFollow.findMany({
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

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore
      ? items[items.length - 1].createdAt.toISOString()
      : null;

    return { items, nextCursor, hasMore };
  }

  async isFollowing(userId: string, binderId: string): Promise<boolean> {
    const follow = await this.prisma.binderFollow.findUnique({
      where: { followerId_binderId: { followerId: userId, binderId } },
    });
    return !!follow;
  }
}
