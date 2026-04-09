import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { communityGourmetsService } from '@/lib/api/services/community-gourmets.service';
import { prisma } from '@/lib/api/clients/prisma';

const SUBJECT_CONFIG = {
  venue: { noteField: 'venueId' },
  product: { noteField: 'productId' },
} as const;

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

export const GET = withAuth(async (req: NextRequest, user) => {
  const parts = req.nextUrl.pathname.split('/');
  // /api/v1/community/[subjectType]/[subjectId]/gourmets
  const subjectType = parts.at(-3) as string;
  const subjectId = parts.at(-2)!;

  const config = SUBJECT_CONFIG[subjectType as keyof typeof SUBJECT_CONFIG];
  if (!config) return apiError('Invalid subject type. Use "venue" or "product".', 400);

  // Parse and clamp limit
  const rawLimit = req.nextUrl.searchParams.get('limit');
  const limit = rawLimit
    ? Math.min(Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT), MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Verify subject exists
  if (subjectType === 'venue') {
    const venue = await prisma.venue.findUnique({ where: { id: subjectId } });
    if (!venue) return apiError('Venue not found', 404);
  } else {
    const product = await prisma.product.findUnique({ where: { id: subjectId } });
    if (!product) return apiError('Product not found', 404);
  }

  const gourmets = await communityGourmetsService.getGourmets(
    user.id,
    subjectType as 'venue' | 'product',
    subjectId,
    config.noteField,
    limit,
  );
  return apiSuccess(gourmets);
});
