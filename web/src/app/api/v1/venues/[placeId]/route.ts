import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { venuesService } from '@/lib/api/services/venues.service';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export const GET = withAuth(async (req: NextRequest) => {
  const placeId = req.nextUrl.pathname.split('/').at(-1)!;

  if (!PLACE_ID_PATTERN.test(placeId)) {
    return apiError('Invalid placeId format', 400);
  }

  try {
    const venue = await venuesService.getByPlaceId(placeId);
    if (!venue) return apiError('Venue not found', 404);
    return apiSuccess(venue);
  } catch (err) {
    console.error('Get venue error:', err);
    return apiError('Failed to get venue details', 500);
  }
});
