import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

export interface CityInfo {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  timezone: string;
  population?: number;
  iataCode?: string;
}

const CACHE_TTL = 86400 * 7; // 7 days

/** Resolves city names and IATA airport codes to coordinates via GeoNames API. */
@Injectable()
export class CityLookupService {
  private readonly logger = new Logger(CityLookupService.name);
  private readonly geonamesUser: string;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.geonamesUser = this.config.get<string>('GEONAMES_USERNAME', 'demo');
    if (this.geonamesUser === 'demo') {
      this.logger.warn(
        'Using GeoNames demo account — set GEONAMES_USERNAME for production',
      );
    }
  }

  /**
   * Search for cities by name (e.g., "Tokyo", "New York", "Paris").
   */
  async searchCity(query: string, maxResults = 5): Promise<CityInfo[]> {
    const cacheKey = `city:search:${query.toLowerCase()}`;
    const cached = await this.redis.getJson<CityInfo[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      q: query,
      maxRows: String(maxResults),
      featureClass: 'P', // Populated places only
      orderby: 'population',
      username: this.geonamesUser,
      style: 'full',
    });

    const res = await fetch(
      `http://api.geonames.org/searchJSON?${params}`,
    );

    if (!res.ok) {
      this.logger.error(`GeoNames API error: ${res.status}`);
      return [];
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      this.logger.error('GeoNames returned malformed JSON');
      return [];
    }
    const geonames = data.geonames || [];

    const results: CityInfo[] = geonames.map(
      (g: Record<string, unknown>) => this.mapGeonamesEntry(g),
    );

    if (results.length > 0) {
      await this.redis.setJson(cacheKey, results, CACHE_TTL);
    }

    return results;
  }

  /**
   * Resolve an IATA airport code to city coordinates (e.g., "JFK" → New York).
   *
   * Uses GeoNames airport search. Falls back to city search if no airport match.
   */
  async resolveAirportCode(iataCode: string): Promise<CityInfo | null> {
    const code = iataCode.toUpperCase().trim();
    if (code.length !== 3) return null;

    const cacheKey = `city:iata:${code}`;
    const cached = await this.redis.getJson<CityInfo>(cacheKey);
    if (cached) return cached;

    // Search GeoNames for airports matching the IATA code
    const params = new URLSearchParams({
      q: code,
      featureCode: 'AIRP',
      maxRows: '1',
      username: this.geonamesUser,
      style: 'full',
    });

    const res = await fetch(
      `http://api.geonames.org/searchJSON?${params}`,
    );

    if (!res.ok) return null;

    let data: any;
    try {
      data = await res.json();
    } catch {
      return null;
    }
    const geonames = data.geonames || [];

    if (geonames.length > 0) {
      const result = this.mapGeonamesEntry(geonames[0], code);
      await this.redis.setJson(cacheKey, result, CACHE_TTL);
      return result;
    }

    return null;
  }

  async resolveLocation(query: string): Promise<CityInfo | null> {
    const trimmed = query.trim();

    // If it looks like an IATA code (3 uppercase letters), try airport first
    if (/^[A-Z]{3}$/.test(trimmed)) {
      const airport = await this.resolveAirportCode(trimmed);
      if (airport) return airport;
    }

    // Otherwise, search by city name
    const cities = await this.searchCity(trimmed, 1);
    return cities[0] || null;
  }

  private mapGeonamesEntry(
    g: Record<string, unknown>,
    iataCode?: string,
  ): CityInfo {
    return {
      name: g.name as string,
      country: g.countryName as string,
      countryCode: g.countryCode as string,
      lat: parseFloat(g.lat as string),
      lng: parseFloat(g.lng as string),
      timezone:
        ((g.timezone as Record<string, unknown>)?.timeZoneId as string) || '',
      population: g.population as number,
      ...(iataCode && { iataCode }),
    };
  }
}
