# Full Supabase Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate MyGourmetDiary from NestJS + Firebase + Meilisearch + R2 (7 vendors) to Next.js API Routes + Supabase (4 vendors), reducing cost by ~60% and operational complexity by half.

**Architecture:** All backend logic moves from a standalone NestJS app on Railway into Next.js API route handlers on Vercel. Supabase replaces Firebase Auth, Meilisearch, Cloudflare R2, and the managed PostgreSQL instance. Upstash Redis stays on free tier for TSS caching and rate limiting.

**Tech Stack:** Next.js 16 (App Router + API Routes), Supabase (PostgreSQL + Auth + Storage), Prisma ORM, Upstash Redis, Zod validation, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-04-06-full-supabase-migration-design.md`

---

## File Structure — New & Modified Files

### New Files (API infrastructure)

```
web/src/lib/api/
├── middleware.ts                      # withAuth(), withPremium(), withCron(), withRateLimit()
├── response.ts                       # apiSuccess(), apiError() helpers
├── clients/
│   ├── supabase-server.ts            # Server-side Supabase client (service role)
│   ├── prisma.ts                     # Prisma singleton for serverless
│   ├── redis.ts                      # Upstash Redis client
│   └── google-places.ts              # Google Places API client (from backend)
├── validators/
│   ├── notes.ts                      # Zod schemas for note CRUD
│   ├── binders.ts                    # Zod schemas for binder CRUD
│   ├── users.ts                      # Zod schemas for user update
│   ├── photos.ts                     # Zod schemas for photo presign
│   ├── social.ts                     # Zod schemas for signals, follows, friends
│   └── common.ts                     # Shared schemas (pagination, etc.)
└── services/
    ├── notes.service.ts              # Note CRUD (from backend/src/notes/)
    ├── notes.search.service.ts       # Postgres-only search (no Meilisearch)
    ├── binders.service.ts            # Binder CRUD
    ├── users.service.ts              # User CRUD + sanitization
    ├── venues.service.ts             # Venue CRUD + Google Places cache
    ├── photos.service.ts             # Supabase Storage presign + cleanup
    ├── tags.service.ts               # Tag taxonomy
    ├── social/
    │   ├── follows.service.ts        # Binder follow CRUD
    │   ├── signals.service.ts        # Taste signal CRUD
    │   └── friends.service.ts        # Gourmet friend CRUD
    ├── taste-matching/
    │   ├── tss-computation.service.ts
    │   ├── tss-cache.service.ts
    │   ├── tss-batch.service.ts      # Chunked batch (replaces tss-batch.job.ts)
    │   └── tiered-search.service.ts
    ├── area-explorer.service.ts
    ├── menu-decider.service.ts
    ├── pioneers.service.ts
    ├── notifications.service.ts
    ├── subscriptions.service.ts
    └── sync.service.ts
```

### New Files (API routes)

```
web/src/app/api/v1/
├── auth/register/route.ts
├── users/
│   ├── me/route.ts
│   └── [id]/route.ts
├── binders/
│   ├── route.ts
│   └── [id]/route.ts
├── notes/
│   ├── route.ts
│   ├── feed/route.ts
│   └── [noteId]/
│       ├── route.ts
│       └── photos/route.ts
├── venues/
│   ├── search/route.ts
│   └── [placeId]/route.ts
├── photos/presign/route.ts
├── search/
│   ├── route.ts
│   └── all/route.ts
├── explore/
│   ├── map/route.ts
│   └── venue/[venueId]/notes/route.ts
├── social/
│   ├── follows/route.ts
│   ├── signals/route.ts
│   └── friends/
│       ├── route.ts
│       └── discover/route.ts
├── menu-decider/[venueId]/route.ts
├── subscriptions/webhook/route.ts
├── notifications/
│   ├── tokens/route.ts
│   └── preferences/route.ts
├── sync/route.ts
├── tags/route.ts
├── pioneers/route.ts
├── health/route.ts
└── cron/
    ├── tss-batch/route.ts
    └── photo-cleanup/route.ts
```

### New Files (Supabase client-side)

```
web/src/lib/supabase/
├── client.ts                          # Browser Supabase client
├── middleware.ts                      # Next.js middleware for session refresh
└── server.ts                          # SSR Supabase client (for server components)

mobile/src/lib/
└── supabase.ts                        # Mobile Supabase client
```

### Modified Files

```
web/src/lib/auth-context.tsx           # Firebase → Supabase auth
web/src/lib/api.ts                     # getToken: Firebase → Supabase session
web/src/app/(auth)/login/page.tsx      # Firebase signIn → Supabase signIn
web/src/app/(auth)/register/page.tsx   # Firebase register → Supabase signUp
web/src/middleware.ts                   # NEW or MODIFY: Supabase session refresh
web/package.json                       # Add supabase, prisma, upstash; remove firebase
web/vercel.json                        # Add cron config

mobile/src/auth/firebase.ts            # Rename & rewrite → supabase.ts
mobile/src/auth/useAuthState.ts        # Firebase listener → Supabase listener
mobile/src/store/auth.store.ts         # firebaseToken → supabaseToken
mobile/src/api/client.ts               # Token injection: Firebase → Supabase
mobile/package.json                    # Add supabase; remove firebase

backend/prisma/schema.prisma           # firebaseUid → supabaseId + new indexes
package.json                           # Remove backend workspace
```

### Deleted

```
backend/src/                           # Entire NestJS app (~80 files)
backend/package.json
backend/tsconfig.json
backend/nest-cli.json
backend/Procfile
railway.toml
web/src/lib/firebase.ts                # Replaced by supabase client
mobile/src/types/firebase-auth.d.ts
```

---

## Phase 0: Preparation & Supabase Setup

### Task 0.1: Create Supabase Project and Configure Providers

**Files:**
- Create: `web/src/lib/supabase/client.ts`
- Create: `web/src/lib/supabase/server.ts`
- Create: `web/src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create Supabase project via dashboard**

Go to https://supabase.com/dashboard and create a new project called `mygourmetdiary`. Note these values:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key → `SUPABASE_SERVICE_ROLE_KEY`
- Database connection string (pooled, port 6543) → `SUPABASE_DB_URL`
- Database connection string (direct, port 5432) → `SUPABASE_DB_URL_DIRECT`

- [ ] **Step 2: Enable auth providers in Supabase dashboard**

In Authentication > Providers:
- Enable Google OAuth (add client ID + secret from Google Cloud Console — reuse existing credentials from Firebase setup)
- Enable Apple OAuth (add service ID + secret — reuse existing Apple Developer credentials)
- Set redirect URLs: `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`

- [ ] **Step 3: Enable pg_trgm extension**

In SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

- [ ] **Step 4: Create photos storage bucket**

In Storage > New bucket:
- Name: `photos`
- Public: yes
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`

- [ ] **Step 5: Install Supabase dependencies**

```bash
cd web && npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 6: Create browser Supabase client**

```typescript
// web/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 7: Create SSR Supabase client**

```typescript
// web/src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

- [ ] **Step 8: Create Next.js middleware for Supabase session refresh**

```typescript
// web/src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}
```

- [ ] **Step 9: Wire middleware into Next.js**

```typescript
// web/src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 10: Add env vars to .env.local**

```bash
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_DB_URL_DIRECT=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/supabase/ web/src/middleware.ts web/package.json web/package-lock.json
git commit -m "chore: add Supabase clients and session middleware"
```

---

## Phase 1: Database Migration

### Task 1.1: Move Prisma to Web Package and Point at Supabase

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `web/src/lib/api/clients/prisma.ts`
- Modify: `web/package.json`

- [ ] **Step 1: Copy prisma directory to web**

```bash
cp -r backend/prisma web/prisma
```

- [ ] **Step 2: Install Prisma in web package**

```bash
cd web && npm install prisma @prisma/client @prisma/adapter-pg pg
```

- [ ] **Step 3: Update schema.prisma — rename firebaseUid to supabaseId**

In `web/prisma/schema.prisma`, find the User model and change:
```prisma
model User {
  id                    String             @id @default(uuid())
  supabaseId            String             @unique @map("supabase_id")
  email                 String             @unique
  displayName           String?            @map("display_name")
  avatarUrl             String?            @map("avatar_url")
  subscriptionTier      SubscriptionTier   @default(FREE) @map("subscription_tier")
  subscriptionExpiresAt DateTime?          @map("subscription_expires_at")
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  binders               Binder[]
  notes                 Note[]
  photos                Photo[]
  pushTokens            PushToken[]
  notificationPref      NotificationPreference?
  sentSignals           TasteSignal[]
  similaritiesAsA       TasteSimilarity[]  @relation("userA")
  similaritiesAsB       TasteSimilarity[]  @relation("userB")
  pinnedFriends         GourmetFriendPin[] @relation("pinner")
  pinnedBy              GourmetFriendPin[] @relation("pinned")
  binderFollows         BinderFollow[]
  pioneerBadges         PioneerBadge[]

  @@index([email])
  @@index([supabaseId])
  @@map("users")
}
```

Note: The actual column rename from `firebase_uid` to `supabase_id` will require a manual migration SQL. Since there are no real users, this is a clean rename.

- [ ] **Step 4: Add missing indexes to schema**

Add to `Venue` model:
```prisma
  @@index([lat, lng])
```

Add to `Note` model:
```prisma
  @@index([venueId, visibility])
  @@index([authorId, visibility])
```

- [ ] **Step 5: Update datasource to use env vars with pooling**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("SUPABASE_DB_URL")
  directUrl = env("SUPABASE_DB_URL_DIRECT")
}
```

- [ ] **Step 6: Create Prisma migration**

```bash
cd web && npx prisma migrate dev --name supabase-migration
```

This generates the migration SQL that renames `firebase_uid` → `supabase_id` and adds indexes.

- [ ] **Step 7: Create Prisma singleton for serverless**

```typescript
// web/src/lib/api/clients/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 8: Add pg_trgm indexes via raw SQL migration**

Create `web/prisma/migrations/<timestamp>_add_trgm_indexes/migration.sql`:
```sql
CREATE INDEX IF NOT EXISTS idx_notes_title_trgm ON "Note" USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notes_freetext_trgm ON "Note" USING gin("freeText" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm ON "Venue" USING gin(name gin_trgm_ops);
```

```bash
cd web && npx prisma migrate dev --name add-trgm-indexes
```

- [ ] **Step 9: Verify Prisma connects to Supabase**

```bash
cd web && npx prisma db pull --print
```

Should show the schema matching your models.

- [ ] **Step 10: Commit**

```bash
git add web/prisma/ web/src/lib/api/clients/prisma.ts web/package.json
git commit -m "feat: migrate Prisma to Supabase PostgreSQL with new indexes"
```

---

### Task 1.2: Create API Infrastructure (Middleware, Response Helpers, Redis Client)

**Files:**
- Create: `web/src/lib/api/middleware.ts`
- Create: `web/src/lib/api/response.ts`
- Create: `web/src/lib/api/clients/redis.ts`
- Create: `web/src/lib/api/clients/supabase-server.ts`

- [ ] **Step 1: Install Upstash dependencies**

```bash
cd web && npm install @upstash/redis @upstash/ratelimit ioredis
```

- [ ] **Step 2: Create Redis client**

```typescript
// web/src/lib/api/clients/redis.ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3 });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function getJson<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
```

- [ ] **Step 3: Create server-side Supabase client (service role)**

```typescript
// web/src/lib/api/clients/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as { supabaseAdmin: ReturnType<typeof createClient> };

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ??
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

if (process.env.NODE_ENV !== 'production') globalForSupabase.supabaseAdmin = supabaseAdmin;
```

- [ ] **Step 4: Create response helpers**

```typescript
// web/src/lib/api/response.ts
import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { data, statusCode: status, timestamp: new Date().toISOString() },
    { status },
  );
}

export function apiError(message: string, status: number) {
  return NextResponse.json(
    { message, statusCode: status, timestamp: new Date().toISOString() },
    { status },
  );
}
```

- [ ] **Step 5: Create auth middleware**

```typescript
// web/src/lib/api/middleware.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { prisma } from './clients/prisma';
import { apiError } from './response';

// Types
interface UserRecord {
  id: string;
  supabaseId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type AuthHandler = (req: NextRequest, user: UserRecord) => Promise<Response>;
type CronHandler = (req: NextRequest) => Promise<Response>;

// Rate limiter (per-user, 120 req/min)
const ratelimit = process.env.REDIS_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(120, '1 m'),
    })
  : null;

// Supabase client for token verification
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
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) return apiError('Unauthorized', 401);

      const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
      if (!user) return apiError('User not found', 404);

      // Rate limit
      if (ratelimit) {
        const { success } = await ratelimit.limit(user.id);
        if (!success) return apiError('Too many requests', 429);
      }

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

export function withCron(handler: CronHandler) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }
    return handler(req);
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/
git commit -m "feat: add API infrastructure — middleware, response helpers, Redis & Supabase clients"
```

---

## Phase 2: Auth Migration (Firebase → Supabase)

### Task 2.1: Rewrite Web Auth Context

**Files:**
- Modify: `web/src/lib/auth-context.tsx`
- Delete: `web/src/lib/firebase.ts`
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Read current firebase.ts to understand the API surface**

Read `web/src/lib/firebase.ts` and note every exported function. The new Supabase client must export equivalent functions.

- [ ] **Step 2: Rewrite auth-context.tsx to use Supabase**

Replace the Firebase auth context with Supabase. Key changes:
- `onAuthStateChanged` → `supabase.auth.onAuthStateChange`
- `getIdToken()` → `supabase.auth.getSession()` → `session.access_token`
- `signInWithGoogle` → `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `signOut` → `supabase.auth.signOut()`

The auth context should:
1. Create a Supabase browser client
2. Listen for auth state changes
3. On sign-in, check if user profile exists in DB (via `/api/v1/auth/register`)
4. Provide `user`, `loading`, `signIn`, `signOut` to consumers

- [ ] **Step 3: Update api.ts token injection**

In `web/src/lib/api.ts`, change `getToken` to get the Supabase access token:
```typescript
getToken: async () => {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
},
```

- [ ] **Step 4: Delete firebase.ts**

```bash
rm web/src/lib/firebase.ts
```

- [ ] **Step 5: Update login and register pages**

Update `web/src/app/(auth)/login/page.tsx` and `register/page.tsx` to call `supabase.auth.signInWithOAuth()` and `supabase.auth.signUp()` instead of Firebase functions.

- [ ] **Step 6: Remove firebase dependency**

```bash
cd web && npm uninstall firebase
```

- [ ] **Step 7: Test sign-in flow end-to-end**

1. Start dev server: `cd web && npm run dev`
2. Navigate to `/login`
3. Click "Sign in with Google"
4. Verify redirect to Supabase OAuth → Google → callback → app
5. Verify user profile created in Supabase DB

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/ web/src/app/\(auth\)/ web/package.json
git commit -m "feat: migrate web auth from Firebase to Supabase"
```

---

### Task 2.2: Create Auth Register API Route

**Files:**
- Create: `web/src/app/api/v1/auth/register/route.ts`
- Create: `web/src/lib/api/services/users.service.ts`

- [ ] **Step 1: Read backend auth.service.ts to understand registration logic**

Read `backend/src/auth/auth.service.ts`. The registration flow:
1. Receive Supabase user data (id, email, displayName)
2. Upsert user in `users` table
3. Create 4 default binders if first login

- [ ] **Step 2: Create users service**

Port `backend/src/users/users.service.ts` and `backend/src/auth/auth.service.ts` registration logic to `web/src/lib/api/services/users.service.ts`. Remove `@Injectable()` decorators, use direct `prisma` import.

Key functions:
- `findBySupabaseId(supabaseId: string)`
- `registerOrSync(supabaseId: string, email: string, displayName: string | null)`
- `updateProfile(userId: string, data: UpdateUserInput)`
- `sanitizeUser(user: User)` — remove sensitive fields

- [ ] **Step 3: Create register route**

```typescript
// web/src/app/api/v1/auth/register/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { usersService } from '@/lib/api/services/users.service';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return apiError('Unauthorized', 401);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return apiError('Unauthorized', 401);

    const user = await usersService.registerOrSync(
      authUser.id,
      authUser.email!,
      authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
    );

    return apiSuccess(user, 201);
  } catch (err) {
    console.error('Register error:', err);
    return apiError('Internal server error', 500);
  }
}
```

- [ ] **Step 4: Test registration**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Authorization: Bearer <supabase-access-token>"
```

Verify user created in DB with default binders.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/v1/auth/ web/src/lib/api/services/users.service.ts
git commit -m "feat: add auth register API route with Supabase"
```

---

### Task 2.3: Migrate Mobile Auth

**Files:**
- Modify: `mobile/src/auth/firebase.ts` → rename to `mobile/src/auth/supabase.ts`
- Modify: `mobile/src/auth/useAuthState.ts`
- Modify: `mobile/src/store/auth.store.ts`
- Modify: `mobile/src/api/client.ts`
- Create: `mobile/src/lib/supabase.ts`
- Modify: `mobile/package.json`

- [ ] **Step 1: Install Supabase in mobile**

```bash
cd mobile && npm install @supabase/supabase-js
```

- [ ] **Step 2: Create Supabase client for mobile**

```typescript
// mobile/src/lib/supabase.ts
import 'react-native-url-polyfill/shim';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 3: Read and rewrite mobile auth**

Read `mobile/src/auth/firebase.ts`. Rewrite to use Supabase:
- `signInWithGoogle()` → use `expo-auth-session` to get Google ID token, then `supabase.auth.signInWithIdToken({ provider: 'google', token })`
- `signInWithApple()` → use `expo-apple-authentication` to get identity token, then `supabase.auth.signInWithIdToken({ provider: 'apple', token })`
- `signOut()` → `supabase.auth.signOut()`
- `onAuthStateChanged` → `supabase.auth.onAuthStateChange`

Rename file from `firebase.ts` to `supabase.ts`.

- [ ] **Step 4: Update auth store**

In `mobile/src/store/auth.store.ts`, rename `firebaseToken` to `accessToken` and update the getter to use `supabase.auth.getSession()`.

- [ ] **Step 5: Update API client token injection**

In `mobile/src/api/client.ts`, change the auth interceptor to get the token from the Supabase session instead of the auth store's Firebase token.

- [ ] **Step 6: Remove firebase dependency**

```bash
cd mobile && npm uninstall firebase
rm mobile/src/types/firebase-auth.d.ts
```

- [ ] **Step 7: Update mobile env vars**

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

Remove all `EXPO_PUBLIC_FIREBASE_*` vars.

- [ ] **Step 8: Test mobile auth flow**

```bash
cd mobile && npx expo start
```

Test Google and Apple sign-in on device/simulator.

- [ ] **Step 9: Commit**

```bash
git add mobile/
git commit -m "feat: migrate mobile auth from Firebase to Supabase"
```

---

## Phase 3: Storage Migration (R2 → Supabase Storage)

### Task 3.1: Create Photos Service with Supabase Storage

**Files:**
- Create: `web/src/lib/api/services/photos.service.ts`
- Create: `web/src/lib/api/validators/photos.ts`
- Create: `web/src/app/api/v1/photos/presign/route.ts`

- [ ] **Step 1: Read backend photos.service.ts**

Read `backend/src/photos/photos.service.ts`. Note:
- Presign flow: validate MIME + size → generate key → create signed URL → store Photo record
- Cleanup flow: find orphaned photos > 1h → delete from R2 + DB
- Allowed types: jpeg, png, webp, heic
- Max size: 10 MB

- [ ] **Step 2: Create Zod validators**

```typescript
// web/src/lib/api/validators/photos.ts
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const presignPhotoSchema = z.object({
  mimeType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]]),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});
```

- [ ] **Step 3: Create photos service**

```typescript
// web/src/lib/api/services/photos.service.ts
import { randomUUID } from 'crypto';
import { prisma } from '../clients/prisma';
import { supabaseAdmin } from '../clients/supabase-server';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

export const photosService = {
  async presign(uploaderId: string, mimeType: string) {
    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const key = `${uploaderId}/${randomUUID()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('photos')
      .createSignedUploadUrl(key);

    if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${key}`;

    const photo = await prisma.photo.create({
      data: {
        uploaderId,
        storageKey: key,
        publicUrl,
        mimeType,
      },
    });

    return {
      photoId: photo.id,
      uploadUrl: data.signedUrl,
      publicUrl,
      token: data.token,
    };
  },

  async cleanupOrphans() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const orphans = await prisma.photo.findMany({
      where: { noteId: null, createdAt: { lt: oneHourAgo } },
    });

    for (const photo of orphans) {
      await supabaseAdmin.storage.from('photos').remove([photo.storageKey]);
      await prisma.photo.delete({ where: { id: photo.id } });
    }

    return orphans.length;
  },
};
```

- [ ] **Step 4: Create presign route**

```typescript
// web/src/app/api/v1/photos/presign/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { presignPhotoSchema } from '@/lib/api/validators/photos';
import { photosService } from '@/lib/api/services/photos.service';

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = presignPhotoSchema.safeParse(await req.json());
  if (!body.success) return apiError(body.error.message, 400);

  const result = await photosService.presign(user.id, body.data.mimeType);
  return apiSuccess(result, 201);
});
```

- [ ] **Step 5: Test upload flow**

1. Call presign endpoint
2. Upload file to signed URL
3. Verify public URL serves the image

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/services/photos.service.ts web/src/lib/api/validators/photos.ts web/src/app/api/v1/photos/
git commit -m "feat: add photos service with Supabase Storage"
```

---

## Phase 4: Port All API Routes

This is the largest phase. Each task ports one domain from NestJS controllers + services to Next.js route handlers + services. The pattern is the same for each:

1. Read the NestJS service — understand the business logic
2. Port the service to `web/src/lib/api/services/` — remove `@Injectable()`, replace DI with direct imports
3. Create Zod validators to replace class-validator DTOs
4. Create route handlers in `web/src/app/api/v1/`
5. Test the endpoint
6. Commit

### Task 4.1: Port Health + Tags (simplest, validates the pattern)

**Files:**
- Create: `web/src/app/api/v1/health/route.ts`
- Create: `web/src/app/api/v1/tags/route.ts`
- Create: `web/src/lib/api/services/tags.service.ts`

- [ ] **Step 1: Create health route**

```typescript
// web/src/app/api/v1/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

- [ ] **Step 2: Read and port tags service**

Read `backend/src/tags/tags.service.ts`. Port to `web/src/lib/api/services/tags.service.ts`.

- [ ] **Step 3: Create tags route**

Read `backend/src/tags/tags.controller.ts`. Port GET handler to `web/src/app/api/v1/tags/route.ts` using `withAuth`.

- [ ] **Step 4: Test both endpoints**

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/tags -H "Authorization: Bearer <token>"
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/v1/health/ web/src/app/api/v1/tags/ web/src/lib/api/services/tags.service.ts
git commit -m "feat: port health and tags API routes"
```

### Task 4.2: Port Users Routes

**Files:**
- Create: `web/src/app/api/v1/users/me/route.ts`
- Create: `web/src/app/api/v1/users/[id]/route.ts`
- Create: `web/src/lib/api/validators/users.ts`

- [ ] **Step 1: Read backend users controller + service**

Read `backend/src/users/users.controller.ts` and `backend/src/users/users.service.ts`.

- [ ] **Step 2: Create Zod validators**

Port `update-user.dto.ts` to Zod schema in `web/src/lib/api/validators/users.ts`.

- [ ] **Step 3: Create route handlers**

Port GET/PATCH `/users/me` and GET `/users/:id` to route files using `withAuth`.

- [ ] **Step 4: Test**

```bash
curl http://localhost:3000/api/v1/users/me -H "Authorization: Bearer <token>"
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/v1/users/ web/src/lib/api/validators/users.ts
git commit -m "feat: port users API routes"
```

### Task 4.3: Port Binders Routes

**Files:**
- Create: `web/src/app/api/v1/binders/route.ts`
- Create: `web/src/app/api/v1/binders/[id]/route.ts`
- Create: `web/src/lib/api/services/binders.service.ts`
- Create: `web/src/lib/api/validators/binders.ts`

- [ ] **Step 1: Read and port binders service + controller**

Read `backend/src/binders/binders.service.ts` and `binders.controller.ts`. Port service, create Zod validators, create route handlers for GET (list), POST (create), GET/PATCH/DELETE (by id).

- [ ] **Step 2: Test all CRUD operations**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: port binders API routes"
```

### Task 4.4: Port Venues Routes

**Files:**
- Create: `web/src/app/api/v1/venues/search/route.ts`
- Create: `web/src/app/api/v1/venues/[placeId]/route.ts`
- Create: `web/src/lib/api/services/venues.service.ts`
- Create: `web/src/lib/api/clients/google-places.ts`

- [ ] **Step 1: Port Google Places client**

Read `backend/src/venues/google-places.client.ts`. Port to `web/src/lib/api/clients/google-places.ts` as a plain module (no DI).

- [ ] **Step 2: Port venues service**

Read `backend/src/venues/venues.service.ts`. Port with Redis caching layer intact.

- [ ] **Step 3: Create route handlers**
- [ ] **Step 4: Test venue search (verifies Google Places API key works)**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: port venues API routes with Google Places integration"
```

### Task 4.5: Port Notes Routes (largest service)

**Files:**
- Create: `web/src/app/api/v1/notes/route.ts`
- Create: `web/src/app/api/v1/notes/feed/route.ts`
- Create: `web/src/app/api/v1/notes/[noteId]/route.ts`
- Create: `web/src/app/api/v1/notes/[noteId]/photos/route.ts`
- Create: `web/src/lib/api/services/notes.service.ts`
- Create: `web/src/lib/api/services/notes.search.service.ts`
- Create: `web/src/lib/api/validators/notes.ts`

- [ ] **Step 1: Port notes service**

Read `backend/src/notes/notes.service.ts`. Port all CRUD + feed logic. Remove Meilisearch `indexNote`/`removeNote` calls.

- [ ] **Step 2: Port search service (Postgres only)**

Read `backend/src/notes/notes.search.service.ts`. Port ONLY the Postgres paths (lines 230-260 for personal search, lines 334-365 for public search). Drop all Meilisearch code.

Enhance with `pg_trgm` similarity for better relevance:
```typescript
// In searchAll, replace ILIKE with pg_trgm similarity
where.AND = [{
  OR: [
    { title: { contains: query.trim(), mode: 'insensitive' } },
    { freeText: { contains: query.trim(), mode: 'insensitive' } },
    { venue: { name: { contains: query.trim(), mode: 'insensitive' } } },
  ],
}];
```

- [ ] **Step 3: Create Zod validators**

Port `create-note.dto.ts`, `update-note.dto.ts`, `extensions.dto.ts` to Zod schemas.

- [ ] **Step 4: Create all route handlers**
- [ ] **Step 5: Test note CRUD + feed + search**

```bash
# Create note
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"RESTAURANT","title":"Test","rating":8,"binderId":"...","visibility":"PUBLIC","extension":{"dishName":"Pasta","wouldOrderAgain":true},"experiencedAt":"2026-04-06T00:00:00Z"}'

# Search
curl "http://localhost:3000/api/v1/search/all?q=Test" -H "Authorization: Bearer <token>"
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: port notes and search API routes (Postgres-only search)"
```

### Task 4.6: Port Social Routes (follows, signals, friends)

**Files:**
- Create: `web/src/app/api/v1/social/follows/route.ts`
- Create: `web/src/app/api/v1/social/signals/route.ts`
- Create: `web/src/app/api/v1/social/friends/route.ts`
- Create: `web/src/app/api/v1/social/friends/discover/route.ts`
- Create: `web/src/lib/api/services/social/follows.service.ts`
- Create: `web/src/lib/api/services/social/signals.service.ts`
- Create: `web/src/lib/api/services/social/friends.service.ts`
- Create: `web/src/lib/api/validators/social.ts`

- [ ] **Step 1: Read and port all 3 social services**

Read `backend/src/social/follows/`, `signals/`, `friends/`. Port each service.

- [ ] **Step 2: Create Zod validators for social DTOs**
- [ ] **Step 3: Create route handlers**
- [ ] **Step 4: Test follow, signal, and friend operations**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: port social API routes (follows, signals, friends)"
```

### Task 4.7: Port Taste Matching Routes

**Files:**
- Create: `web/src/lib/api/services/taste-matching/tss-computation.service.ts`
- Create: `web/src/lib/api/services/taste-matching/tss-cache.service.ts`
- Create: `web/src/lib/api/services/taste-matching/tss-batch.service.ts`
- Create: `web/src/lib/api/services/taste-matching/tiered-search.service.ts`
- Create: `web/src/app/api/v1/social/friends/discover/route.ts` (if not already)

- [ ] **Step 1: Port TSS computation + cache services**

Read `backend/src/taste-matching/`. Port all 4 services. The `tss-batch.service.ts` should be refactored for chunked processing (50 pairs per invocation).

- [ ] **Step 2: Port user discovery controller to discover route**
- [ ] **Step 3: Test TSS computation with existing data**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: port taste matching services"
```

### Task 4.8: Port Explore + Menu Decider Routes

**Files:**
- Create: `web/src/lib/api/services/area-explorer.service.ts`
- Create: `web/src/lib/api/services/menu-decider.service.ts`
- Create: `web/src/app/api/v1/explore/map/route.ts`
- Create: `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts`
- Create: `web/src/app/api/v1/menu-decider/[venueId]/route.ts`
- Create: `web/src/lib/api/services/geo.ts` (port geo utils)

- [ ] **Step 1: Port geo utilities**

Read `backend/src/common/utils/geo.ts`. Port to `web/src/lib/api/services/geo.ts`.

- [ ] **Step 2: Port area explorer service**

Read `backend/src/area-explorer/area-explorer.service.ts`. Port with Redis caching intact.

- [ ] **Step 3: Port menu decider service**

Read `backend/src/menu-decider/menu-decider.service.ts`.

- [ ] **Step 4: Create route handlers**
- [ ] **Step 5: Test map pins and venue notes**
- [ ] **Step 6: Commit**

```bash
git commit -m "feat: port explore and menu decider API routes"
```

### Task 4.9: Port Remaining Routes (notifications, subscriptions, pioneers, sync)

**Files:**
- Create: `web/src/lib/api/services/notifications.service.ts`
- Create: `web/src/lib/api/services/subscriptions.service.ts`
- Create: `web/src/lib/api/services/pioneers.service.ts`
- Create: `web/src/lib/api/services/sync.service.ts`
- Create: `web/src/app/api/v1/notifications/tokens/route.ts`
- Create: `web/src/app/api/v1/notifications/preferences/route.ts`
- Create: `web/src/app/api/v1/subscriptions/webhook/route.ts`
- Create: `web/src/app/api/v1/pioneers/route.ts`
- Create: `web/src/app/api/v1/sync/route.ts`

- [ ] **Step 1: Port each service from backend**

Read and port each service. The subscriptions webhook needs special attention — it must verify the RevenueCat webhook signature.

- [ ] **Step 2: Create all route handlers**
- [ ] **Step 3: Test webhook with RevenueCat test event**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: port notifications, subscriptions, pioneers, sync API routes"
```

### Task 4.10: Port Cron Jobs

**Files:**
- Create: `web/src/app/api/cron/tss-batch/route.ts`
- Create: `web/src/app/api/cron/photo-cleanup/route.ts`
- Modify: `web/vercel.json`

- [ ] **Step 1: Create TSS batch cron route (chunked)**

```typescript
// web/src/app/api/cron/tss-batch/route.ts
import { NextRequest } from 'next/server';
import { withCron } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { tssBatchService } from '@/lib/api/services/taste-matching/tss-batch.service';
import { redis } from '@/lib/api/clients/redis';

const CHUNK_SIZE = 50;

export const GET = withCron(async (_req: NextRequest) => {
  const cursor = await redis.get('tss:batch:cursor');
  const offset = cursor ? parseInt(cursor, 10) : 0;
  const pairs = await tssBatchService.getNextPairs(offset, CHUNK_SIZE);

  if (pairs.length === 0) {
    await redis.del('tss:batch:cursor');
    await tssBatchService.flushTssCache();
    return apiSuccess({ done: true, totalProcessed: offset });
  }

  await Promise.all(pairs.map((p) => tssBatchService.recomputePair(p)));
  await redis.set('tss:batch:cursor', String(offset + CHUNK_SIZE), 'EX', 14400);
  return apiSuccess({ processed: pairs.length, cursor: offset + CHUNK_SIZE });
});
```

- [ ] **Step 2: Create photo cleanup cron route**

```typescript
// web/src/app/api/cron/photo-cleanup/route.ts
import { NextRequest } from 'next/server';
import { withCron } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { photosService } from '@/lib/api/services/photos.service';

export const GET = withCron(async (_req: NextRequest) => {
  const cleaned = await photosService.cleanupOrphans();
  return apiSuccess({ deletedOrphans: cleaned });
});
```

- [ ] **Step 3: Add cron config to vercel.json**

```json
{
  "crons": [
    { "path": "/api/cron/tss-batch", "schedule": "*/5 2-4 * * *" },
    { "path": "/api/cron/photo-cleanup", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Step 4: Test cron routes locally**

```bash
curl http://localhost:3000/api/cron/tss-batch -H "Authorization: Bearer $CRON_SECRET"
curl http://localhost:3000/api/cron/photo-cleanup -H "Authorization: Bearer $CRON_SECRET"
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/cron/ web/vercel.json
git commit -m "feat: add Vercel Cron routes for TSS batch and photo cleanup"
```

---

## Phase 5: Cleanup & Cutover

### Task 5.1: Update Shared API Package

**Files:**
- Modify: `packages/shared-api/src/endpoints.ts` (if base URL pattern changed)
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Verify shared-api still works**

The `shared-api` package uses axios with a base URL. Since the API path structure (`/api/v1/*`) is identical, and the base URL is configured via env var, this should work without changes.

Run the web app and verify all pages load data correctly.

- [ ] **Step 2: Update NEXT_PUBLIC_API_URL if needed**

If the web app's API routes are now same-origin, update:
```
NEXT_PUBLIC_API_URL=/api/v1
```

This avoids cross-origin calls since frontend and API are on the same Vercel deployment.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: update API base URL to same-origin"
```

### Task 5.2: Delete Backend Directory

**Files:**
- Delete: `backend/` (entire directory)
- Delete: `railway.toml`
- Modify: `package.json` (remove backend workspace)

- [ ] **Step 1: Run full test suite first**

Verify all API routes work, web pages load, mobile app connects. This is the point of no return.

- [ ] **Step 2: Delete backend**

```bash
rm -rf backend/
rm -f railway.toml
```

- [ ] **Step 3: Update root package.json**

Remove `"backend"` from workspaces array. Remove any backend-specific scripts.

- [ ] **Step 4: Verify monorepo still builds**

```bash
npm install
cd web && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove NestJS backend and Railway config"
```

### Task 5.3: Update Environment Variables in Vercel

- [ ] **Step 1: Add new env vars in Vercel dashboard**

Add to Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_DB_URL_DIRECT`
- `CRON_SECRET` (generate with `openssl rand -hex 32`)
- `REDIS_URL` (Upstash)

- [ ] **Step 2: Remove old env vars**

Remove all `FIREBASE_*`, `R2_*`, `MEILISEARCH_*` vars from Vercel.

- [ ] **Step 3: Deploy and verify**

```bash
git push
```

Verify deployment succeeds and all features work on the preview URL.

- [ ] **Step 4: Shut down old services**

- Shut down Railway deployment
- Cancel Meilisearch Cloud subscription (if any)
- Delete R2 bucket (after confirming all photos migrated to Supabase Storage)
- Disable Firebase project (keep for 30 days as safety net, then delete)

---

## Phase 6: Scale Hardening (can be deferred)

### Task 6.1: Fix Known Performance Issues

**Files:**
- Modify: `web/src/lib/api/services/area-explorer.service.ts`
- Modify: `web/src/lib/api/services/pioneers.service.ts`
- Modify: `web/src/lib/api/services/taste-matching/tss-batch.service.ts`

- [ ] **Step 1: Fix area explorer — use DB aggregates instead of JS loops**

In `area-explorer.service.ts`, replace the in-app rating calculation loop with a Prisma `groupBy`:

```typescript
const noteStats = await prisma.note.groupBy({
  by: ['venueId'],
  where: { venueId: { in: venueIds }, visibility: 'PUBLIC', type: { in: typeFilter } },
  _count: { id: true },
  _avg: { rating: true },
});
```

- [ ] **Step 2: Fix pioneer badge — batch count instead of N queries**

In `pioneers.service.ts`, replace the per-note `count()` loop with a single query:

```typescript
const counts = await prisma.note.groupBy({
  by: ['venueId'],
  where: { venueId: { in: venueIds }, visibility: 'PUBLIC' },
  _count: { id: true },
});
const countMap = new Map(counts.map(c => [c.venueId, c._count.id]));
```

- [ ] **Step 3: Parallelize TSS batch**

In `tss-batch.service.ts`, the `recomputePair` calls are already wrapped in `Promise.all()` from Task 4.10. Verify this is working correctly.

- [ ] **Step 4: Test and commit**

```bash
git commit -m "perf: optimize area explorer, pioneer badges, and TSS batch"
```

### Task 6.2: Add Connection Pooling Tuning

- [ ] **Step 1: Verify Supabase PgBouncer is being used**

Check that `SUPABASE_DB_URL` uses port 6543 (pooled) for all API routes, and `SUPABASE_DB_URL_DIRECT` uses port 5432 only in `prisma migrate`.

- [ ] **Step 2: Set Prisma connection limit for serverless**

In `web/src/lib/api/clients/prisma.ts`, add connection limit:

```typescript
new PrismaClient({
  datasources: { db: { url: process.env.SUPABASE_DB_URL } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
```

Prisma with PgBouncer handles connection pooling automatically. No additional config needed.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: verify connection pooling configuration"
```
