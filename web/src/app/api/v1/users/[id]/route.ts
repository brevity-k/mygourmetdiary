import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { usersService } from '@/lib/api/services/users.service';

export const GET = withAuth(async (req: NextRequest, user) => {
  const id = req.nextUrl.pathname.split('/').at(-1);
  if (!id) return apiError('Missing user ID', 400);

  try {
    const profile = await usersService.getPublicProfile(id, user.id);
    return apiSuccess(profile);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return apiError('User not found', 404);
    }
    console.error('Get public profile error:', err);
    return apiError('Internal server error', 500);
  }
});
