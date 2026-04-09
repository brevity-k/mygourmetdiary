import { createHash } from 'crypto';
import { Prisma, Venue } from '@prisma/client';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { googlePlaces } from '../clients/google-places';

const SEARCH_CACHE_TTL = 300; // 5 minutes
const VENUE_CACHE_TTL = 86400; // 24 hours
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const venuesService = {
  async search(query: string, lat?: number, lng?: number) {
    const hash = createHash('sha256')
      .update(`${query}:${lat}:${lng}`)
      .digest('hex')
      .slice(0, 16);
    const cacheKey = `venues:search:${hash}`;

    const cached = await getJson<unknown[]>(cacheKey);
    if (cached) return cached;

    const places = await googlePlaces.textSearch(query, lat, lng);
    const results = places.map((p) => googlePlaces.mapToVenueData(p));

    if (results.length > 0) {
      await setJson(cacheKey, results, SEARCH_CACHE_TTL);
    }

    return results;
  },

  async getByPlaceId(placeId: string) {
    // Layer 1: Redis cache
    const cacheKey = `venue:${placeId}`;
    const cached = await getJson<Venue>(cacheKey);
    if (cached) return cached;

    // Layer 2: PostgreSQL
    const dbVenue = await prisma.venue.findUnique({
      where: { placeId },
    });

    if (dbVenue) {
      const isStale =
        Date.now() - dbVenue.lastFetchedAt.getTime() > STALE_THRESHOLD_MS;

      if (!isStale) {
        await setJson(cacheKey, dbVenue, VENUE_CACHE_TTL);
        return dbVenue;
      }
    }

    // Layer 3: Google Places API
    const place = await googlePlaces.getPlaceDetails(placeId);
    if (!place) return dbVenue; // return stale data if API fails

    const venueData = googlePlaces.mapToVenueData(place);
    const prismaData = {
      ...venueData,
      hours: venueData.hours ?? Prisma.JsonNull,
    };

    const venue = await prisma.venue.upsert({
      where: { placeId },
      update: prismaData,
      create: prismaData,
    });

    await setJson(cacheKey, venue, VENUE_CACHE_TTL);
    return venue;
  },
};
