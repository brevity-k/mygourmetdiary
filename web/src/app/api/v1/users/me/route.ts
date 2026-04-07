import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { usersService, sanitizeUser } from '@/lib/api/services/users.service';
import { updateUserSchema } from '@/lib/api/validators/users';

export const GET = withAuth(async (_req: NextRequest, user) => {
  return apiSuccess(sanitizeUser(user));
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const updated = await usersService.update(user.id, parsed.data);
    return apiSuccess(sanitizeUser(updated));
  } catch (err) {
    console.error('Update user error:', err);
    return apiError('Failed to update user', 500);
  }
});
