import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { bindersService } from '@/lib/api/services/binders.service';
import { updateBinderSchema } from '@/lib/api/validators/binders';

function extractId(req: NextRequest): string {
  return req.nextUrl.pathname.split('/').at(-1)!;
}

export const GET = withAuth(async (req: NextRequest, user) => {
  const id = extractId(req);
  try {
    const binder = await bindersService.findById(id, user.id);
    return apiSuccess(binder);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Binder not found') return apiError('Binder not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
    }
    console.error('Get binder error:', err);
    return apiError('Internal server error', 500);
  }
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const id = extractId(req);
  const parsed = updateBinderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const binder = await bindersService.update(id, user.id, parsed.data);
    return apiSuccess(binder);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Binder not found') return apiError('Binder not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
    }
    console.error('Update binder error:', err);
    return apiError('Internal server error', 500);
  }
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const id = extractId(req);
  try {
    await bindersService.remove(id, user.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Binder not found') return apiError('Binder not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
      if (err.message === 'Cannot delete default binders') {
        return apiError('Cannot delete default binders', 400);
      }
    }
    console.error('Delete binder error:', err);
    return apiError('Internal server error', 500);
  }
});
