import { prisma } from '@/lib/api/clients/prisma';
import { apiSuccess } from '@/lib/api/response';

export async function GET() {
  const dbOk = await prisma.$queryRaw`SELECT 1`
    .then(() => true)
    .catch(() => false);

  return apiSuccess({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    db: dbOk ? 'connected' : 'unreachable',
  });
}
