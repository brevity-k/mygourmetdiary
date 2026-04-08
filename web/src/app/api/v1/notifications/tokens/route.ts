import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notificationsService } from '@/lib/api/services/notifications.service';
import { z } from 'zod';

const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = registerTokenSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const result = await notificationsService.registerToken(
    user.id,
    parsed.data.token,
    parsed.data.platform,
  );
  return apiSuccess(result, 201);
});

export const DELETE = withAuth(async (_req: NextRequest, user) => {
  await notificationsService.removeTokensForUser(user.id);
  return apiSuccess({ ok: true });
});
