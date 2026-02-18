import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

interface PlaceSearchResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  priceLevel?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions: string[] };
}

interface TextSearchResponse {
  places: PlaceSearchResult[];
}

@Injectable()
export class GooglePlacesClient {
  private readonly logger = new Logger(GooglePlacesClient.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://places.googleapis.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY') || '';
  }

  async textSearch(query: string, lat?: number, lng?: number): Promise<PlaceSearchResult[]> {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'en',
    };

    if (lat !== undefined && lng !== undefined) {
      body.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 10000,
        },
      };
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.priceLevel',
      'places.types',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.regularOpeningHours',
    ].join(',');

    const response = await fetch(`${this.baseUrl}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      this.logger.error(`Google Places search failed: ${response.status}`);
      return [];
    }

    const data = (await response.json()) as TextSearchResponse;
    return data.places || [];
  }

  async getPlaceDetails(placeId: string): Promise<PlaceSearchResult | null> {
    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'rating',
      'priceLevel',
      'types',
      'nationalPhoneNumber',
      'websiteUri',
      'regularOpeningHours',
    ].join(',');

    const response = await fetch(`${this.baseUrl}/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    if (!response.ok) {
      this.logger.error(`Google Places detail failed: ${response.status}`);
      return null;
    }

    return response.json() as Promise<PlaceSearchResult>;
  }

  mapToVenueData(place: PlaceSearchResult) {
    const priceLevelMap: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };

    return {
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      lat: place.location.latitude,
      lng: place.location.longitude,
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      googleRating: place.rating || null,
      priceLevel: place.priceLevel ? (priceLevelMap[place.priceLevel] ?? null) : null,
      types: place.types || [],
      hours: place.regularOpeningHours?.weekdayDescriptions ?? Prisma.JsonNull,
      lastFetchedAt: new Date(),
    };
  }
}
