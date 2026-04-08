import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { pioneersService } from '@/lib/api/services/pioneers.service';

export const GET = withAuth(async (req: NextRequest, user) => {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'badges') {
    const badges = await pioneersService.getUserBadges(user.id);
    return apiSuccess(badges);
  }

  // Default: get pioneer zones
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const radiusKm = req.nextUrl.searchParams.get('radiusKm');

  const latNum = parseFloat(lat || '');
  const lngNum = parseFloat(lng || '');
  if (isNaN(latNum) || isNaN(lngNum)) {
    return apiError('lat and lng are required numbers', 400);
  }

  const radius = Math.min(Math.max(parseFloat(radiusKm || '5'), 1), 50);
  const zones = await pioneersService.getPioneerZones(latNum, lngNum, radius);
  return apiSuccess(zones);
});
