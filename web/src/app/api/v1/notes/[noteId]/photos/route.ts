import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notesService } from '@/lib/api/services/notes.service';
import { attachPhotosSchema } from '@/lib/api/validators/notes';

function extractNoteId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  // URL: /api/v1/notes/{noteId}/photos
  const notesIdx = segments.indexOf('notes');
  return segments[notesIdx + 1];
}

export const POST = withAuth(async (req: NextRequest, user) => {
  const noteId = extractNoteId(req);
  const parsed = attachPhotosSchema.safeParse(await req.json());
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  }

  try {
    const note = await notesService.attachPhotos(noteId, user.id, parsed.data.photoIds);
    return apiSuccess(note);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Note not found') return apiError('Note not found', 404);
      if (err.message === 'Forbidden') return apiError('Forbidden', 403);
      if (err.message === 'Maximum 5 photos per note') return apiError(err.message, 400);
    }
    console.error('Attach photos error:', err);
    return apiError('Internal server error', 500);
  }
});
