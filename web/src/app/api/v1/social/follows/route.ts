import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { followsService } from '@/lib/api/services/social/follows.service';
import { followBinderSchema } from '@/lib/api/validators/social';

export const GET = withAuth(async (req: NextRequest, user) => {
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = followsService.clampLimit(limitStr ? parseInt(limitStr, 10) : undefined);

  const result = await followsService.getFollowing(user.id, cursor, limit);
  return apiSuccess(result);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = followBinderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const follow = await followsService.follow(user.id, parsed.data.binderId);
    return apiSuccess(follow, 201);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Binder not found') return apiError(err.message, 404);
      if (err.message === 'Cannot follow your own binder') return apiError(err.message, 400);
      if (err.message.includes('Free tier limited')) return apiError(err.message, 403);
    }
    console.error('Follow error:', err);
    return apiError('Failed to follow binder', 500);
  }
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const binderId = req.nextUrl.searchParams.get('binderId');
  if (!binderId) return apiError('binderId is required', 400);

  await followsService.unfollow(user.id, binderId);
  return new Response(null, { status: 204 });
});
