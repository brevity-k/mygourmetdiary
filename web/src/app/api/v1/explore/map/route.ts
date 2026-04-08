import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { areaExplorerService } from '@/lib/api/services/area-explorer.service';

const PREMIUM_TIER = 'CONNOISSEUR';

export const GET = withAuth(async (req: NextRequest, user) => {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const radiusKm = req.nextUrl.searchParams.get('radiusKm');
  const category = req.nextUrl.searchParams.get('category') ?? undefined;
  const friendsOnly = req.nextUrl.searchParams.get('friendsOnly') === 'true';

  const latNum = parseFloat(lat || '');
  const lngNum = parseFloat(lng || '');
  if (isNaN(latNum) || isNaN(lngNum)) {
    return apiError('lat and lng are required numbers', 400);
  }

  const radius = Math.min(Math.max(parseFloat(radiusKm || '5'), 1), 50);

  // friendsOnly requires premium
  if (friendsOnly && user.subscriptionTier !== PREMIUM_TIER) {
    return apiError('Friends-only view requires premium subscription', 403);
  }

  const pins = await areaExplorerService.getMapPins(
    user.id,
    latNum,
    lngNum,
    radius,
    category,
    friendsOnly,
  );
  return apiSuccess(pins);
});
