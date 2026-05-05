import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@prisma/client';
import { prisma } from './clients/prisma';
import { apiError } from './response';

type AuthHandler = (req: NextRequest, user: User) => Promise<Response>;
type CronHandler = (req: NextRequest) => Promise<Response>;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) return apiError('Unauthorized', 401);

      const supabase = getSupabaseAdmin();
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !authUser) return apiError('Unauthorized', 401);

      const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
      if (!user) return apiError('User not found', 404);

      return handler(req, user);
    } catch (err) {
      console.error('Auth middleware error:', err);
      return apiError('Internal server error', 500);
    }
  };
}

export function withPremium(handler: AuthHandler) {
  return withAuth(async (req, user) => {
    if (user.subscriptionTier !== 'CONNOISSEUR') {
      return apiError('Premium subscription required', 403);
    }
    return handler(req, user);
  });
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function withCron(handler: CronHandler) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization') ?? '';
    const secret = process.env.CRON_SECRET;
    if (!secret || !safeEqual(authHeader, `Bearer ${secret}`)) {
      return apiError('Unauthorized', 401);
    }
    return handler(req);
  };
}
