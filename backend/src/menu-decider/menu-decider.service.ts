import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';

export interface DishRecommendation {
  dishName: string;
  dishCategory: string;
  friendCount: number;
  matchedCount: number;
  totalCount: number;
  avgFriendRating: number | null;
  avgOverallRating: number;
  wouldOrderAgainPct: number;
  topFriendNotes: Array<{
    authorName: string;
    authorAvatar: string | null;
    rating: number;
    freeText: string | null;
    tier: 1 | 2;
  }>;
}

@Injectable()
export class MenuDeciderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tssCache: TssCacheService,
  ) {}

  async getDishRecommendations(userId: string, venueId: string) {
    // Fetch all public restaurant notes for this venue
    const notes = await this.prisma.note.findMany({
      where: {
        venueId,
        type: 'RESTAURANT',
        visibility: 'PUBLIC',
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true, address: true },
    });

    if (!venue || notes.length === 0) {
      return {
        venue: venue ?? { id: venueId, name: 'Unknown Venue', address: null },
        dishes: [],
        hasFriendData: false,
      };
    }

    // Load friend and TSS IDs
    const [friendIds, highTssIds] = await Promise.all([
      this.tssCache.getPinnedFriendIds(userId),
      this.tssCache.getHighTssUserIds(userId),
    ]);
    const friendSet = new Set(friendIds);
    const highTssSet = new Set(highTssIds);

    // Group notes by dish name (case-insensitive)
    const dishMap = new Map<
      string,
      {
        dishName: string;
        dishCategory: string;
        notes: Array<{
          authorId: string;
          authorName: string;
          authorAvatar: string | null;
          rating: number;
          freeText: string | null;
          wouldOrderAgain: boolean;
          tier: 1 | 2 | 3;
        }>;
      }
    >();

    for (const note of notes) {
      const ext = note.extension as any;
      const dishName = ext?.dishName;
      if (!dishName) continue;

      const key = dishName.toLowerCase().trim();
      if (!dishMap.has(key)) {
        dishMap.set(key, {
          dishName,
          dishCategory: ext.dishCategory || 'OTHER',
          notes: [],
        });
      }

      let tier: 1 | 2 | 3 = 3;
      if (friendSet.has(note.authorId)) tier = 1;
      else if (highTssSet.has(note.authorId)) tier = 2;

      dishMap.get(key)!.notes.push({
        authorId: note.authorId,
        authorName: note.author.displayName,
        authorAvatar: note.author.avatarUrl,
        rating: note.rating,
        freeText: note.freeText,
        wouldOrderAgain: ext.wouldOrderAgain ?? false,
        tier,
      });
    }

    // Compute dish recommendations
    let hasFriendData = false;
    const dishes: DishRecommendation[] = [];

    for (const [, dish] of dishMap) {
      const friendNotes = dish.notes.filter((n) => n.tier === 1);
      const matchedNotes = dish.notes.filter((n) => n.tier === 2);
      const allRatings = dish.notes.map((n) => n.rating);
      const friendRatings = friendNotes.map((n) => n.rating);

      if (friendNotes.length > 0) hasFriendData = true;

      const wouldOrderCount = dish.notes.filter((n) => n.wouldOrderAgain).length;

      const topFriendNotes = [...friendNotes, ...matchedNotes]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
        .map((n) => ({
          authorName: n.authorName,
          authorAvatar: n.authorAvatar,
          rating: n.rating,
          freeText: n.freeText,
          tier: n.tier as 1 | 2,
        }));

      dishes.push({
        dishName: dish.dishName,
        dishCategory: dish.dishCategory,
        friendCount: friendNotes.length,
        matchedCount: matchedNotes.length,
        totalCount: dish.notes.length,
        avgFriendRating:
          friendRatings.length > 0
            ? Math.round((friendRatings.reduce((a, b) => a + b, 0) / friendRatings.length) * 10) / 10
            : null,
        avgOverallRating:
          Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10,
        wouldOrderAgainPct:
          dish.notes.length > 0 ? Math.round((wouldOrderCount / dish.notes.length) * 100) : 0,
        topFriendNotes,
      });
    }

    // Sort: friendCount desc → avgFriendRating desc → avgOverallRating desc
    dishes.sort((a, b) => {
      if (b.friendCount !== a.friendCount) return b.friendCount - a.friendCount;
      const af = a.avgFriendRating ?? 0;
      const bf = b.avgFriendRating ?? 0;
      if (bf !== af) return bf - af;
      return b.avgOverallRating - a.avgOverallRating;
    });

    return { venue, dishes, hasFriendData };
  }
}
