import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { bindersService } from '@/lib/api/services/binders.service';
import { createBinderSchema } from '@/lib/api/validators/binders';

export const GET = withAuth(async (_req: NextRequest, user) => {
  const binders = await bindersService.findAllByOwner(user.id);
  return apiSuccess(binders);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = createBinderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const binder = await bindersService.create(user.id, parsed.data);
    return apiSuccess(binder, 201);
  } catch (err) {
    console.error('Create binder error:', err);
    return apiError('Failed to create binder', 500);
  }
});
