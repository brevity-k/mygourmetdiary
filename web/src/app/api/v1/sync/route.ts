import { NextRequest } from 'next/server';
import { withPremium } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { syncService } from '@/lib/api/services/sync.service';

export const POST = withPremium(async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));
  const since = body.since as string | undefined;
  const cursor = body.cursor as string | undefined;

  const result = await syncService.exportNotes(user.id, since, cursor);
  return apiSuccess(result);
});
