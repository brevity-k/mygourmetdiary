import { NextRequest } from 'next/server';
import type { NoteType } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notesService } from '@/lib/api/services/notes.service';
import { createNoteSchema } from '@/lib/api/validators/notes';

const VALID_NOTE_TYPES = ['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT'];

export const GET = withAuth(async (req: NextRequest, user) => {
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = notesService.clampLimit(limitStr ? parseInt(limitStr, 10) : undefined);
  const type = req.nextUrl.searchParams.get('type') as NoteType | null;
  const binderId = req.nextUrl.searchParams.get('binderId') ?? undefined;

  if (type && !VALID_NOTE_TYPES.includes(type)) {
    return apiError('Invalid note type', 400);
  }

  const result = await notesService.feed(user.id, cursor, limit, type ?? undefined, binderId);
  return apiSuccess(result);
});

export const POST = withAuth(async (req: NextRequest, user) => {
  const parsed = createNoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const note = await notesService.create(user.id, parsed.data);
    return apiSuccess(note, 201);
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg === 'Invalid binder') return apiError(msg, 400);
      if (msg === 'Venue not found. Search for it first.') return apiError(msg, 400);
      if (msg.startsWith('Unknown note type') || msg.startsWith('Invalid extension')) {
        return apiError(msg, 400);
      }
    }
    console.error('Create note error:', err);
    return apiError('Failed to create note', 500);
  }
});
