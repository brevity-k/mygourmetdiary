import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TasteCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TssCacheService } from '../../taste-matching/tss-cache.service';
import { PinFriendDto, UpdatePinDto } from './dto/pin-friend.dto';

const MIN_TSS = 0.7;
const MIN_OVERLAP = 5;

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tssCache: TssCacheService,
  ) {}

  async pinFriend(pinnerId: string, dto: PinFriendDto) {
    if (pinnerId === dto.pinnedId) {
      throw new BadRequestException('Cannot pin yourself');
    }

    // Verify the pinned user exists
    const pinnedUser = await this.prisma.user.findUnique({
      where: { id: dto.pinnedId },
    });
    if (!pinnedUser) throw new NotFoundException('User not found');

    // Validate TSS requirements for each requested category
    await this.validatePinCategories(pinnerId, dto.pinnedId, dto.categories);

    const pin = await this.prisma.gourmetFriendPin.upsert({
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

    await this.tssCache.invalidateUserCaches(pinnerId);
    return pin;
  }

  async unpinFriend(pinnerId: string, pinnedId: string) {
    await this.prisma.gourmetFriendPin.deleteMany({
      where: { pinnerId, pinnedId },
    });
    await this.tssCache.invalidateUserCaches(pinnerId);
  }

  async updatePin(pinnerId: string, pinnedId: string, dto: UpdatePinDto) {
    const existing = await this.prisma.gourmetFriendPin.findUnique({
      where: { pinnerId_pinnedId: { pinnerId, pinnedId } },
    });
    if (!existing) throw new NotFoundException('Pin not found');

    await this.validatePinCategories(pinnerId, pinnedId, dto.categories);

    return this.prisma.gourmetFriendPin.update({
      where: { pinnerId_pinnedId: { pinnerId, pinnedId } },
      data: { categories: dto.categories },
      include: {
        pinned: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async listFriends(pinnerId: string) {
    const pins = await this.prisma.gourmetFriendPin.findMany({
      where: { pinnerId },
      include: {
        pinned: {
          select: { id: true, displayName: true, avatarUrl: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with TSS scores
    const enriched = await Promise.all(
      pins.map(async (pin) => {
        const similarities = await this.getCompatibility(pinnerId, pin.pinnedId);
        return { ...pin, similarities };
      }),
    );

    return enriched;
  }

  async getCompatibility(userId: string, targetId: string) {
    const categories = [TasteCategory.RESTAURANT, TasteCategory.WINE, TasteCategory.SPIRIT];
    const results = await Promise.all(
      categories.map(async (category) => {
        const entry = await this.tssCache.getPairScore(userId, targetId, category);
        return {
          category,
          score: entry?.score ?? null,
          overlapCount: entry?.overlapCount ?? 0,
        };
      }),
    );
    return results;
  }

  async canPin(pinnerId: string, pinnedId: string) {
    const compatibility = await this.getCompatibility(pinnerId, pinnedId);
    const eligible = compatibility.filter(
      (c) => c.score !== null && c.score >= MIN_TSS && c.overlapCount >= MIN_OVERLAP,
    );
    return {
      canPin: eligible.length > 0,
      eligibleCategories: eligible.map((c) => c.category),
      compatibility,
    };
  }

  private async validatePinCategories(
    pinnerId: string,
    pinnedId: string,
    categories: TasteCategory[],
  ) {
    for (const category of categories) {
      const entry = await this.tssCache.getPairScore(pinnerId, pinnedId, category);
      if (!entry || entry.score < MIN_TSS || entry.overlapCount < MIN_OVERLAP) {
        throw new BadRequestException(
          `Insufficient taste overlap for ${category}. Need TSS >= 0.7 and at least 5 shared items.`,
        );
      }
    }
  }
}
