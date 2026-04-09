# Community Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build venue + product community pages on mobile and web with FRIENDS note visibility, tiered gourmet discovery, product search, and parameterized community endpoints.

**Architecture:** Three new community API endpoints parameterized by subject type (`venue` or `product`), each backed by a focused service with its own Redis cache TTL. New `Product` model for wine/spirit/sake/beer entities. `ProductSearchInput` for note creation. Shared `CommunityView` component for both mobile and web. `FRIENDS` visibility for note sharing with pinned friends.

**Tech Stack:** Prisma 7, TypeScript 5.9, Next.js 16 App Router, React Native + Expo 54, React Query 5, Vitest 4, Redis (Upstash), Zod 4.

**Spec:** `docs/superpowers/specs/2026-04-09-community-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `web/prisma/migrations/<ts>_add_product_and_friends/migration.sql` | Schema migration |
| `packages/shared-types/src/community.ts` | CommunityStats, CommunityGourmet, Product, ProductCategory types |
| `web/src/lib/api/services/visibility-filter.ts` | Reusable visibility filter helper |
| `web/src/lib/api/services/visibility-filter.test.ts` | Tests |
| `web/src/lib/api/services/community-stats.service.ts` | Aggregate stats parameterized by subject |
| `web/src/lib/api/services/community-stats.service.test.ts` | Tests |
| `web/src/lib/api/services/community-gourmets.service.ts` | Tiered gourmet ranking parameterized by subject |
| `web/src/lib/api/services/community-gourmets.service.test.ts` | Tests |
| `web/src/lib/api/services/community-notes.service.ts` | Paginated notes with tier tags parameterized by subject |
| `web/src/lib/api/services/community-notes.service.test.ts` | Tests |
| `web/src/lib/api/services/products.service.ts` | Product CRUD + search |
| `web/src/lib/api/services/products.service.test.ts` | Tests |
| `web/src/lib/api/services/community-cache.ts` | Cache invalidation helper |
| `web/src/app/api/v1/community/[subjectType]/[subjectId]/stats/route.ts` | Stats endpoint |
| `web/src/app/api/v1/community/[subjectType]/[subjectId]/gourmets/route.ts` | Gourmets endpoint |
| `web/src/app/api/v1/community/[subjectType]/[subjectId]/notes/route.ts` | Notes endpoint |
| `web/src/app/api/v1/products/route.ts` | Create product |
| `web/src/app/api/v1/products/search/route.ts` | Search products |
| `web/src/app/api/v1/products/[productId]/route.ts` | Get product |
| `web/src/app/(app)/venues/[placeId]/page.tsx` | Web venue community |
| `web/src/app/(app)/products/[productId]/page.tsx` | Web product community |
| `web/src/components/community/community-view.tsx` | Shared layout shell |
| `web/src/components/community/venue-hero.tsx` | Venue header |
| `web/src/components/community/product-hero.tsx` | Product header |
| `web/src/components/community/rating-distribution.tsx` | Bar chart |
| `web/src/components/community/top-gourmets-list.tsx` | Gourmet row/sidebar |
| `web/src/components/community/gourmet-card.tsx` | Individual gourmet card |
| `web/src/components/community/note-tier-badge.tsx` | Tier badge |
| `web/src/components/community/write-note-fab.tsx` | FAB |
| `web/src/components/forms/visibility-selector.tsx` | Three-way picker |
| `web/src/components/forms/product-search-input.tsx` | Product type-ahead + create |
| `mobile/src/screens/community/VenueCommunityScreen.tsx` | Mobile venue community |
| `mobile/src/screens/community/ProductCommunityScreen.tsx` | Mobile product community |
| `mobile/src/components/community/CommunityView.tsx` | Shared layout |
| `mobile/src/components/community/VenueHero.tsx` | Venue header |
| `mobile/src/components/community/ProductHero.tsx` | Product header |
| `mobile/src/components/community/RatingDistribution.tsx` | Bar chart |
| `mobile/src/components/community/TopGourmetsRow.tsx` | Horizontal gourmet list |
| `mobile/src/components/community/GourmetCard.tsx` | Gourmet card |
| `mobile/src/components/community/NoteTierBadge.tsx` | Tier badge |
| `mobile/src/components/forms/ProductSearchInput.tsx` | Product type-ahead + create |
| `mobile/src/components/forms/VisibilitySelector.tsx` | Three-way picker |

### Modified files

| File | Change |
|------|--------|
| `web/prisma/schema.prisma` | Add FRIENDS, ProductCategory, Product model, Note.productId |
| `packages/shared-types/src/index.ts` | Add FRIENDS to Visibility, re-export community types |
| `packages/shared-api/src/endpoints.ts` | Add createCommunityApi, createProductsApi |
| `web/src/lib/api.ts` | Export communityApi, productsApi |
| `web/src/lib/api/services/notes.service.ts` | Add invalidateCommunityCache on create/update/remove, handle productId |
| `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts` | Delegate to community-notes service |
| `web/src/components/map/venue-preview-panel.tsx` | "View Notes" -> `/venues/<placeId>` |
| `web/src/app/(app)/notes/[noteId]/page.tsx` | Venue + product names become links |
| Web note creation forms | Add VisibilitySelector + ProductSearchInput |
| `mobile/src/api/endpoints.ts` | Add communityApi, productsApi |
| `mobile/src/types/index.ts` | Re-export new types |
| `mobile/src/navigation/types.ts` | Add VenueCommunity, ProductCommunity routes |
| `mobile/src/navigation/SearchStackNavigator.tsx` | Register both community screens |
| `mobile/src/screens/map/AreaExplorerScreen.tsx` | Navigate to VenueCommunity |
| `mobile/src/screens/home/NoteDetailScreen.tsx` | Tappable venue + product names |
| Mobile note form screens (4) | VisibilitySelector + ProductSearchInput (wine/spirit) |

### Deleted files

| File | Reason |
|------|--------|
| `mobile/src/screens/map/VenueNotesScreen.tsx` | Replaced by VenueCommunityScreen |
| `docs/superpowers/specs/2026-04-09-venue-community-design.md` | Superseded by community-design.md |
| `docs/superpowers/plans/2026-04-09-venue-community.md` | Superseded by this plan |

---

## Task 1: Schema Migration

**Files:**
- Modify: `web/prisma/schema.prisma`
- Create: migration file

- [ ] **Step 1: Update Prisma schema**

Add to `web/prisma/schema.prisma`:

1. Add `FRIENDS` to Visibility enum (line 18-21):
```prisma
enum Visibility {
  PUBLIC
  PRIVATE
  FRIENDS
}
```

2. Add ProductCategory enum after Visibility:
```prisma
enum ProductCategory {
  WINE
  SPIRIT
  SAKE
  BEER
}
```

3. Add Product model:
```prisma
model Product {
  id        String          @id @default(cuid())
  name      String
  category  ProductCategory
  subType   String?         @map("sub_type")
  producer  String?
  vintage   Int?
  region    String?
  abv       Float?
  imageUrl  String?         @map("image_url")
  createdBy String?         @map("created_by")
  createdAt DateTime        @default(now()) @map("created_at")
  updatedAt DateTime        @updatedAt @map("updated_at")

  notes     Note[]

  @@index([category])
  @@index([name])
  @@map("products")
}
```

4. Add `productId` to Note model (after venueId):
```prisma
  productId     String?    @map("product_id")
  product      Product?   @relation(fields: [productId], references: [id])
  @@index([productId])
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd web && npx prisma migrate dev --name add_product_and_friends
```

- [ ] **Step 3: Verify**

```bash
cd web && npx prisma generate && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/prisma/
git commit -m "feat: add Product model, ProductCategory enum, FRIENDS visibility, Note.productId"
```

---

## Task 2: Shared Types

**Files:**
- Create: `packages/shared-types/src/community.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `mobile/src/types/index.ts`

- [ ] **Step 1: Create community types**

Create `packages/shared-types/src/community.ts`:

```ts
import type { PublicUser, TasteSimilarity, SocialNote, Venue } from './index';

export type CommunitySubjectType = 'venue' | 'product';

export enum ProductCategory {
  WINE = 'WINE',
  SPIRIT = 'SPIRIT',
  SAKE = 'SAKE',
  BEER = 'BEER',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  subType: string | null;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  abv: number | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CommunityStats {
  subjectType: CommunitySubjectType;
  subjectId: string;
  totalNotes: number;
  totalGourmets: number;
  avgRating: number | null;
  ratingDistribution: Record<string, number>;
}

export interface CommunityGourmet {
  user: PublicUser;
  tier: 1 | 2 | 3;
  noteCount: number;
  tasteSimilarity: TasteSimilarity[] | null;
  isPinned: boolean;
}
```

- [ ] **Step 2: Update shared-types index**

In `packages/shared-types/src/index.ts`:

Add FRIENDS to Visibility enum:
```ts
export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS = 'FRIENDS',
}
```

Add re-export at bottom:
```ts
export { ProductCategory } from './community';
export type { CommunitySubjectType, Product, CommunityStats, CommunityGourmet } from './community';
```

- [ ] **Step 3: Update mobile types**

In `mobile/src/types/index.ts`, add:
```ts
export { ProductCategory } from '@mygourmetdiary/shared-types';
export type { CommunitySubjectType, Product, CommunityStats, CommunityGourmet } from '@mygourmetdiary/shared-types';
```

- [ ] **Step 4: Typecheck**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/ mobile/src/types/
git commit -m "feat: add community shared types (Product, CommunityStats, CommunityGourmet, FRIENDS)"
```

---

## Task 3: Visibility Filter + Tests

**Files:**
- Create: `web/src/lib/api/services/visibility-filter.ts`
- Create: `web/src/lib/api/services/visibility-filter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/visibility-filter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildVisibilityFilter } from './visibility-filter';

describe('buildVisibilityFilter', () => {
  const viewerId = 'viewer-123';

  it('includes PUBLIC notes', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toContainEqual({ visibility: 'PUBLIC' });
  });

  it('includes own notes', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toContainEqual({ authorId: viewerId });
  });

  it('includes FRIENDS notes where author pinned the viewer', () => {
    const f = buildVisibilityFilter(viewerId);
    const friendsClause = f.OR.find((c: Record<string, unknown>) => c.visibility === 'FRIENDS');
    expect(friendsClause).toEqual({
      visibility: 'FRIENDS',
      author: { pinnedFriends: { some: { pinnedId: viewerId } } },
    });
  });

  it('returns exactly three OR clauses', () => {
    const f = buildVisibilityFilter(viewerId);
    expect(f.OR).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd web && npx vitest run src/lib/api/services/visibility-filter.test.ts
```

- [ ] **Step 3: Implement**

Create `web/src/lib/api/services/visibility-filter.ts`:

```ts
export function buildVisibilityFilter(viewerId: string) {
  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { authorId: viewerId },
      {
        visibility: 'FRIENDS' as const,
        author: { pinnedFriends: { some: { pinnedId: viewerId } } },
      },
    ],
  };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd web && npx vitest run src/lib/api/services/visibility-filter.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api/services/visibility-filter.ts web/src/lib/api/services/visibility-filter.test.ts
git commit -m "feat: add buildVisibilityFilter helper with tests"
```

---

## Task 4: Community Stats Service + Tests + Endpoint

**Files:**
- Create: `web/src/lib/api/services/community-stats.service.ts`
- Create: `web/src/lib/api/services/community-stats.service.test.ts`
- Create: `web/src/app/api/v1/community/[subjectType]/[subjectId]/stats/route.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/community-stats.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRatingDistribution, computeStats } from './community-stats.service';

describe('buildRatingDistribution', () => {
  it('builds histogram from grouped rating counts', () => {
    const grouped = [
      { rating: 7, _count: { id: 3 } },
      { rating: 9, _count: { id: 1 } },
    ];
    const dist = buildRatingDistribution(grouped);
    expect(dist['7']).toBe(3);
    expect(dist['9']).toBe(1);
    expect(dist['1']).toBe(0);
  });

  it('returns all zeros for empty input', () => {
    const dist = buildRatingDistribution([]);
    for (let i = 1; i <= 10; i++) expect(dist[String(i)]).toBe(0);
  });
});

describe('computeStats', () => {
  it('rounds avgRating to one decimal', () => {
    const result = computeStats('venue', 'v1', 15, 4, 7.666);
    expect(result.avgRating).toBe(7.7);
  });

  it('returns null avgRating when no notes', () => {
    const result = computeStats('venue', 'v1', 0, 0, null);
    expect(result.avgRating).toBeNull();
    expect(result.totalNotes).toBe(0);
  });

  it('preserves subjectType and subjectId', () => {
    const result = computeStats('product', 'p1', 5, 2, 8.0);
    expect(result.subjectType).toBe('product');
    expect(result.subjectId).toBe('p1');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement service**

Create `web/src/lib/api/services/community-stats.service.ts`:

```ts
import type { CommunitySubjectType } from '@mygourmetdiary/shared-types';
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';

const CACHE_TTL = 300;

interface RatingGroup { rating: number; _count: { id: number } }

export function buildRatingDistribution(grouped: RatingGroup[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (let i = 1; i <= 10; i++) dist[String(i)] = 0;
  for (const g of grouped) dist[String(g.rating)] = g._count.id;
  return dist;
}

export function computeStats(
  subjectType: CommunitySubjectType,
  subjectId: string,
  totalNotes: number,
  totalGourmets: number,
  avgRating: number | null,
) {
  return {
    subjectType,
    subjectId,
    totalNotes,
    totalGourmets,
    avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
  };
}

export const communityStatsService = {
  async getStats(subjectType: CommunitySubjectType, subjectId: string, noteField: string) {
    const cacheKey = `community-stats:${subjectType}:${subjectId}`;
    const cached = await getJson<ReturnType<typeof computeStats> & { ratingDistribution: Record<string, number> }>(cacheKey);
    if (cached) return cached;

    const publicWhere = { [noteField]: subjectId, visibility: 'PUBLIC' as const };

    const [count, gourmets, avg, ratings] = await Promise.all([
      prisma.note.count({ where: publicWhere }),
      prisma.note.groupBy({ by: ['authorId'], where: publicWhere, _count: { id: true } }),
      prisma.note.aggregate({ where: publicWhere, _avg: { rating: true } }),
      prisma.note.groupBy({ by: ['rating'], where: publicWhere, _count: { id: true } }),
    ]);

    const stats = {
      ...computeStats(subjectType, subjectId, count, gourmets.length, avg._avg.rating),
      ratingDistribution: buildRatingDistribution(ratings),
    };

    await setJson(cacheKey, stats, CACHE_TTL);
    return stats;
  },
};
```

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Create route handler**

Create `web/src/app/api/v1/community/[subjectType]/[subjectId]/stats/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { communityStatsService } from '@/lib/api/services/community-stats.service';
import { prisma } from '@/lib/api/clients/prisma';

const SUBJECT_CONFIG = {
  venue: { model: 'venue' as const, noteField: 'venueId' },
  product: { model: 'product' as const, noteField: 'productId' },
} as const;

export const GET = withAuth(async (req: NextRequest) => {
  const parts = req.nextUrl.pathname.split('/');
  const subjectType = parts[parts.length - 3] as string;
  const subjectId = parts[parts.length - 2];

  const config = SUBJECT_CONFIG[subjectType as keyof typeof SUBJECT_CONFIG];
  if (!config) return apiError('Invalid subject type. Use "venue" or "product".', 400);

  const exists = await (prisma[config.model] as any).findUnique({ where: { id: subjectId } });
  if (!exists) return apiError(`${subjectType} not found`, 404);

  const stats = await communityStatsService.getStats(subjectType as any, subjectId, config.noteField);
  return apiSuccess(stats);
});
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/services/community-stats.service.ts web/src/lib/api/services/community-stats.service.test.ts web/src/app/api/v1/community/
git commit -m "feat: add community stats service (parameterized), tests, and endpoint"
```

---

## Task 5: Community Gourmets Service + Tests + Endpoint

**Files:**
- Create: `web/src/lib/api/services/community-gourmets.service.ts`
- Create: `web/src/lib/api/services/community-gourmets.service.test.ts`
- Create: `web/src/app/api/v1/community/[subjectType]/[subjectId]/gourmets/route.ts`

Follow the same TDD pattern as the venue-only plan Task 5. The `assignTiers` function is identical. The service method accepts `noteField` to parameterize the Prisma query. Route handler uses the same `SUBJECT_CONFIG` pattern as stats.

- [ ] **Step 1: Write failing tests** (same `assignTiers` tests as previous plan Task 5)
- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement** (parameterize `where` clause with `{ [noteField]: subjectId }`)
- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Create route handler** (same SUBJECT_CONFIG pattern)
- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add community gourmets service with tiered ranking, tests, and endpoint"
```

---

## Task 6: Community Notes Service + Tests + Endpoint

**Files:**
- Create: `web/src/lib/api/services/community-notes.service.ts`
- Create: `web/src/lib/api/services/community-notes.service.test.ts`
- Create: `web/src/app/api/v1/community/[subjectType]/[subjectId]/notes/route.ts`
- Modify: `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts`

Follow the same TDD pattern as previous plan Task 6. The `assignNoteTier` function is identical. The service method accepts `noteField`. Old explore endpoint delegates to new service.

- [ ] **Step 1: Write failing tests** (same `assignNoteTier` tests)
- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement** (parameterize with `noteField`, use `buildVisibilityFilter`)
- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Create route handler**
- [ ] **Step 6: Update old explore endpoint to delegate**
- [ ] **Step 7: Commit**

```bash
git commit -m "feat: add community notes service with visibility filter, tier tags, and endpoint"
```

---

## Task 7: Products Service + Tests + Endpoints

**Files:**
- Create: `web/src/lib/api/services/products.service.ts`
- Create: `web/src/lib/api/services/products.service.test.ts`
- Create: `web/src/app/api/v1/products/route.ts`
- Create: `web/src/app/api/v1/products/search/route.ts`
- Create: `web/src/app/api/v1/products/[productId]/route.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/products.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeProductName } from './products.service';

describe('normalizeProductName', () => {
  it('trims whitespace', () => {
    expect(normalizeProductName('  Opus One  ')).toBe('Opus One');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeProductName('Opus   One')).toBe('Opus One');
  });

  it('preserves casing', () => {
    expect(normalizeProductName('opus one')).toBe('opus one');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement service**

Create `web/src/lib/api/services/products.service.ts`:

```ts
import { ProductCategory } from '@prisma/client';
import { prisma } from '../clients/prisma';

export function normalizeProductName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export const productsService = {
  async search(query: string, category?: ProductCategory, limit = 10) {
    const normalized = normalizeProductName(query);
    if (!normalized) return [];

    return prisma.product.findMany({
      where: {
        name: { contains: normalized, mode: 'insensitive' },
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
      take: limit,
    });
  },

  async create(data: {
    name: string;
    category: ProductCategory;
    subType?: string;
    producer?: string;
    vintage?: number;
    region?: string;
    abv?: number;
    createdBy: string;
  }) {
    const name = normalizeProductName(data.name);
    if (!name) throw new Error('Product name is required');

    return prisma.product.create({
      data: { ...data, name },
    });
  },

  async getById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },
};
```

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Create route handlers**

`web/src/app/api/v1/products/search/route.ts`:
```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { productsService } from '@/lib/api/services/products.service';

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const { query, category } = body;
  if (!query || typeof query !== 'string') return apiError('query is required', 400);

  const results = await productsService.search(query, category);
  return apiSuccess(results);
});
```

`web/src/app/api/v1/products/route.ts`:
```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { productsService } from '@/lib/api/services/products.service';

export const POST = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const { name, category, subType, producer, vintage, region, abv } = body;
  if (!name || !category) return apiError('name and category are required', 400);

  const product = await productsService.create({
    name, category, subType, producer, vintage, region, abv,
    createdBy: user.id,
  });
  return apiSuccess(product);
});
```

`web/src/app/api/v1/products/[productId]/route.ts`:
```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { productsService } from '@/lib/api/services/products.service';

export const GET = withAuth(async (req: NextRequest) => {
  const productId = req.nextUrl.pathname.split('/').at(-1)!;
  const product = await productsService.getById(productId);
  if (!product) return apiError('Product not found', 404);
  return apiSuccess(product);
});
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/services/products.service.ts web/src/lib/api/services/products.service.test.ts web/src/app/api/v1/products/
git commit -m "feat: add products service (search, create, get) with tests and endpoints"
```

---

## Task 8: Cache Invalidation + Note Service Wiring

**Files:**
- Create: `web/src/lib/api/services/community-cache.ts`
- Modify: `web/src/lib/api/services/notes.service.ts`

- [ ] **Step 1: Create cache invalidation helper**

Create `web/src/lib/api/services/community-cache.ts`:

```ts
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
        const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:${subjectType}:${subjectId}:*`, 'COUNT', 100);
        cursor = next;
        if (keys.length > 0) await redis.del(...keys);
      } while (cursor !== '0');
    }
  } catch {
    // Non-fatal — stale data expires via TTL
  }
}
```

- [ ] **Step 2: Wire into notes.service.ts**

In `web/src/lib/api/services/notes.service.ts`, add import and calls:

```ts
import { invalidateCommunityCache } from './community-cache';
```

In `create` (after note created):
```ts
if (resolvedVenueId) invalidateCommunityCache('venue', resolvedVenueId);
if (note.productId) invalidateCommunityCache('product', note.productId);
```

In `update` (after note updated):
```ts
if (note.venueId) invalidateCommunityCache('venue', note.venueId);
if (note.productId) invalidateCommunityCache('product', note.productId);
```

In `remove` (after note deleted):
```ts
if (note.venueId) invalidateCommunityCache('venue', note.venueId);
if (note.productId) invalidateCommunityCache('product', note.productId);
```

Also update `create` to handle `productId` from input (parallel to venue resolution):
```ts
let resolvedProductId: string | null = null;
if (input.productId) {
  const product = await productsService.getById(input.productId);
  if (!product) throw new Error('Product not found');
  resolvedProductId = product.id;
}
```

And pass `productId: resolvedProductId` to `prisma.note.create`.

- [ ] **Step 3: Verify `getRedis` is exported**

```bash
cd web && grep -n "export.*getRedis" src/lib/api/clients/redis.ts
```

If not exported, add `export` to the function.

- [ ] **Step 4: Run all tests**

```bash
cd web && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api/services/community-cache.ts web/src/lib/api/services/notes.service.ts web/src/lib/api/clients/redis.ts
git commit -m "feat: add community cache invalidation, wire into note mutations, handle productId"
```

---

## Task 9: Shared API Client

**Files:**
- Modify: `packages/shared-api/src/endpoints.ts`
- Modify: `web/src/lib/api.ts`
- Modify: `mobile/src/api/endpoints.ts`

- [ ] **Step 1: Add createCommunityApi + createProductsApi to shared-api**

In `packages/shared-api/src/endpoints.ts`, add both functions following the existing pattern (see spec Section 5 for exact signatures).

- [ ] **Step 2: Export from web + mobile**

In `web/src/lib/api.ts`:
```ts
export const communityApi = createCommunityApi(apiClient);
export const productsApi = createProductsApi(apiClient);
```

In `mobile/src/api/endpoints.ts`: add `communityApi` and `productsApi` inline (same as shared-api pattern but using the mobile apiClient).

- [ ] **Step 3: Typecheck both**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared-api/ web/src/lib/api.ts mobile/src/api/endpoints.ts
git commit -m "feat: add communityApi and productsApi client wrappers"
```

---

## Task 10: Mobile VisibilitySelector + ProductSearchInput

**Files:**
- Create: `mobile/src/components/forms/VisibilitySelector.tsx`
- Create: `mobile/src/components/forms/ProductSearchInput.tsx`
- Modify: all 4 note form screens

- [ ] **Step 1: Create VisibilitySelector** (same as previous plan Task 9 Step 1)
- [ ] **Step 2: Create ProductSearchInput**

Create `mobile/src/components/forms/ProductSearchInput.tsx` — type-ahead search with "Create new" fallback. Search calls `productsApi.search()`, create calls `productsApi.create()`. Auto-sets category from note type. Inline mini-form for new product (name, producer, subType, vintage).

- [ ] **Step 3: Update RestaurantNoteFormScreen** — replace Switch with VisibilitySelector
- [ ] **Step 4: Update WineNoteFormScreen** — replace Switch with VisibilitySelector, add ProductSearchInput above existing fields, wire productId into formData
- [ ] **Step 5: Update SpiritNoteFormScreen** — same as wine
- [ ] **Step 6: Update WineryVisitNoteFormScreen** — replace Switch with VisibilitySelector
- [ ] **Step 7: Typecheck**

```bash
cd mobile && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add mobile/src/components/forms/ mobile/src/screens/note-creation/
git commit -m "feat: add VisibilitySelector and ProductSearchInput to note forms (mobile)"
```

---

## Task 11: Mobile Community Screens + Components

**Files:**
- Create: all `mobile/src/components/community/` files
- Create: `mobile/src/screens/community/VenueCommunityScreen.tsx`
- Create: `mobile/src/screens/community/ProductCommunityScreen.tsx`
- Modify: navigation types + navigator
- Delete: `mobile/src/screens/map/VenueNotesScreen.tsx`

- [ ] **Step 1: Create shared components** — NoteTierBadge, GourmetCard, TopGourmetsRow, RatingDistribution, VenueHero, ProductHero, CommunityView
- [ ] **Step 2: Create VenueCommunityScreen** — thin wrapper passing subjectType="venue"
- [ ] **Step 3: Create ProductCommunityScreen** — thin wrapper passing subjectType="product"
- [ ] **Step 4: Update navigation types**

```ts
// SearchStackParamList additions:
VenueCommunity: { venueId: string; venueName: string };
ProductCommunity: { productId: string; productName: string };
```

Remove old `VenueNotes` route.

- [ ] **Step 5: Update SearchStackNavigator** — register both screens, remove VenueNotesScreen import
- [ ] **Step 6: Update AreaExplorerScreen** — navigate to `VenueCommunity` instead of `VenueNotes`
- [ ] **Step 7: Delete VenueNotesScreen**

```bash
rm mobile/src/screens/map/VenueNotesScreen.tsx
```

- [ ] **Step 8: Typecheck**
- [ ] **Step 9: Commit**

```bash
git commit -m "feat: add VenueCommunity + ProductCommunity screens with shared components (mobile)"
```

---

## Task 12: Mobile Entry Points

**Files:**
- Modify: `mobile/src/screens/home/NoteDetailScreen.tsx`

- [ ] **Step 1: Make venue name tappable** — wrap in TouchableOpacity, navigate to VenueCommunity
- [ ] **Step 2: Make product name tappable** — if note has a product, show product name with link to ProductCommunity
- [ ] **Step 3: Typecheck + commit**

```bash
git commit -m "feat: link note detail venue/product names to community pages (mobile)"
```

---

## Task 13: Web VisibilitySelector + ProductSearchInput + Form Updates

**Files:**
- Create: `web/src/components/forms/visibility-selector.tsx`
- Create: `web/src/components/forms/product-search-input.tsx`
- Modify: web note creation forms

- [ ] **Step 1: Create web VisibilitySelector** (same as previous plan Task 12)
- [ ] **Step 2: Create web ProductSearchInput** — same logic as mobile, Tailwind styled
- [ ] **Step 3: Update note creation forms** — VisibilitySelector in all, ProductSearchInput in wine/spirit
- [ ] **Step 4: Typecheck + commit**

```bash
git commit -m "feat: add VisibilitySelector and ProductSearchInput to note forms (web)"
```

---

## Task 14: Web Community Pages + Components

**Files:**
- Create: all `web/src/components/community/` files
- Create: `web/src/app/(app)/venues/[placeId]/page.tsx`
- Create: `web/src/app/(app)/products/[productId]/page.tsx`

- [ ] **Step 1: Create shared components** — community-view, venue-hero, product-hero, rating-distribution, top-gourmets-list, gourmet-card, note-tier-badge, write-note-fab
- [ ] **Step 2: Create venue community page** — server shell + client CommunityView
- [ ] **Step 3: Create product community page** — server shell + client CommunityView
- [ ] **Step 4: Typecheck + commit**

```bash
git commit -m "feat: add venue + product community pages with shared components (web)"
```

---

## Task 15: Web Entry Points

**Files:**
- Modify: `web/src/components/map/venue-preview-panel.tsx`
- Modify: `web/src/app/(app)/notes/[noteId]/page.tsx`

- [ ] **Step 1: Update map preview** — "View Notes" links to `/venues/<placeId>`
- [ ] **Step 2: Update note detail** — venue name as `<Link>` to `/venues/<placeId>`, product name as `<Link>` to `/products/<productId>`
- [ ] **Step 3: Typecheck + commit**

```bash
git commit -m "feat: link map preview and note detail to community pages (web)"
```

---

## Task 16: Cleanup + Full Verification

**Files:**
- Delete: `docs/superpowers/specs/2026-04-09-venue-community-design.md`
- Delete: `docs/superpowers/plans/2026-04-09-venue-community.md`

- [ ] **Step 1: Run all tests**

```bash
cd web && npx vitest run
```

- [ ] **Step 2: Typecheck both workspaces**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

- [ ] **Step 3: Build web**

```bash
cd web && npm run build
```

- [ ] **Step 4: Remove superseded docs**

```bash
rm docs/superpowers/specs/2026-04-09-venue-community-design.md
rm docs/superpowers/plans/2026-04-09-venue-community.md
```

- [ ] **Step 5: Final commit + push**

```bash
git add -A
git commit -m "chore: remove superseded venue-only spec and plan"
git push origin main
```

- [ ] **Step 6: Monitor CI**

```bash
gh run list --limit 1
```
