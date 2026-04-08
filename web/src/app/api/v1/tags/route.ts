import { NextRequest } from 'next/server';
import type { TagCategory } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { tagsService } from '@/lib/api/services/tags.service';

const VALID_TAG_CATEGORIES = ['RESTAURANT', 'WINE', 'SPIRIT', 'CUISINE'];

export const GET = withAuth(async (req: NextRequest) => {
  const category = req.nextUrl.searchParams.get('category') as TagCategory | null;
  const group = req.nextUrl.searchParams.get('group') ?? undefined;

  if (category && !VALID_TAG_CATEGORIES.includes(category)) {
    return apiSuccess([]);
  }

  const tags = await tagsService.findAll(category ?? undefined, group);
  return apiSuccess(tags);
});
