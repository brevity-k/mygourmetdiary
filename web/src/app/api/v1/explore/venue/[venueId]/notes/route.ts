import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { areaExplorerService } from '@/lib/api/services/area-explorer.service';

function extractVenueId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  // /api/v1/explore/venue/[venueId]/notes → venueId is at index -2
  return parts[parts.length - 2];
}

export const GET = withAuth(async (req: NextRequest, user) => {
  const venueId = extractVenueId(req);
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);

  const notes = await areaExplorerService.getVenueNotes(user.id, venueId, limit);
  return apiSuccess(notes);
});
