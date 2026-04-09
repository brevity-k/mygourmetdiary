import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { productsService } from '@/lib/api/services/products.service';

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const { query, category } = body;
  if (!query || typeof query !== 'string') return apiError('query is required', 400);
  const results = await productsService.search(query, category);
  return apiSuccess(results);
});
