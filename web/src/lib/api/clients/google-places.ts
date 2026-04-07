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

const BASE_URL = 'https://places.googleapis.com/v1';
const SEARCH_RADIUS_METERS = 10_000;

function getApiKey(): string {
  return process.env.GOOGLE_PLACES_API_KEY || '';
}

const SEARCH_FIELD_MASK = [
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

const DETAIL_FIELD_MASK = [
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

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export const googlePlaces = {
  async textSearch(query: string, lat?: number, lng?: number): Promise<PlaceSearchResult[]> {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'en',
    };

    if (lat !== undefined && lng !== undefined) {
      body.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: SEARCH_RADIUS_METERS,
        },
      };
    }

    const response = await fetch(`${BASE_URL}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getApiKey(),
        'X-Goog-FieldMask': SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Google Places search failed: ${response.status}`);
      return [];
    }

    let data: TextSearchResponse;
    try {
      data = (await response.json()) as TextSearchResponse;
    } catch {
      console.error('Google Places returned malformed JSON');
      return [];
    }
    return data.places || [];
  },

  async getPlaceDetails(placeId: string): Promise<PlaceSearchResult | null> {
    const response = await fetch(`${BASE_URL}/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': getApiKey(),
        'X-Goog-FieldMask': DETAIL_FIELD_MASK,
      },
    });

    if (!response.ok) {
      console.error(`Google Places detail failed: ${response.status}`);
      return null;
    }

    try {
      return (await response.json()) as PlaceSearchResult;
    } catch {
      console.error('Google Places detail returned malformed JSON');
      return null;
    }
  },

  mapToVenueData(place: PlaceSearchResult) {
    return {
      placeId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      lat: place.location.latitude,
      lng: place.location.longitude,
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      googleRating: place.rating || null,
      priceLevel: place.priceLevel ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
      types: place.types || [],
      hours: place.regularOpeningHours?.weekdayDescriptions ?? null,
      lastFetchedAt: new Date(),
    };
  },
};
