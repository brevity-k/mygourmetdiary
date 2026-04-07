import { NextRequest } from 'next/server';
import type { NoteType } from '@prisma/client';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notesService } from '@/lib/api/services/notes.service';

const VALID_NOTE_TYPES = ['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT'];
const VALID_FEED_TYPES = ['personal', 'public', 'social'];

export const GET = withAuth(async (req: NextRequest, user) => {
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = notesService.clampLimit(limitStr ? parseInt(limitStr, 10) : undefined);
  const type = req.nextUrl.searchParams.get('type') as NoteType | null;
  const feedType = req.nextUrl.searchParams.get('feed') ?? 'personal';
  const binderId = req.nextUrl.searchParams.get('binderId') ?? undefined;

  if (type && !VALID_NOTE_TYPES.includes(type)) {
    return apiError('Invalid note type', 400);
  }

  if (!VALID_FEED_TYPES.includes(feedType)) {
    return apiError('Invalid feed type. Use: personal, public, or social', 400);
  }

  let result;
  switch (feedType) {
    case 'public':
      result = await notesService.publicFeed(cursor, limit, type ?? undefined);
      break;
    case 'social':
      result = await notesService.socialFeed(user.id, cursor, limit, type ?? undefined);
      break;
    default:
      result = await notesService.feed(user.id, cursor, limit, type ?? undefined, binderId);
      break;
  }

  return apiSuccess(result);
});
