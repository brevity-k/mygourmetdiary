import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const client = new Redis(process.env.REDIS_URL || '', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  if (process.env.NODE_ENV !== 'production') globalForRedis.redis = client;
  return client;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function getJson<T>(key: string): Promise<T | null> {
  const data = await getRedis().get(key);
  return data ? JSON.parse(data) : null;
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
