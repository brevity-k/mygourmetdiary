import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/api/clients/prisma';
import { apiSuccess, apiError } from '@/lib/api/response';

const DEFAULT_BINDERS = [
  { name: 'My Restaurant Notes', category: 'RESTAURANT' as const },
  { name: 'My Wine Notes', category: 'WINE' as const },
  { name: 'My Spirit Notes', category: 'SPIRIT' as const },
  { name: 'My Winery Visits', category: 'MIXED' as const },
];

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return apiError('Unauthorized', 401);

    // Dev bypass
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev:')) {
      const uid = token.substring(4);
      const user = await upsertUser(uid, `${uid}@gourmet.local`, 'Dev User', null);
      return apiSuccess(user, 201);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return apiError('Unauthorized', 401);

    const user = await upsertUser(
      authUser.id,
      authUser.email ?? '',
      authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'Gourmet',
      authUser.user_metadata?.avatar_url ?? null,
    );

    return apiSuccess(user, 201);
  } catch (err) {
    console.error('Register error:', err);
    return apiError('Internal server error', 500);
  }
}

async function upsertUser(supabaseId: string, email: string, displayName: string, avatarUrl: string | null) {
  const user = await prisma.user.upsert({
    where: { supabaseId },
    update: { email, displayName, avatarUrl },
    create: { supabaseId, email, displayName, avatarUrl },
  });

  // Create default binders if they don't exist
  const existingBinders = await prisma.binder.count({
    where: { ownerId: user.id, isDefault: true },
  });

  if (existingBinders === 0) {
    await prisma.binder.createMany({
      data: DEFAULT_BINDERS.map((b) => ({
        ownerId: user.id,
        name: b.name,
        category: b.category,
        isDefault: true,
      })),
    });
  }

  return user;
}
