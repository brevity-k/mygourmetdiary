import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TssCacheService } from '../taste-matching/tss-cache.service';

export interface MapPin {
  venue: {
    id: string;
    placeId: string;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    types: string[];
  };
  noteCount: number;
  friendNoteCount: number;
  avgRating: number | null;
  avgFriendRating: number | null;
  topFriendNames: string[];
  category: 'RESTAURANT' | 'WINERY_VISIT';
}

@Injectable()
export class AreaExplorerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tssCache: TssCacheService,
  ) {}

  async getMapPins(
    userId: string,
    lat: number,
    lng: number,
    radiusKm: number,
    category?: string,
    friendsOnly?: boolean,
  ): Promise<MapPin[]> {
    // Check cache
    const cacheKey = `p3:map:${userId}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusKm}:${category || 'all'}:${friendsOnly ? 'f' : 'a'}`;
    const cached = await this.redis.getJson<MapPin[]>(cacheKey);
    if (cached) return cached;

    // Bounding box calculation (approximate)
    const latDelta = radiusKm / 111; // ~111km per degree latitude
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    // Get venues within bounding box
    const venues = await this.prisma.venue.findMany({
      where: {
        lat: { gte: lat - latDelta, lte: lat + latDelta },
        lng: { gte: lng - lngDelta, lte: lng + lngDelta },
      },
    });

    if (venues.length === 0) {
      await this.redis.setJson(cacheKey, [], 300);
      return [];
    }

    const venueIds = venues.map((v) => v.id);

    // Build note type filter
    const typeFilter: string[] = [];
    if (category === 'RESTAURANT') typeFilter.push('RESTAURANT');
    else if (category === 'WINERY_VISIT') typeFilter.push('WINERY_VISIT');
    else typeFilter.push('RESTAURANT', 'WINERY_VISIT');

    // Get friend IDs
    const friendIds = friendsOnly
      ? await this.tssCache.getPinnedFriendIds(userId)
      : [];

    // Fetch notes for these venues
    const noteWhere: any = {
      venueId: { in: venueIds },
      type: { in: typeFilter },
      visibility: 'PUBLIC',
    };
    if (friendsOnly && friendIds.length > 0) {
      noteWhere.authorId = { in: friendIds };
    } else if (friendsOnly && friendIds.length === 0) {
      await this.redis.setJson(cacheKey, [], 300);
      return [];
    }

    const notes = await this.prisma.note.findMany({
      where: noteWhere,
      include: {
        author: { select: { id: true, displayName: true } },
      },
    });

    // Load all friend IDs for friend detection (if not friendsOnly)
    const friendSet = new Set(
      friendsOnly ? friendIds : await this.tssCache.getPinnedFriendIds(userId),
    );

    // Group notes by venue
    const venueMap = new Map<
      string,
      {
        notes: typeof notes;
        friendNotes: typeof notes;
      }
    >();

    for (const note of notes) {
      if (!venueMap.has(note.venueId!)) {
        venueMap.set(note.venueId!, { notes: [], friendNotes: [] });
      }
      const entry = venueMap.get(note.venueId!)!;
      entry.notes.push(note);
      if (friendSet.has(note.authorId)) {
        entry.friendNotes.push(note);
      }
    }

    // Build pins
    const pins: MapPin[] = [];
    for (const venue of venues) {
      const entry = venueMap.get(venue.id);
      if (!entry || entry.notes.length === 0) continue;

      const allRatings = entry.notes.map((n) => n.rating);
      const friendRatings = entry.friendNotes.map((n) => n.rating);

      const topFriendNames = [
        ...new Set(entry.friendNotes.map((n) => n.author.displayName)),
      ].slice(0, 3);

      const noteType = entry.notes[0]?.type;

      pins.push({
        venue: {
          id: venue.id,
          placeId: venue.placeId,
          name: venue.name,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          types: venue.types,
        },
        noteCount: entry.notes.length,
        friendNoteCount: entry.friendNotes.length,
        avgRating:
          allRatings.length > 0
            ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
            : null,
        avgFriendRating:
          friendRatings.length > 0
            ? Math.round((friendRatings.reduce((a, b) => a + b, 0) / friendRatings.length) * 10) / 10
            : null,
        topFriendNames,
        category: noteType === 'WINERY_VISIT' ? 'WINERY_VISIT' : 'RESTAURANT',
      });
    }

    // Sort: friend note count desc, then total notes desc
    pins.sort((a, b) => {
      if (b.friendNoteCount !== a.friendNoteCount) return b.friendNoteCount - a.friendNoteCount;
      return b.noteCount - a.noteCount;
    });

    await this.redis.setJson(cacheKey, pins, 300); // 5-min cache
    return pins;
  }
}
