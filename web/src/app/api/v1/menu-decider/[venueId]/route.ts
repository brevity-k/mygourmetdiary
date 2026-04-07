import { NextRequest } from 'next/server';
import { withAuth, withPremium } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { menuDeciderService } from '@/lib/api/services/menu-decider.service';
import { prisma } from '@/lib/api/clients/prisma';

function extractVenueId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1)!;
}

export const GET = withPremium(async (req: NextRequest, user) => {
  const venueId = extractVenueId(req);
  const summary = req.nextUrl.searchParams.get('summary') === 'true';

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return apiError('Venue not found', 404);

  const result = await menuDeciderService.getDishRecommendations(user.id, venueId);

  if (summary) {
    return apiSuccess({
      venue: result.venue,
      dishCount: result.dishes.length,
      hasFriendData: result.hasFriendData,
      topDish: result.dishes[0]?.dishName ?? null,
    });
  }

  return apiSuccess(result);
});
