import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { presignPhotoSchema } from '@/lib/api/validators/photos';
import { photosService } from '@/lib/api/services/photos.service';

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = presignPhotoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const result = await photosService.presign(
      user.id,
      parsed.data.mimeType,
      parsed.data.sizeBytes,
    );
    return apiSuccess(result, 201);
  } catch (err) {
    console.error('Presign error:', err);
    return apiError(
      err instanceof Error ? err.message : 'Failed to create upload URL',
      500,
    );
  }
});
