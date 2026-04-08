import { NextRequest } from 'next/server';
import { withCron } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { photosService } from '@/lib/api/services/photos.service';

export const GET = withCron(async (_req: NextRequest) => {
  const deleted = await photosService.cleanupOrphans();
  return apiSuccess({ deletedOrphans: deleted });
});
