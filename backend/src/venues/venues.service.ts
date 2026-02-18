import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GooglePlacesClient } from './google-places.client';

const SEARCH_CACHE_TTL = 300; // 5 minutes
const VENUE_CACHE_TTL = 86400; // 24 hours
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly googlePlaces: GooglePlacesClient,
  ) {}

  async search(query: string, lat?: number, lng?: number) {
    const cacheKey = `venues:search:${query}:${lat}:${lng}`;
    const cached = await this.redis.getJson<any[]>(cacheKey);
    if (cached) return cached;

    const places = await this.googlePlaces.textSearch(query, lat, lng);
    const results = places.map((p) => this.googlePlaces.mapToVenueData(p));

    if (results.length > 0) {
      await this.redis.setJson(cacheKey, results, SEARCH_CACHE_TTL);
    }

    return results;
  }

  async getByPlaceId(placeId: string) {
    // Layer 1: Redis cache
    const cacheKey = `venue:${placeId}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    // Layer 2: PostgreSQL
    const dbVenue = await this.prisma.venue.findUnique({
      where: { placeId },
    });

    if (dbVenue) {
      const isStale =
        Date.now() - dbVenue.lastFetchedAt.getTime() > STALE_THRESHOLD_MS;

      if (!isStale) {
        await this.redis.setJson(cacheKey, dbVenue, VENUE_CACHE_TTL);
        return dbVenue;
      }
    }

    // Layer 3: Google Places API
    const place = await this.googlePlaces.getPlaceDetails(placeId);
    if (!place) return dbVenue; // return stale data if API fails

    const venueData = this.googlePlaces.mapToVenueData(place);

    const venue = await this.prisma.venue.upsert({
      where: { placeId },
      update: venueData,
      create: venueData,
    });

    await this.redis.setJson(cacheKey, venue, VENUE_CACHE_TTL);
    return venue;
  }
}
