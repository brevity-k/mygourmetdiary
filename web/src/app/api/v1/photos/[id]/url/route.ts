import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { STRICT_LIMIT, limitByUser } from '@/lib/api/ratelimit';
import { photosService } from '@/lib/api/services/photos.service';

export const GET = withAuth(async (req: NextRequest, user) => {
  const limited = await limitByUser(STRICT_LIMIT, user.id);
  if (limited) return limited;

  const parts = req.nextUrl.pathname.split('/');
  const id = parts.at(-2);
  if (!id) return apiError('Missing photo ID', 400);

  try {
    const result = await photosService.getSignedReadUrl(id, user.id);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Photo not found') {
      return apiError('Photo not found', 404);
    }
    console.error('Signed URL error:', err);
    return apiError('Failed to generate signed URL', 500);
  }
});
