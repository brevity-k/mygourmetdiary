# MyGourmetDiary — Full Supabase Migration Design

> **Date:** 2026-04-06
> **Status:** Draft — pending user approval
> **Goal:** Migrate from NestJS + Firebase + Meilisearch + R2 (7 vendors) to Next.js API Routes + Supabase (4 vendors). Priority: cost reduction > operational simplicity > scale readiness.

---

## 1. Current vs. Target Architecture

### Current (7 vendors)

```
Web (Vercel) ──→ NestJS API (Railway) ──→ PostgreSQL (managed)
Mobile (EAS) ──→                          Redis (Upstash)
                                          Meilisearch (Cloud)
                                          Firebase Auth
                                          Cloudflare R2
                                          RevenueCat
                                          Google Places API
```

### Target (4 vendors)

```
Web (Vercel) ──→ Next.js API Routes (Vercel, same deployment)
Mobile (EAS) ──→                    │
                                    ├──→ Supabase (DB + Auth + Storage)
                                    ├──→ Upstash Redis (free tier, TSS cache)
                                    ├──→ Google Places API (unchanged)
                                    └──→ RevenueCat (unchanged)
```

### Cost Comparison

| Scale | Current Stack | Target Stack | Savings |
|-------|--------------|--------------|---------|
| 1K users | ~$65/mo | ~$25/mo | 62% |
| 10K users | ~$290/mo | ~$120/mo | 59% |
| 100K users | ~$1,300/mo | ~$550/mo | 58% |

---

## 2. Service Migration Map

### 2.1 Authentication: Firebase → Supabase Auth

**Scope:** Backend auth guard, web sign-in, mobile sign-in, user creation.

**Backend (API routes):**
- Delete `FirebaseAuthGuard`. Replace with `withAuth()` higher-order function that calls `supabase.auth.getUser(token)`.
- Auth middleware in `web/src/middleware.ts` handles session refresh using `@supabase/ssr`.
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) used server-side only.

**Web:**
- Delete `firebase` client SDK. Replace with `@supabase/ssr`.
- Sign-in: `supabase.auth.signInWithOAuth({ provider: 'google' })`. Supabase handles OAuth flow.
- Session: Supabase stores session in cookies via SSR helpers. No more `getIdToken()` calls.

**Mobile:**
- Delete `firebase` client SDK. Replace with `@supabase/supabase-js`.
- Google sign-in: `expo-auth-session` handles OAuth redirect → pass token to `supabase.auth.signInWithIdToken()`.
- Apple sign-in: `expo-apple-authentication` → pass credential to `supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken })`.
- Token storage: Supabase SDK handles persistence via AsyncStorage adapter.

**User creation:**
- Delete `auth.service.ts` registration logic.
- Create Supabase DB trigger: `AFTER INSERT ON auth.users` → insert into `public.users` with display name from auth metadata + create 4 default binders.
- Trigger runs inside Supabase, no API call needed.

**Deleted:**
- `firebase-admin` (backend dependency)
- `firebase` (web + mobile dependency)
- `backend/src/auth/` module
- `backend/src/common/guards/firebase-auth.guard.ts`
- All `FIREBASE_*` and `NEXT_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_FIREBASE_*` env vars (16 vars)

**New:**
- `@supabase/ssr` (web)
- `@supabase/supabase-js` (mobile + shared)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 2.2 Database: Managed PostgreSQL → Supabase PostgreSQL

**Scope:** Connection string swap + new indexes + full-text search.

**Connection:**
- Prisma ORM stays. Change `DATABASE_URL` to Supabase pooled connection (port 6543, PgBouncer).
- Add `SUPABASE_DB_URL_DIRECT` (port 5432) for `prisma migrate deploy` only.
- `@prisma/adapter-pg` stays — works with Supabase's standard Postgres.

**New indexes (Prisma migration):**

```prisma
// schema.prisma additions

model User {
  // ... existing fields
  @@index([email])
}

model Venue {
  // ... existing fields
  @@index([lat, lng])
}

model Note {
  // ... existing fields
  @@index([venueId, visibility])
  @@index([authorId, visibility])
}
```

**Full-text search (replaces Meilisearch):**

```sql
-- Migration SQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_notes_title_trgm ON "Note" USING gin(title gin_trgm_ops);
CREATE INDEX idx_notes_freetext_trgm ON "Note" USING gin("freeText" gin_trgm_ops);
CREATE INDEX idx_venues_name_trgm ON "Venue" USING gin(name gin_trgm_ops);
```

- The existing Postgres fallback in `notes.search.service.ts` lines 230-260 and 334-365 becomes the primary search path.
- Add `pg_trgm` similarity scoring to improve relevance over basic `ILIKE`:

```typescript
// Enhanced search query (Prisma raw for similarity ranking)
const notes = await prisma.$queryRaw`
  SELECT n.*, similarity(n.title, ${query}) AS rank
  FROM "Note" n
  WHERE (n.title % ${query} OR n."freeText" % ${query})
    AND (n."authorId" = ${userId} OR n.visibility = 'PUBLIC')
  ORDER BY rank DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

**Deleted:**
- `meilisearch` dependency
- `notes.search.service.ts` Meilisearch integration (indexNote, removeNote, reindexAll, Meilisearch search paths)
- `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY` env vars
- Bulk reindex on startup

**Kept:**
- All 14 Prisma models (unchanged)
- Raw SQL for TSS batch computation (unchanged)
- Prisma schema and migration history

---

### 2.3 Storage: Cloudflare R2 → Supabase Storage

**Scope:** Photo upload presign, public URL serving, orphan cleanup.

**Upload flow:**
- Current: `@aws-sdk/client-s3` presigns R2 upload URL → client uploads directly.
- New: `supabase.storage.from('photos').createSignedUploadUrl(path)` → client uploads directly.
- Same pattern, simpler SDK.

**Bucket setup (Supabase dashboard or migration):**
- Bucket name: `photos`
- Public: yes (photos served without auth)
- Max file size: 10 MB
- Allowed MIME types: image/jpeg, image/png, image/webp, image/heic

**Public URL pattern:**
- Current: `{R2_PUBLIC_URL}/photos/{userId}/{uuid}.ext`
- New: `{SUPABASE_URL}/storage/v1/object/public/photos/{userId}/{uuid}.ext`

**Photo cleanup cron:**
- Same logic: find orphaned photos older than 1 hour, delete from storage + DB.
- Replace `s3.deleteObject()` with `supabase.storage.from('photos').remove([path])`.

**Deleted:**
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` dependencies
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` env vars

---

### 2.4 API Layer: NestJS on Railway → Next.js API Routes on Vercel

**Scope:** Rewrite 19 controllers (55 endpoints) as Next.js route handlers. Preserve all business logic.

#### 2.4.1 Route Structure

```
web/src/app/api/v1/
├── auth/register/route.ts                    POST
├── users/
│   ├── me/route.ts                           GET, PATCH
│   └── [id]/route.ts                         GET
├── binders/
│   ├── route.ts                              GET, POST
│   └── [id]/route.ts                         GET, PATCH, DELETE
├── notes/
│   ├── route.ts                              GET, POST
│   ├── feed/route.ts                         GET
│   └── [noteId]/
│       ├── route.ts                          GET, PATCH, DELETE
│       └── photos/route.ts                   POST
├── venues/
│   ├── search/route.ts                       GET
│   └── [placeId]/route.ts                    GET
├── photos/presign/route.ts                   POST
├── search/
│   ├── route.ts                              GET
│   └── all/route.ts                          GET
├── explore/
│   ├── map/route.ts                          GET
│   └── venue/[venueId]/notes/route.ts        GET
├── social/
│   ├── follows/route.ts                      GET, POST, DELETE
│   ├── signals/route.ts                      GET, POST
│   └── friends/
│       ├── route.ts                          GET, POST, DELETE
│       └── discover/route.ts                 GET
├── menu-decider/[venueId]/route.ts           GET
├── subscriptions/webhook/route.ts            POST
├── notifications/
│   ├── tokens/route.ts                       POST, DELETE
│   └── preferences/route.ts                  GET, PATCH
├── sync/route.ts                             POST
├── tags/route.ts                             GET
├── pioneers/route.ts                         GET
├── health/route.ts                           GET
└── cron/
    ├── tss-batch/route.ts                    GET (Vercel Cron)
    └── photo-cleanup/route.ts                GET (Vercel Cron)
```

#### 2.4.2 Service Layer

NestJS services move to `web/src/lib/api/services/` as plain TypeScript classes. Remove `@Injectable()` decorators, replace NestJS DI with direct imports.

```
web/src/lib/api/
├── middleware.ts           # withAuth(), withPremium(), withCron()
├── response.ts             # apiSuccess(), apiError() helpers
├── validators/             # Zod schemas (replace class-validator DTOs)
│   ├── notes.ts
│   ├── binders.ts
│   ├── users.ts
│   └── ...
├── services/               # Business logic (from backend/src/*)
│   ├── notes.service.ts
│   ├── notes.search.service.ts   # Postgres-only (no Meilisearch)
│   ├── binders.service.ts
│   ├── users.service.ts
│   ├── venues.service.ts
│   ├── photos.service.ts
│   ├── social/
│   │   ├── follows.service.ts
│   │   ├── signals.service.ts
│   │   └── friends.service.ts
│   ├── taste-matching/
│   │   ├── tss-computation.service.ts
│   │   ├── tss-cache.service.ts
│   │   ├── tss-batch.service.ts
│   │   └── tiered-search.service.ts
│   ├── area-explorer.service.ts
│   ├── menu-decider.service.ts
│   ├── pioneers.service.ts
│   ├── notifications.service.ts
│   ├── subscriptions.service.ts
│   └── sync.service.ts
└── clients/
    ├── supabase.ts         # Server-side Supabase client (service role)
    ├── prisma.ts           # Prisma client singleton
    ├── redis.ts            # Upstash Redis client
    └── google-places.ts    # Google Places API client
```

#### 2.4.3 Middleware Pattern

```typescript
// web/src/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from './clients/supabase';
import { prisma } from './clients/prisma';

type AuthHandler = (req: NextRequest, user: User) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const supabase = createSupabaseServerClient();
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      return handler(req, user);
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

export function withPremium(handler: AuthHandler) {
  return withAuth(async (req, user) => {
    if (user.subscriptionTier !== 'CONNOISSEUR') {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 });
    }
    return handler(req, user);
  });
}

export function withCron(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const secret = req.headers.get('authorization')?.replace('Bearer ', '');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
}
```

#### 2.4.4 Validation: class-validator → Zod

All NestJS DTOs (class-validator + class-transformer) are replaced with Zod schemas. Zod is already used in the mobile app.

```typescript
// web/src/lib/api/validators/notes.ts
import { z } from 'zod';

export const createNoteSchema = z.object({
  type: z.enum(['RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT']),
  title: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(10),
  binderId: z.string().uuid(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  freeText: z.string().max(5000).nullable().optional(),
  venueId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  extension: z.record(z.unknown()),
  experiencedAt: z.string().datetime(),
});
```

Usage in route handler:

```typescript
export const POST = withAuth(async (req, user) => {
  const body = createNoteSchema.parse(await req.json());
  const note = await notesService.create(user.id, body);
  return NextResponse.json({ data: note, statusCode: 201 }, { status: 201 });
});
```

---

### 2.5 Cron Jobs: NestJS Schedule → Vercel Cron

**Configuration:**

```jsonc
// vercel.json
{
  "crons": [
    { "path": "/api/cron/tss-batch", "schedule": "*/5 2-4 * * *" },
    { "path": "/api/cron/photo-cleanup", "schedule": "0 * * * *" }
  ]
}
```

**TSS batch chunking (solves 300s Vercel timeout):**

Current: Single job at 2 AM processes ALL user pairs serially.
New: Runs every 5 minutes from 2-4 AM, processes 50 pairs per invocation.

```typescript
// web/src/app/api/cron/tss-batch/route.ts
export const GET = withCron(async () => {
  const CHUNK_SIZE = 50;
  const cursor = await redis.get('tss:batch:cursor') || '0';
  const pairs = await tssBatchService.getNextPairs(parseInt(cursor), CHUNK_SIZE);

  if (pairs.length === 0) {
    // All pairs processed — reset cursor, flush cache
    await redis.del('tss:batch:cursor');
    await tssBatchService.flushTssCache();
    return NextResponse.json({ done: true });
  }

  await Promise.all(pairs.map(p => tssBatchService.recomputePair(p)));
  await redis.set('tss:batch:cursor', String(parseInt(cursor) + CHUNK_SIZE));
  return NextResponse.json({ processed: pairs.length });
});
```

**Photo cleanup:** Same logic, just wrapped in `withCron()` instead of `@Cron()`.

---

### 2.6 Rate Limiting: NestJS Throttler → Upstash Ratelimit

**Current:** Global 60 req/min via `@nestjs/throttler`. One limit for all users combined.

**New:** Per-user 120 req/min via `@upstash/ratelimit` sliding window.

```typescript
// web/src/lib/api/middleware.ts (addition)
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(120, '1 m'),
});

// Applied inside withAuth():
const { success } = await ratelimit.limit(user.id);
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
```

Uses Upstash Redis free tier. No extra cost.

---

### 2.7 Mobile Changes

**Auth SDK swap:**
- Remove: `firebase` (12.9.0)
- Add: `@supabase/supabase-js`
- Auth store (`mobile/src/store/auth.store.ts`): Replace Firebase token listener with Supabase `onAuthStateChange()`.
- Google sign-in: Same `expo-auth-session` flow, but exchange token with Supabase instead of Firebase.
- Apple sign-in: Same `expo-apple-authentication` flow, but exchange credential with Supabase.

**API client:**
- `mobile/src/api/client.ts`: Replace `getIdToken()` (Firebase) with `supabase.auth.getSession()` to get access token.
- Base URL (`EXPO_PUBLIC_API_URL`) stays the same path structure.

**Everything else unchanged:**
- Zustand stores (swap token source only)
- React Query patterns
- Shared packages (`shared-types`, `shared-constants`)
- All native modules (maps, camera, notifications, SQLite, location)
- RevenueCat (`react-native-purchases`)
- Offline sync logic

**Deleted env vars:** `EXPO_PUBLIC_FIREBASE_*` (7 vars)
**New env vars:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

### 2.8 Prisma Schema Changes

**User model update** (Firebase UID → Supabase UUID):

```prisma
model User {
  id                  String   @id @default(uuid())
  supabaseId          String   @unique              // was: firebaseUid
  email               String   @unique
  displayName         String?
  avatarUrl           String?
  subscriptionTier    SubscriptionTier @default(FREE)
  subscriptionExpiresAt DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // ... relations unchanged

  @@index([email])
  @@index([supabaseId])
}
```

**Migration:** Rename `firebaseUid` column to `supabaseId`. Since there are no real users, this is a clean migration with no data concerns.

---

## 3. Environment Variables: Before and After

### Eliminated (21 vars)

| Variable | Service |
|----------|---------|
| `FIREBASE_PROJECT_ID` | Backend |
| `FIREBASE_CLIENT_EMAIL` | Backend |
| `FIREBASE_PRIVATE_KEY` | Backend |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Web |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Mobile |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Mobile |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Mobile |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Mobile |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Mobile |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Mobile |
| `R2_ACCOUNT_ID` | Backend |
| `R2_ACCESS_KEY_ID` | Backend |
| `R2_SECRET_ACCESS_KEY` | Backend |
| `R2_BUCKET_NAME` | Backend |
| `R2_PUBLIC_URL` | Backend |
| `MEILISEARCH_HOST` | Backend |
| `MEILISEARCH_API_KEY` | Backend |
| `DATABASE_URL` | Backend (replaced) |

### New (6 vars)

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web + Mobile |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web + Mobile |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes (server-side) |
| `SUPABASE_DB_URL` | API routes (pooled, port 6543) |
| `SUPABASE_DB_URL_DIRECT` | Prisma migrations only (port 5432) |
| `CRON_SECRET` | Vercel Cron auth |

### Kept (6 vars)

| Variable | Service |
|----------|---------|
| `GOOGLE_PLACES_API_KEY` | API routes |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Web |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Web |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Mobile |
| `REDIS_URL` | Upstash (API routes) |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | API routes |

**Net: ~27 env vars → ~12.**

---

## 4. Deleted Code and Dependencies

### Backend (entire directory deleted)

The `backend/` directory is removed after migration. All business logic moves to `web/src/lib/api/services/`.

### Dependencies Removed

**Backend (all gone with the directory):**
- `@nestjs/*` (8 packages)
- `firebase-admin`
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `meilisearch`
- `class-validator`, `class-transformer`
- `helmet`, `nodemailer`
- `@nestjs/swagger`

**Web:**
- `firebase` → replaced by `@supabase/ssr`

**Mobile:**
- `firebase` → replaced by `@supabase/supabase-js`

### Dependencies Added

**Web:**
- `@supabase/ssr` (SSR auth helpers)
- `@supabase/supabase-js` (client)
- `@upstash/ratelimit` (rate limiting)
- `@upstash/redis` (Redis client for rate limiting)
- `zod` (validation, already in mobile)

**Mobile:**
- `@supabase/supabase-js`

---

## 5. Migration Phases

### Phase 0: Preparation (1 day)
- Create Supabase project
- Enable `pg_trgm` extension
- Configure Google + Apple OAuth providers in Supabase dashboard
- Create `photos` storage bucket
- Set up Upstash Redis (free tier) if not already

### Phase 1: Database + Search (2-3 days)
- Point Prisma at Supabase PostgreSQL
- Run migration: rename `firebaseUid` → `supabaseId`, add missing indexes
- Add `pg_trgm` indexes via SQL migration
- Verify existing Postgres search fallback works as primary
- Drop Meilisearch integration code

### Phase 2: Auth (3-4 days)
- Web: Replace Firebase SDK with `@supabase/ssr`, implement middleware
- Mobile: Replace Firebase SDK with `@supabase/supabase-js`
- Create Supabase DB trigger for user profile + default binder creation
- Test Google + Apple sign-in on both platforms

### Phase 3: Storage (1-2 days)
- Replace R2 presign logic with Supabase Storage SDK
- Update public URL pattern in photo service
- Migrate photo cleanup to use Supabase Storage API
- Test upload + serve flow

### Phase 4: API Routes (2-3 weeks)
- Create `web/src/lib/api/` infrastructure (middleware, response helpers, clients)
- Port NestJS services to `web/src/lib/api/services/` (remove decorators, keep logic)
- Convert DTOs from class-validator to Zod schemas
- Create route handlers for all 55 endpoints
- Port cron jobs to Vercel Cron routes
- Add rate limiting via Upstash
- Test every endpoint against mobile + web

### Phase 5: Cleanup + Cutover (2-3 days)
- Delete `backend/` directory
- Delete `railway.toml`, `backend/Procfile`
- Remove unused dependencies from root `package.json`
- Update `shared-api` package if base URL changed
- Update all env vars in Vercel dashboard
- Update mobile env vars
- Shut down Railway deployment
- Cancel Meilisearch Cloud subscription
- Cancel R2 bucket (after verifying all photos migrated)

### Phase 6: Scale Hardening (1 week, can be deferred)
- Parallelize TSS batch computation
- Fix pioneer badge N+1 query
- Refactor area explorer to use DB aggregates instead of JS loops
- Add connection pooling tuning for Supabase
- Load test at 1K/10K simulated users

**Total estimated effort: 4-6 weeks for one developer.**

---

## 6. Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Supabase Auth behavior differs from Firebase | Medium | Test all sign-in flows (Google, Apple, email) on both platforms before cutting over. No real users to migrate. |
| Supabase Storage CDN slower than R2 | Low | Acceptable for current scale. Can add Cloudflare CDN in front later if needed. |
| Vercel 300s function timeout for TSS batch | Medium | Chunk processing: 50 pairs per invocation, runs every 5 min from 2-4 AM. Already designed above. |
| Prisma cold starts on Vercel serverless | Medium | Use Vercel Fluid Compute (reuses function instances). Add `prisma generate` to build step. Connection pooling via Supabase PgBouncer. |
| Search quality degrades without Meilisearch | Low | `pg_trgm` with GIN indexes provides fuzzy matching. Existing Postgres fallback already works. Can add `tsvector` for weighted full-text if needed. |
| Rate limiting bypass during migration | Low | Deploy Upstash ratelimit early in Phase 4. Vercel WAF provides baseline protection. |

---

## 7. Rollback Plan

Each phase is independently reversible:

- **Phase 1 (DB):** Prisma can point back to original PostgreSQL host by changing `DATABASE_URL`.
- **Phase 2 (Auth):** Firebase project still exists. Revert SDK swap in web/mobile.
- **Phase 3 (Storage):** R2 bucket still exists until Phase 5 cleanup. Revert presign logic.
- **Phase 4 (API):** Railway deployment still running until Phase 5. Point `API_URL` back to Railway.
- **Phase 5 (Cleanup):** Point of no return. Only execute after full verification.

---

## 8. Success Criteria

- [ ] All 55 API endpoints return identical responses (automated test suite)
- [ ] Google + Apple sign-in works on web and mobile
- [ ] Photo upload + display works end-to-end
- [ ] Search returns relevant results with `pg_trgm`
- [ ] Cron jobs execute on schedule (TSS batch, photo cleanup)
- [ ] Rate limiting enforced per-user
- [ ] No Firebase, Meilisearch, R2, or Railway dependencies remain
- [ ] Monthly cost at idle < $30
- [ ] All existing e2e tests pass
