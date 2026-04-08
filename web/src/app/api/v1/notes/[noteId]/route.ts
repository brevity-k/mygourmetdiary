import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notesService } from '@/lib/api/services/notes.service';
import { updateNoteSchema } from '@/lib/api/validators/notes';

function extractNoteId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  // URL: /api/v1/notes/{noteId}
  const notesIdx = segments.indexOf('notes');
  return segments[notesIdx + 1];
}

export const GET = withAuth(async (req: NextRequest, user) => {
  const noteId = extractNoteId(req);
  try {
    const note = await notesService.findById(noteId, user.id);
    return apiSuccess(note);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Note not found') return apiError('Note not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
    }
    console.error('Get note error:', err);
    return apiError('Internal server error', 500);
  }
});

export const PATCH = withAuth(async (req: NextRequest, user) => {
  const noteId = extractNoteId(req);
  const parsed = updateNoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const note = await notesService.update(noteId, user.id, parsed.data);
    return apiSuccess(note);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Note not found') return apiError('Note not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
      if (err.message === 'Invalid binder') return apiError(err.message, 400);
      if (err.message.startsWith('Invalid extension') || err.message.startsWith('Unknown note type')) {
        return apiError(err.message, 400);
      }
    }
    console.error('Update note error:', err);
    return apiError('Internal server error', 500);
  }
});

export const DELETE = withAuth(async (req: NextRequest, user) => {
  const noteId = extractNoteId(req);
  try {
    await notesService.remove(noteId, user.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Note not found') return apiError('Note not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
    }
    console.error('Delete note error:', err);
    return apiError('Internal server error', 500);
  }
});
