import { NextRequest } from 'next/server';
import type { SignalType } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { signalsService } from '@/lib/api/services/social/signals.service';
import { createSignalSchema } from '@/lib/api/validators/social';

export const GET = withAuth(async (req: NextRequest, user) => {
  const noteId = req.nextUrl.searchParams.get('noteId');
  if (!noteId) return apiError('noteId is required', 400);

  const result = await signalsService.getSignalSummary(noteId, user.id);
  return apiSuccess(result);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const noteId = body.noteId as string | undefined;
  if (!noteId) return apiError('noteId is required', 400);

  const parsed = createSignalSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const signal = await signalsService.sendSignal(user.id, noteId, {
      signalType: parsed.data.signalType as SignalType,
      senderRating: parsed.data.senderRating,
    });
    return apiSuccess(signal, 201);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Note not found') return apiError(err.message, 404);
      if (err.message === 'Cannot signal a private note') return apiError(err.message, 403);
      if (err.message === 'Cannot signal your own note') return apiError(err.message, 400);
    }
    console.error('Send signal error:', err);
    return apiError('Failed to send signal', 500);
  }
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const noteId = req.nextUrl.searchParams.get('noteId');
  const signalType = req.nextUrl.searchParams.get('signalType') as SignalType | null;
  if (!noteId || !signalType) {
    return apiError('noteId and signalType are required', 400);
  }
  if (!['BOOKMARKED', 'ECHOED', 'DIVERGED'].includes(signalType)) {
    return apiError('Invalid signal type', 400);
  }

  await signalsService.removeSignal(user.id, noteId, signalType);
  return new Response(null, { status: 204 });
});
