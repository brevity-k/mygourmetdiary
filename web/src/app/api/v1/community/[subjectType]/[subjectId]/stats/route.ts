import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { communityStatsService } from '@/lib/api/services/community-stats.service';
import { prisma } from '@/lib/api/clients/prisma';

const SUBJECT_CONFIG = {
  venue: { noteField: 'venueId' },
  product: { noteField: 'productId' },
} as const;

export const GET = withAuth(async (req: NextRequest, user) => {
  const parts = req.nextUrl.pathname.split('/');
  // /api/v1/community/[subjectType]/[subjectId]/stats
  const subjectType = parts.at(-3) as string;
  const subjectId = parts.at(-2)!;

  const config = SUBJECT_CONFIG[subjectType as keyof typeof SUBJECT_CONFIG];
  if (!config) return apiError('Invalid subject type. Use "venue" or "product".', 400);

  // Verify subject exists
  if (subjectType === 'venue') {
    const venue = await prisma.venue.findUnique({ where: { id: subjectId } });
    if (!venue) return apiError('Venue not found', 404);
  } else {
    const product = await prisma.product.findUnique({ where: { id: subjectId } });
    if (!product) return apiError('Product not found', 404);
  }

  const stats = await communityStatsService.getStats(
    subjectType as 'venue' | 'product',
    subjectId,
    config.noteField,
    user.id,
  );
  return apiSuccess(stats);
});
