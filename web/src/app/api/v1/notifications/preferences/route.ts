import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notificationsService } from '@/lib/api/services/notifications.service';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  newNoteInFollowed: z.boolean().optional(),
  signalOnMyNote: z.boolean().optional(),
  newGourmetFriend: z.boolean().optional(),
  pioneerAlert: z.boolean().optional(),
});

export const GET = withAuth(async (_req: NextRequest, user) => {
  const prefs = await notificationsService.getPreferences(user.id);
  return apiSuccess(prefs);
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const parsed = updatePreferencesSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  const prefs = await notificationsService.updatePreferences(user.id, parsed.data);
  return apiSuccess(prefs);
});
