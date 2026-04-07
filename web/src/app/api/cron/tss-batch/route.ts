import { NextRequest } from 'next/server';
import { withCron } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { tssBatchService } from '@/lib/api/services/taste-matching/tss-batch.service';

export const GET = withCron(async (_req: NextRequest) => {
  const result = await tssBatchService.processChunk();
  return apiSuccess(result);
});
