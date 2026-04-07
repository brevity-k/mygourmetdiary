import { NextRequest } from 'next/server';
import type { TasteCategory } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { friendsService } from '@/lib/api/services/social/friends.service';
import { pinFriendSchema, updatePinSchema } from '@/lib/api/validators/social';

export const GET = withAuth(async (req: NextRequest, user) => {
  const targetId = req.nextUrl.searchParams.get('userId');

  // If userId query param is provided, return compatibility
  if (targetId) {
    const action = req.nextUrl.searchParams.get('action');
    if (action === 'can-pin') {
      const result = await friendsService.canPin(user.id, targetId);
      return apiSuccess(result);
    }
    const result = await friendsService.getCompatibility(user.id, targetId);
    return apiSuccess(result);
  }

  // Otherwise, list all pinned friends
  const friends = await friendsService.listFriends(user.id);
  return apiSuccess(friends);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();

  // Check if this is an update (PATCH-like operation via POST)
  if (body._action === 'update' && body.pinnedId) {
    const parsed = updatePinSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    try {
      const pin = await friendsService.updatePin(
        user.id,
        body.pinnedId,
        { categories: parsed.data.categories as TasteCategory[] },
      );
      return apiSuccess(pin);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Pin not found') return apiError(err.message, 404);
        if (err.message.includes('Insufficient taste overlap')) return apiError(err.message, 400);
      }
      console.error('Update pin error:', err);
      return apiError('Failed to update pin', 500);
    }
  }

  // Normal pin creation
  const parsed = pinFriendSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const pin = await friendsService.pinFriend(user.id, {
      pinnedId: parsed.data.pinnedId,
      categories: parsed.data.categories as TasteCategory[],
    });
    return apiSuccess(pin, 201);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Cannot pin yourself') return apiError(err.message, 400);
      if (err.message === 'User not found') return apiError(err.message, 404);
      if (err.message.includes('Free tier limited')) return apiError(err.message, 403);
      if (err.message.includes('Insufficient taste overlap')) return apiError(err.message, 400);
    }
    console.error('Pin friend error:', err);
    return apiError('Failed to pin friend', 500);
  }
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const pinnedId = req.nextUrl.searchParams.get('pinnedId');
  if (!pinnedId) return apiError('pinnedId is required', 400);

  await friendsService.unpinFriend(user.id, pinnedId);
  return new Response(null, { status: 204 });
});
