import type { NoteType, Prisma, Venue } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
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

    // Fetch notes for these venues
    const noteWhere: Prisma.NoteWhereInput = {
      venueId: { in: venueIds },
      type: { in: typeFilter },
      visibility: 'PUBLIC',
    };
    if (friendsOnly && friendIds.length > 0) {
      noteWhere.authorId = { in: friendIds };
    } else if (friendsOnly && friendIds.length === 0) {
      await setJson(cacheKey, [], 300);
      return [];
    }

    const notes = await prisma.note.findMany({
      where: noteWhere,
      include: {
        author: { select: { id: true, displayName: true } },
      },
    });

    // Load all friend IDs for friend detection (if not friendsOnly)
    const friendSet = new Set(
      friendsOnly ? friendIds : await tssCacheService.getPinnedFriendIds(userId),
    );

    // Group notes by venue
    const venueMap = new Map<
      string,
      {
        notes: typeof notes;
        myNotes: typeof notes;
        friendNotes: typeof notes;
      }
    >();

    for (const note of notes) {
      if (!note.venueId) continue;
      if (!venueMap.has(note.venueId)) {
        venueMap.set(note.venueId, { notes: [], myNotes: [], friendNotes: [] });
      }
      const entry = venueMap.get(note.venueId)!;
      entry.notes.push(note);
      if (note.authorId === userId) {
        entry.myNotes.push(note);
      }
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
        myNoteCount: entry.myNotes.length,
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

    return notes;
  },
};
