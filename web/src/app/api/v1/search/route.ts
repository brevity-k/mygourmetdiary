import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { notesSearchService } from '@/lib/api/services/notes.search.service';

export const GET = withAuth(async (req: NextRequest, user) => {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  const type = req.nextUrl.searchParams.get('type') ?? undefined;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const offsetStr = req.nextUrl.searchParams.get('offset');
  const limit = limitStr ? Math.min(Math.max(parseInt(limitStr, 10), 1), 100) : 20;
  const offset = offsetStr ? Math.max(parseInt(offsetStr, 10), 0) : 0;

  if (!query.trim()) {
    return apiError('Query parameter "q" is required', 400);
  }

  try {
    const results = await notesSearchService.search(user.id, query, type, limit, offset);
    return apiSuccess(results);
  } catch (err) {
    console.error('Search error:', err);
    return apiError('Search failed', 500);
  }
});
