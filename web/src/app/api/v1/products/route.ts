import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { DEFAULT_WRITE_LIMIT, limitByUser } from '@/lib/api/ratelimit';
import { productsService } from '@/lib/api/services/products.service';

export const POST = withAuth(async (req: NextRequest, user) => {
  const limited = await limitByUser(DEFAULT_WRITE_LIMIT, user.id);
  if (limited) return limited;

  const body = await req.json();
  const { name, category, subType, producer, vintage, region, abv } = body;
  if (!name || !category) return apiError('name and category are required', 400);
  const product = await productsService.create({
    name, category, subType, producer, vintage, region, abv, createdBy: user.id,
  });
  return apiSuccess(product);
});
