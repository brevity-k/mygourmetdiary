import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { venuesService } from '@/lib/api/services/venues.service';

export const GET = withAuth(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return apiError('Query parameter "q" is required', 400);

  const latStr = req.nextUrl.searchParams.get('lat');
  const lngStr = req.nextUrl.searchParams.get('lng');
  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;

  try {
    const results = await venuesService.search(q, lat, lng);
    return apiSuccess(results);
  } catch (err) {
    console.error('Venue search error:', err);
    return apiError('Failed to search venues', 500);
  }
});
