import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('REDIS_URL not set — cache disabled');
  }

  const client = new Redis(url || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times: number) {
      if (times > 2) return null; // stop retrying
      return Math.min(times * 200, 1000);
    },
  });

  client.on('error', (err: Error) => {
    console.warn('Redis error (non-fatal):', err.message);
  });

  globalForRedis.redis = client;
  return client;
}

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null; // Cache miss on error — proceed without cache
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Non-fatal — cache write failure is OK
  }
}

// Re-export for direct redis access (rate limiting, etc.)
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
