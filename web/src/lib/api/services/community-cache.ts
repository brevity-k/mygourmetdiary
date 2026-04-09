import { getRedis } from '../clients/redis';

export async function invalidateCommunityCache(
  subjectType: 'venue' | 'product',
  subjectId: string,
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`community-stats:${subjectType}:${subjectId}`);

    for (const prefix of ['community-gourmets', 'community-notes']) {
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(
          cursor,
          'MATCH',
          `${prefix}:${subjectType}:${subjectId}:*`,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) await redis.del(...keys);
      } while (cursor !== '0');
    }
  } catch {
    // Non-fatal — stale data expires via TTL
  }
}
