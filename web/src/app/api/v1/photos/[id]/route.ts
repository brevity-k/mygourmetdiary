import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { photosService } from '@/lib/api/services/photos.service';

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const id = new URL(req.url).pathname.split('/').pop();
  if (!id) return apiError('Missing photo ID', 400);

  try {
    await photosService.remove(id, user.id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Photo not found') return apiError(err.message, 404);
      if (err.message === 'Forbidden') return apiError(err.message, 403);
    }
    console.error('Delete photo error:', err);
    return apiError('Failed to delete photo', 500);
  }
});
