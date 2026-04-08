import { NextRequest } from 'next/server';
import type { TasteCategory } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { friendsService } from '@/lib/api/services/social/friends.service';

const VALID_CATEGORIES = ['RESTAURANT', 'WINE', 'SPIRIT'];

export const GET = withAuth(async (req: NextRequest, user) => {
  const category = req.nextUrl.searchParams.get('category') as TasteCategory | null;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const offsetStr = req.nextUrl.searchParams.get('offset');

  if (category && !VALID_CATEGORIES.includes(category)) {
    return apiError('Invalid category', 400);
  }

  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 100);
  const offset = Math.max(parseInt(offsetStr || '0', 10) || 0, 0);

  const result = await friendsService.discoverSimilarUsers(
    user.id,
    category ?? undefined,
    limit,
    offset,
  );
  return apiSuccess(result);
});
