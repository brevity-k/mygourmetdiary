import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from './clients/redis';

export interface RateLimitConfig {
  /** Bucket name — part of the Redis key. */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

/** Default: authenticated writes — generous but bounds runaway scripts. */
export const DEFAULT_WRITE_LIMIT: RateLimitConfig = {
  name: 'write',
  limit: 60,
  windowSec: 60,
};

/** Strict: expensive upstream calls (Google Places, Supabase storage presign). */
export const STRICT_LIMIT: RateLimitConfig = {
  name: 'strict',
  limit: 10,
  windowSec: 60,
};

/** Unauth mutation (register) — by IP. */
export const AUTH_LIMIT: RateLimitConfig = {
  name: 'auth',
  limit: 20,
  windowSec: 5 * 60,
};

/**
 * Fixed-window counter. Fail-open on Redis error — rate limiting is a
 * secondary control, not a hard gate; Redis outages should not take the
 * app offline. Authorization is still enforced in `withAuth`.
 */
export async function checkLimit(
  cfg: RateLimitConfig,
  key: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / cfg.windowSec);
  const redisKey = `rl:${cfg.name}:${key}:${bucket}`;
  const resetAt = (bucket + 1) * cfg.windowSec;

  try {
    const r = getRedis();
    const count = await r.incr(redisKey);
    if (count === 1) await r.expire(redisKey, cfg.windowSec);
    return {
      allowed: count <= cfg.limit,
      remaining: Math.max(0, cfg.limit - count),
      resetAt,
    };
  } catch {
    return { allowed: true, remaining: cfg.limit, resetAt };
  }
}

function rateLimitedResponse(result: { remaining: number; resetAt: number }) {
  return NextResponse.json(
    {
      message: 'Rate limit exceeded',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    },
  );
}

/** Use after withAuth — keys by user id. Returns a 429 Response if over limit. */
export async function limitByUser(
  cfg: RateLimitConfig,
  userId: string,
): Promise<Response | null> {
  const result = await checkLimit(cfg, userId);
  if (result.allowed) return null;
  return rateLimitedResponse(result);
}

/** For unauthenticated routes — keys by request IP. */
export async function limitByIp(
  cfg: RateLimitConfig,
  req: NextRequest,
): Promise<Response | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const result = await checkLimit(cfg, ip);
  if (result.allowed) return null;
  return rateLimitedResponse(result);
}
