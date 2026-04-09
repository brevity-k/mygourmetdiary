import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { productsService } from '@/lib/api/services/products.service';

export const GET = withAuth(async (req: NextRequest) => {
  const productId = req.nextUrl.pathname.split('/').at(-1)!;
  const product = await productsService.getById(productId);
  if (!product) return apiError('Product not found', 404);
  return apiSuccess(product);
});
