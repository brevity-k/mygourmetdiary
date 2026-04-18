import type { NoteType, Venue } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { photosService } from './photos.service';
import { tssCacheService } from './taste-matching/tss-cache.service';
import { computeBoundingBox } from './geo';

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
  myNoteCount: number;
  friendNoteCount: number;
  avgRating: number | null;
  avgFriendRating: number | null;
  topFriendNames: string[];
  category: 'RESTAURANT' | 'WINERY_VISIT';
}

export const areaExplorerService = {
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
    const cached = await getJson<MapPin[]>(cacheKey);
    if (cached) return cached;

    // Bounding box calculation (approximate)
    const bbox = computeBoundingBox(lat, lng, radiusKm);

    // Get venues within bounding box
    const venues = await prisma.venue.findMany({
      where: {
        lat: { gte: bbox.minLat, lte: bbox.maxLat },
        lng: { gte: bbox.minLng, lte: bbox.maxLng },
      },
    });

    if (venues.length === 0) {
      await setJson(cacheKey, [], 300);
      return [];
    }

    const venueIds = venues.map((v: Venue) => v.id);

    // Build note type filter
    const typeFilter: NoteType[] = [];
    if (category === 'RESTAURANT') typeFilter.push('RESTAURANT');
    else if (category === 'WINERY_VISIT') typeFilter.push('WINERY_VISIT');
    else typeFilter.push('RESTAURANT', 'WINERY_VISIT');

    // Get friend IDs
    const friendIds = friendsOnly
      ? await tssCacheService.getPinnedFriendIds(userId)
      : [];

    if (friendsOnly && friendIds.length === 0) {
      await setJson(cacheKey, [], 300);
      return [];
    }

    // Load all friend IDs for friend detection (if not friendsOnly)
    const friendSet = new Set(
      friendsOnly ? friendIds : await tssCacheService.getPinnedFriendIds(userId),
    );

    const publicWhere = {
      venueId: { in: venueIds },
      type: { in: typeFilter },
      visibility: 'PUBLIC' as const,
    };

    // Own notes are visible regardless of visibility setting
    const myWhere = {
      venueId: { in: venueIds },
      type: { in: typeFilter },
      authorId: userId,
    };

    // Use DB aggregates for general venue stats (noteCount + avgRating)
    // This avoids loading all individual notes into memory just for counting/averaging
    const [noteStatsByType, friendNotes, myNoteCounts] = await Promise.all([
      // General stats via DB aggregate — grouped by venueId+type
      friendsOnly
        ? prisma.note.groupBy({
            by: ['venueId', 'type'],
            where: { ...publicWhere, authorId: { in: friendIds } },
            _count: { id: true },
            _avg: { rating: true },
          })
        : prisma.note.groupBy({
            by: ['venueId', 'type'],
            where: {
              venueId: { in: venueIds },
              type: { in: typeFilter },
              OR: [
                { visibility: 'PUBLIC' },
                { authorId: userId },
              ],
            },
            _count: { id: true },
            _avg: { rating: true },
          }),
      // Friend-specific notes — need individual records for names and ratings
      friendSet.size > 0
        ? prisma.note.findMany({
            where: {
              ...publicWhere,
              authorId: { in: [...friendSet] },
            },
            select: {
              venueId: true,
              rating: true,
              type: true,
              author: { select: { displayName: true } },
            },
          })
        : Promise.resolve([]),
      // My note counts — include all my notes regardless of visibility
      prisma.note.groupBy({
        by: ['venueId'],
        where: myWhere,
        _count: { id: true },
      }),
    ]);

    // Merge per-type stats into per-venue totals
    const statsMap = new Map<string | null, { count: number; avg: number | null; primaryType: NoteType }>();
    for (const s of noteStatsByType) {
      const existing = statsMap.get(s.venueId);
      if (!existing) {
        statsMap.set(s.venueId, { count: s._count.id, avg: s._avg.rating, primaryType: s.type });
      } else {
        // Combine counts, compute weighted average, keep the type with more notes
        const totalCount = existing.count + s._count.id;
        const combinedAvg =
          existing.avg !== null && s._avg.rating !== null
            ? (existing.avg * existing.count + s._avg.rating * s._count.id) / totalCount
            : existing.avg ?? s._avg.rating;
        const primaryType = s._count.id > existing.count ? s.type : existing.primaryType;
        statsMap.set(s.venueId, { count: totalCount, avg: combinedAvg, primaryType });
      }
    }
    const myCountMap = new Map(
      myNoteCounts.map((c: { venueId: string | null; _count: { id: number } }) => [c.venueId, c._count.id]),
    );

    // Group friend notes by venue (only these need JS processing)
    const friendVenueMap = new Map<
      string,
      { ratings: number[]; names: Set<string>; type: string }
    >();
    for (const fn of friendNotes) {
      if (!fn.venueId) continue;
      if (!friendVenueMap.has(fn.venueId)) {
        friendVenueMap.set(fn.venueId, { ratings: [], names: new Set(), type: fn.type });
      }
      const entry = friendVenueMap.get(fn.venueId)!;
      entry.ratings.push(fn.rating);
      entry.names.add(fn.author.displayName);
    }

    // Build pins
    const pins: MapPin[] = [];
    for (const venue of venues) {
      const stats = statsMap.get(venue.id);
      if (!stats || stats.count === 0) continue;

      const friendData = friendVenueMap.get(venue.id);
      const friendRatings = friendData?.ratings ?? [];

      const topFriendNames = friendData
        ? [...friendData.names].slice(0, 3)
        : [];

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
        noteCount: stats.count,
        myNoteCount: myCountMap.get(venue.id) ?? 0,
        friendNoteCount: friendRatings.length,
        avgRating:
          stats.avg !== null
            ? Math.round(stats.avg * 10) / 10
            : null,
        avgFriendRating:
          friendRatings.length > 0
            ? Math.round((friendRatings.reduce((a, b) => a + b, 0) / friendRatings.length) * 10) / 10
            : null,
        topFriendNames,
        category: stats.primaryType === 'WINERY_VISIT' ? 'WINERY_VISIT' : 'RESTAURANT',
      });
    }

    // Sort: friend note count desc, then total notes desc
    pins.sort((a, b) => {
      if (b.friendNoteCount !== a.friendNoteCount) return b.friendNoteCount - a.friendNoteCount;
      return b.noteCount - a.noteCount;
    });

    await setJson(cacheKey, pins, 300); // 5-min cache
    return pins;
  },

  async getVenueNotes(userId: string, venueId: string, limit = 20) {
    const notes = await prisma.note.findMany({
      where: {
        venueId,
        OR: [
          { authorId: userId },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        venue: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });

    await photosService.attachSignedUrlsToItems(notes);
    return notes;
  },
};
