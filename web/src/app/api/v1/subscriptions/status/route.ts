import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { subscriptionsService } from '@/lib/api/services/subscriptions.service';

export const GET = withAuth(async (_req: NextRequest, user) => {
  const status = await subscriptionsService.getStatus(user.id);
  if (!status) return apiError('User not found', 404);
  return apiSuccess(status);
});
