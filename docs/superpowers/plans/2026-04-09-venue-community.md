# Venue Community Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build venue-level community pages on mobile + web with FRIENDS note visibility, tiered gourmet discovery, and four independently-cached backend endpoints.

**Architecture:** Four new/refactored API endpoints (`/venues/:id`, `/venues/:id/stats`, `/venues/:id/gourmets`, `/venues/:id/notes`) each backed by a focused service with its own Redis cache TTL. Client API wrapper makes parallel fetches and composes a `VenueCommunity` object. Mobile upgrades `VenueNotesScreen` to `VenueCommunityScreen`. Web adds `/venues/[placeId]` route with responsive two-column layout.

**Tech Stack:** Prisma 7 (migration), TypeScript 5.9, Next.js 16 App Router, React Native + Expo 54, React Query 5, Vitest 4, Redis (Upstash), Zod 4.

**Spec:** `docs/superpowers/specs/2026-04-09-venue-community-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `web/prisma/migrations/YYYYMMDD_add_friends_visibility/migration.sql` | Add FRIENDS to Visibility enum |
| `packages/shared-types/src/venue-community.ts` | VenueStats, VenueGourmet, VenueCommunity types |
| `web/src/lib/api/services/visibility-filter.ts` | Reusable `buildVisibilityFilter(viewerId)` helper |
| `web/src/lib/api/services/visibility-filter.test.ts` | Unit tests for visibility filter |
| `web/src/lib/api/services/venue-stats.service.ts` | Aggregate stats queries (PUBLIC notes only) |
| `web/src/lib/api/services/venue-stats.service.test.ts` | Unit tests for stats |
| `web/src/lib/api/services/venue-gourmets.service.ts` | Tiered gourmet ranking |
| `web/src/lib/api/services/venue-gourmets.service.test.ts` | Unit tests for gourmets |
| `web/src/lib/api/services/venue-notes.service.ts` | Paginated venue notes with tier tags |
| `web/src/lib/api/services/venue-notes.service.test.ts` | Unit tests for venue notes |
| `web/src/lib/api/services/venue-cache.ts` | `invalidateVenueCache(venueId)` helper |
| `web/src/app/api/v1/venues/[venueId]/stats/route.ts` | Stats endpoint |
| `web/src/app/api/v1/venues/[venueId]/gourmets/route.ts` | Gourmets endpoint |
| `web/src/app/api/v1/venues/[venueId]/notes/route.ts` | Notes endpoint |
| `web/src/app/(app)/venues/[placeId]/page.tsx` | Web venue community page |
| `web/src/components/venue-community/venue-community-view.tsx` | Client component shell |
| `web/src/components/venue-community/venue-hero.tsx` | Venue header with stats |
| `web/src/components/venue-community/venue-stats-bar.tsx` | Rating distribution bar chart |
| `web/src/components/venue-community/top-gourmets-list.tsx` | Gourmet row/sidebar |
| `web/src/components/venue-community/gourmet-card.tsx` | Individual gourmet card |
| `web/src/components/venue-community/note-tier-badge.tsx` | Tier indicator badge |
| `web/src/components/venue-community/write-note-fab.tsx` | Floating write button |
| `web/src/components/forms/visibility-selector.tsx` | Three-way visibility picker (web) |
| `mobile/src/screens/map/VenueCommunityScreen.tsx` | Mobile venue community screen |
| `mobile/src/components/venue-community/VenueHero.tsx` | Mobile venue header |
| `mobile/src/components/venue-community/RatingDistribution.tsx` | Mobile bar chart |
| `mobile/src/components/venue-community/TopGourmetsRow.tsx` | Horizontal gourmet scroll |
| `mobile/src/components/venue-community/GourmetCard.tsx` | Mobile gourmet card |
| `mobile/src/components/venue-community/NoteTierBadge.tsx` | Mobile tier badge |
| `mobile/src/components/forms/VisibilitySelector.tsx` | Three-way visibility picker (mobile) |

### Modified files

| File | Change |
|------|--------|
| `web/prisma/schema.prisma:18-21` | Add FRIENDS to Visibility enum |
| `packages/shared-types/src/index.ts:17-20` | Add FRIENDS to Visibility enum, re-export venue-community types |
| `packages/shared-api/src/endpoints.ts` | Add `createVenueCommunityApi` |
| `web/src/lib/api.ts` | Export `venueCommunityApi` |
| `web/src/lib/api/services/notes.service.ts` | Add `invalidateVenueCache` call in create/update/remove |
| `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts` | Delegate to new venue-notes service |
| `web/src/components/map/venue-preview-panel.tsx:165-170,228-233` | Change "View Notes" links to `/venues/<placeId>` |
| `web/src/app/(app)/notes/[noteId]/page.tsx` | Make venue name a `<Link>` |
| `web/src/components/note-form-layout.tsx:162-171` | Replace Switch with VisibilitySelector |
| `mobile/src/api/endpoints.ts` | Add `venueCommunityApi` |
| `mobile/src/types/index.ts` | Re-export new types |
| `mobile/src/navigation/SearchStackNavigator.tsx` | Swap VenueNotesScreen for VenueCommunityScreen |
| `mobile/src/screens/home/NoteDetailScreen.tsx:119-124` | Make venue name tappable |
| `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx:226-237` | Replace Switch with VisibilitySelector |
| `mobile/src/screens/note-creation/WineNoteFormScreen.tsx` | Replace Switch with VisibilitySelector |
| `mobile/src/screens/note-creation/SpiritNoteFormScreen.tsx` | Replace Switch with VisibilitySelector |
| `mobile/src/screens/note-creation/WineryVisitNoteFormScreen.tsx` | Replace Switch with VisibilitySelector |

### Deleted files

| File | Reason |
|------|--------|
| `mobile/src/screens/map/VenueNotesScreen.tsx` | Replaced by VenueCommunityScreen |

---

## Task 1: Schema Migration — Add FRIENDS Visibility

**Files:**
- Modify: `web/prisma/schema.prisma:18-21`
- Create: `web/prisma/migrations/<timestamp>_add_friends_visibility/migration.sql`

- [ ] **Step 1: Update Prisma schema**

In `web/prisma/schema.prisma`, change lines 18-21:

```prisma
enum Visibility {
  PUBLIC
  PRIVATE
  FRIENDS
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd web && npx prisma migrate dev --name add_friends_visibility
```

Expected: Migration created and applied. The SQL will be:
```sql
ALTER TYPE "Visibility" ADD VALUE 'FRIENDS';
```

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
cd web && npx prisma generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 4: Commit**

```bash
git add web/prisma/schema.prisma web/prisma/migrations/
git commit -m "feat: add FRIENDS to Visibility enum"
```

---

## Task 2: Shared Types — VenueStats, VenueGourmet, VenueCommunity

**Files:**
- Create: `packages/shared-types/src/venue-community.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `mobile/src/types/index.ts`

- [ ] **Step 1: Create venue community types file**

Create `packages/shared-types/src/venue-community.ts`:

```ts
import type { PublicUser, TasteSimilarity, SocialNote, Venue } from './index';

export interface VenueStats {
  venueId: string;
  totalNotes: number;
  totalGourmets: number;
  avgRating: number | null;
  ratingDistribution: Record<string, number>;
}

export interface VenueGourmet {
  user: PublicUser;
  tier: 1 | 2 | 3;
  noteCount: number;
  tasteSimilarity: TasteSimilarity[] | null;
  isPinned: boolean;
}

export interface VenueCommunity {
  venue: Venue;
  stats: VenueStats;
  gourmets: VenueGourmet[];
  notes: {
    items: (SocialNote & { tier: number })[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}
```

- [ ] **Step 2: Add FRIENDS to Visibility enum and re-export types in shared-types index**

In `packages/shared-types/src/index.ts`, update the Visibility enum (around line 17-20):

```ts
export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  FRIENDS = 'FRIENDS',
}
```

And add at the bottom of the file:

```ts
export type { VenueStats, VenueGourmet, VenueCommunity } from './venue-community';
```

- [ ] **Step 3: Re-export new types from mobile types**

In `mobile/src/types/index.ts`, add to the existing re-export statement:

```ts
export type { VenueStats, VenueGourmet, VenueCommunity } from '@mygourmetdiary/shared-types';
```

- [ ] **Step 4: Verify typecheck passes on both workspaces**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/ mobile/src/types/
git commit -m "feat: add VenueStats, VenueGourmet, VenueCommunity shared types and FRIENDS visibility"
```

---

## Task 3: Visibility Filter Helper + Tests

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

  it('includes PUBLIC notes for any viewer', () => {
    const filter = buildVisibilityFilter(viewerId);
    expect(filter.OR).toContainEqual({ visibility: 'PUBLIC' });
  });

  it('includes own notes regardless of visibility', () => {
    const filter = buildVisibilityFilter(viewerId);
    expect(filter.OR).toContainEqual({ authorId: viewerId });
  });

  it('includes FRIENDS notes where author has pinned the viewer', () => {
    const filter = buildVisibilityFilter(viewerId);
    const friendsClause = filter.OR.find(
      (c: Record<string, unknown>) => c.visibility === 'FRIENDS',
    );
    expect(friendsClause).toBeDefined();
    expect(friendsClause).toEqual({
      visibility: 'FRIENDS',
      author: {
        pinnedFriends: {
          some: { pinnedId: viewerId },
        },
      },
    });
  });

  it('returns exactly three OR clauses', () => {
    const filter = buildVisibilityFilter(viewerId);
    expect(filter.OR).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/api/services/visibility-filter.test.ts
```

Expected: FAIL — `Cannot find module './visibility-filter'`

- [ ] **Step 3: Implement the helper**

Create `web/src/lib/api/services/visibility-filter.ts`:

```ts
/**
 * Builds a Prisma `where` clause for note visibility.
 *
 * A note is visible to a viewer if:
 * - visibility = PUBLIC (anyone can see)
 * - authorId = viewerId (own notes always visible)
 * - visibility = FRIENDS AND the note's author has pinned the viewer
 */
export function buildVisibilityFilter(viewerId: string) {
  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { authorId: viewerId },
      {
        visibility: 'FRIENDS' as const,
        author: {
          pinnedFriends: {
            some: { pinnedId: viewerId },
          },
        },
      },
    ],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/lib/api/services/visibility-filter.test.ts
```

Expected: 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api/services/visibility-filter.ts web/src/lib/api/services/visibility-filter.test.ts
git commit -m "feat: add buildVisibilityFilter helper with tests"
```

---

## Task 4: Venue Stats Service + Tests

**Files:**
- Create: `web/src/lib/api/services/venue-stats.service.ts`
- Create: `web/src/lib/api/services/venue-stats.service.test.ts`
- Create: `web/src/app/api/v1/venues/[venueId]/stats/route.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/venue-stats.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRatingDistribution, computeStats } from './venue-stats.service';

describe('buildRatingDistribution', () => {
  it('builds histogram from grouped rating counts', () => {
    const grouped = [
      { rating: 7, _count: { id: 3 } },
      { rating: 9, _count: { id: 1 } },
      { rating: 10, _count: { id: 2 } },
    ];
    const dist = buildRatingDistribution(grouped);
    expect(dist['7']).toBe(3);
    expect(dist['9']).toBe(1);
    expect(dist['10']).toBe(2);
    expect(dist['1']).toBe(0);
    expect(dist['5']).toBe(0);
  });

  it('returns all zeros for empty input', () => {
    const dist = buildRatingDistribution([]);
    for (let i = 1; i <= 10; i++) {
      expect(dist[String(i)]).toBe(0);
    }
  });
});

describe('computeStats', () => {
  it('computes totalNotes, totalGourmets, and avgRating from aggregates', () => {
    const noteCount = 15;
    const gourmetCount = 4;
    const avgRating = 7.666666;
    const result = computeStats('venue-1', noteCount, gourmetCount, avgRating);
    expect(result.venueId).toBe('venue-1');
    expect(result.totalNotes).toBe(15);
    expect(result.totalGourmets).toBe(4);
    expect(result.avgRating).toBe(7.7);
  });

  it('returns null avgRating when no notes', () => {
    const result = computeStats('venue-1', 0, 0, null);
    expect(result.avgRating).toBeNull();
    expect(result.totalNotes).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/api/services/venue-stats.service.test.ts
```

Expected: FAIL — Cannot find module.

- [ ] **Step 3: Implement the service**

Create `web/src/lib/api/services/venue-stats.service.ts`:

```ts
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';

const CACHE_TTL = 300; // 5 minutes

interface RatingGroup {
  rating: number;
  _count: { id: number };
}

export function buildRatingDistribution(
  grouped: RatingGroup[],
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (let i = 1; i <= 10; i++) dist[String(i)] = 0;
  for (const g of grouped) {
    dist[String(g.rating)] = g._count.id;
  }
  return dist;
}

export function computeStats(
  venueId: string,
  totalNotes: number,
  totalGourmets: number,
  avgRating: number | null,
) {
  return {
    venueId,
    totalNotes,
    totalGourmets,
    avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
  };
}

export const venueStatsService = {
  async getStats(venueId: string) {
    const cacheKey = `venue-stats:${venueId}`;
    const cached = await getJson<ReturnType<typeof computeStats> & { ratingDistribution: Record<string, number> }>(cacheKey);
    if (cached) return cached;

    const publicWhere = { venueId, visibility: 'PUBLIC' as const };

    const [countResult, gourmetResult, avgResult, ratingGroups] =
      await Promise.all([
        prisma.note.count({ where: publicWhere }),
        prisma.note.groupBy({
          by: ['authorId'],
          where: publicWhere,
          _count: { id: true },
        }),
        prisma.note.aggregate({
          where: publicWhere,
          _avg: { rating: true },
        }),
        prisma.note.groupBy({
          by: ['rating'],
          where: publicWhere,
          _count: { id: true },
        }),
      ]);

    const stats = {
      ...computeStats(
        venueId,
        countResult,
        gourmetResult.length,
        avgResult._avg.rating,
      ),
      ratingDistribution: buildRatingDistribution(ratingGroups),
    };

    await setJson(cacheKey, stats, CACHE_TTL);
    return stats;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/lib/api/services/venue-stats.service.test.ts
```

Expected: 4 tests passed.

- [ ] **Step 5: Create the route handler**

Create `web/src/app/api/v1/venues/[venueId]/stats/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { venueStatsService } from '@/lib/api/services/venue-stats.service';
import { prisma } from '@/lib/api/clients/prisma';

export const GET = withAuth(async (req: NextRequest) => {
  const venueId = req.nextUrl.pathname.split('/').at(-2)!;

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return apiError('Venue not found', 404);

  const stats = await venueStatsService.getStats(venueId);
  return apiSuccess(stats);
});
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/services/venue-stats.service.ts web/src/lib/api/services/venue-stats.service.test.ts web/src/app/api/v1/venues/\[venueId\]/stats/
git commit -m "feat: add venue stats service, tests, and endpoint"
```

---

## Task 5: Venue Gourmets Service + Tests

**Files:**
- Create: `web/src/lib/api/services/venue-gourmets.service.ts`
- Create: `web/src/lib/api/services/venue-gourmets.service.test.ts`
- Create: `web/src/app/api/v1/venues/[venueId]/gourmets/route.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/venue-gourmets.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assignTiers } from './venue-gourmets.service';

describe('assignTiers', () => {
  const pinnedIds = new Set(['friend-1', 'friend-2']);
  const tssScores = new Map<string, number>([
    ['friend-1', 0.85],
    ['user-high-tss', 0.75],
    ['user-low-tss', 0.4],
  ]);

  const authors = [
    { userId: 'friend-1', noteCount: 3, displayName: 'Friend One', avatarUrl: null },
    { userId: 'friend-2', noteCount: 1, displayName: 'Friend Two', avatarUrl: null },
    { userId: 'user-high-tss', noteCount: 5, displayName: 'High TSS', avatarUrl: null },
    { userId: 'user-low-tss', noteCount: 8, displayName: 'Low TSS', avatarUrl: null },
    { userId: 'user-no-tss', noteCount: 12, displayName: 'No TSS', avatarUrl: null },
  ];

  it('assigns tier 1 to pinned friends', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier1 = result.filter((g) => g.tier === 1);
    expect(tier1).toHaveLength(2);
    expect(tier1.map((g) => g.user.id)).toContain('friend-1');
    expect(tier1.map((g) => g.user.id)).toContain('friend-2');
  });

  it('assigns tier 2 to non-pinned users with TSS >= 0.7', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier2 = result.filter((g) => g.tier === 2);
    expect(tier2).toHaveLength(1);
    expect(tier2[0].user.id).toBe('user-high-tss');
  });

  it('assigns tier 3 to remaining users', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    const tier3 = result.filter((g) => g.tier === 3);
    expect(tier3).toHaveLength(2);
    expect(tier3.map((g) => g.user.id)).toContain('user-low-tss');
    expect(tier3.map((g) => g.user.id)).toContain('user-no-tss');
  });

  it('sorts tier 1 by TSS desc, tier 2 by TSS desc, tier 3 by noteCount desc', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 10);
    expect(result[0].user.id).toBe('friend-1'); // TSS 0.85
    expect(result[1].user.id).toBe('friend-2'); // TSS undefined, after friend-1
    expect(result[2].user.id).toBe('user-high-tss'); // tier 2, TSS 0.75
    expect(result[3].user.id).toBe('user-no-tss'); // tier 3, 12 notes
    expect(result[4].user.id).toBe('user-low-tss'); // tier 3, 8 notes
  });

  it('respects limit', () => {
    const result = assignTiers(authors, pinnedIds, tssScores, 3);
    expect(result).toHaveLength(3);
  });

  it('returns empty array when no authors', () => {
    const result = assignTiers([], pinnedIds, tssScores, 5);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/api/services/venue-gourmets.service.test.ts
```

Expected: FAIL — Cannot find module.

- [ ] **Step 3: Implement the service**

Create `web/src/lib/api/services/venue-gourmets.service.ts`:

```ts
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { tssCacheService } from './taste-matching/tss-cache.service';
import { buildVisibilityFilter } from './visibility-filter';

const CACHE_TTL = 300; // 5 minutes
const TSS_THRESHOLD = 0.7;

interface AuthorRow {
  userId: string;
  noteCount: number;
  displayName: string;
  avatarUrl: string | null;
}

interface GourmetResult {
  user: { id: string; displayName: string; avatarUrl: string | null };
  tier: 1 | 2 | 3;
  noteCount: number;
  maxTss: number | null;
  isPinned: boolean;
}

export function assignTiers(
  authors: AuthorRow[],
  pinnedIds: Set<string>,
  tssScores: Map<string, number>,
  limit: number,
): GourmetResult[] {
  const tier1: GourmetResult[] = [];
  const tier2: GourmetResult[] = [];
  const tier3: GourmetResult[] = [];

  for (const a of authors) {
    const isPinned = pinnedIds.has(a.userId);
    const maxTss = tssScores.get(a.userId) ?? null;
    const entry: GourmetResult = {
      user: { id: a.userId, displayName: a.displayName, avatarUrl: a.avatarUrl },
      tier: isPinned ? 1 : maxTss !== null && maxTss >= TSS_THRESHOLD ? 2 : 3,
      noteCount: a.noteCount,
      maxTss,
      isPinned,
    };

    if (entry.tier === 1) tier1.push(entry);
    else if (entry.tier === 2) tier2.push(entry);
    else tier3.push(entry);
  }

  tier1.sort((a, b) => (b.maxTss ?? 0) - (a.maxTss ?? 0));
  tier2.sort((a, b) => (b.maxTss ?? 0) - (a.maxTss ?? 0));
  tier3.sort((a, b) => b.noteCount - a.noteCount);

  return [...tier1, ...tier2, ...tier3].slice(0, limit);
}

export const venueGourmetsService = {
  async getGourmets(viewerId: string, venueId: string, limit = 5) {
    const cacheKey = `venue-gourmets:${venueId}:${viewerId}`;
    const cached = await getJson<GourmetResult[]>(cacheKey);
    if (cached) return cached;

    // Find distinct authors with visible notes at this venue
    const visFilter = buildVisibilityFilter(viewerId);
    const authorGroups = await prisma.note.groupBy({
      by: ['authorId'],
      where: { venueId, ...visFilter },
      _count: { id: true },
    });

    // Exclude the viewer from the gourmet list
    const authorIds = authorGroups
      .map((g) => g.authorId)
      .filter((id) => id !== viewerId);

    if (authorIds.length === 0) {
      await setJson(cacheKey, [], CACHE_TTL);
      return [];
    }

    // Fetch author profiles
    const users = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch viewer's pinned friends
    const pinnedIds = new Set(
      await tssCacheService.getPinnedFriendIds(viewerId),
    );

    // Fetch TSS scores (max across categories) for these authors
    const tssRows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [
          { userAId: viewerId, userBId: { in: authorIds } },
          { userAId: { in: authorIds }, userBId: viewerId },
        ],
      },
      select: { userAId: true, userBId: true, score: true },
    });

    const tssScores = new Map<string, number>();
    for (const row of tssRows) {
      if (row.score === null) continue;
      const otherId = row.userAId === viewerId ? row.userBId : row.userAId;
      const existing = tssScores.get(otherId) ?? 0;
      if (row.score > existing) tssScores.set(otherId, row.score);
    }

    // Build author rows
    const authorRows: AuthorRow[] = [];
    const countMap = new Map(authorGroups.map((g) => [g.authorId, g._count.id]));
    for (const authorId of authorIds) {
      const user = userMap.get(authorId);
      if (!user) continue;
      authorRows.push({
        userId: authorId,
        noteCount: countMap.get(authorId) ?? 0,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    }

    // Assign tiers and rank
    const result = assignTiers(authorRows, pinnedIds, tssScores, limit);

    // Attach full TSS breakdown per gourmet
    const gourmets = result.map((g) => {
      const similarities = tssRows
        .filter((r) => r.userAId === g.user.id || r.userBId === g.user.id)
        .map((r) => ({ score: r.score }));
      return { ...g, tasteSimilarity: similarities.length > 0 ? similarities : null };
    });

    await setJson(cacheKey, gourmets, CACHE_TTL);
    return gourmets;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/lib/api/services/venue-gourmets.service.test.ts
```

Expected: 6 tests passed.

- [ ] **Step 5: Create the route handler**

Create `web/src/app/api/v1/venues/[venueId]/gourmets/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { venueGourmetsService } from '@/lib/api/services/venue-gourmets.service';
import { prisma } from '@/lib/api/clients/prisma';

export const GET = withAuth(async (req: NextRequest, user) => {
  const venueId = req.nextUrl.pathname.split('/').at(-2)!;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitStr || '5', 10) || 5, 1), 20);

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return apiError('Venue not found', 404);

  const gourmets = await venueGourmetsService.getGourmets(user.id, venueId, limit);
  return apiSuccess(gourmets);
});
```

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/api/services/venue-gourmets.service.ts web/src/lib/api/services/venue-gourmets.service.test.ts web/src/app/api/v1/venues/\[venueId\]/gourmets/
git commit -m "feat: add venue gourmets service with tiered ranking, tests, and endpoint"
```

---

## Task 6: Venue Notes Service + Tests

**Files:**
- Create: `web/src/lib/api/services/venue-notes.service.ts`
- Create: `web/src/lib/api/services/venue-notes.service.test.ts`
- Create: `web/src/app/api/v1/venues/[venueId]/notes/route.ts`
- Modify: `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts`

- [ ] **Step 1: Write failing tests**

Create `web/src/lib/api/services/venue-notes.service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { assignNoteTier } from './venue-notes.service';

describe('assignNoteTier', () => {
  const pinnedIds = new Set(['friend-1']);
  const tssScores = new Map([['high-tss-user', 0.8], ['low-tss-user', 0.4]]);

  it('assigns tier 1 to notes from pinned friends', () => {
    expect(assignNoteTier('friend-1', pinnedIds, tssScores)).toBe(1);
  });

  it('assigns tier 2 to notes from high-TSS authors', () => {
    expect(assignNoteTier('high-tss-user', pinnedIds, tssScores)).toBe(2);
  });

  it('assigns tier 3 to notes from low-TSS authors', () => {
    expect(assignNoteTier('low-tss-user', pinnedIds, tssScores)).toBe(3);
  });

  it('assigns tier 4 to notes from unknown authors', () => {
    expect(assignNoteTier('random-user', pinnedIds, tssScores)).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npx vitest run src/lib/api/services/venue-notes.service.test.ts
```

Expected: FAIL — Cannot find module.

- [ ] **Step 3: Implement the service**

Create `web/src/lib/api/services/venue-notes.service.ts`:

```ts
import { prisma } from '../clients/prisma';
import { getJson, setJson } from '../clients/redis';
import { tssCacheService } from './taste-matching/tss-cache.service';
import { buildVisibilityFilter } from './visibility-filter';

const CACHE_TTL = 60; // 1 minute
const TSS_THRESHOLD = 0.7;

export function assignNoteTier(
  authorId: string,
  pinnedIds: Set<string>,
  tssScores: Map<string, number>,
): 1 | 2 | 3 | 4 {
  if (pinnedIds.has(authorId)) return 1;
  const tss = tssScores.get(authorId);
  if (tss !== undefined && tss >= TSS_THRESHOLD) return 2;
  if (tss !== undefined) return 3;
  return 4;
}

export const venueNotesService = {
  async getByVenue(
    viewerId: string,
    venueId: string,
    cursor?: string,
    limit = 20,
  ) {
    const cacheKey = `venue-notes:${venueId}:${viewerId}:${cursor || 'first'}`;
    const cached = await getJson<{
      items: unknown[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(cacheKey);
    if (cached) return cached;

    const visFilter = buildVisibilityFilter(viewerId);
    const where: Record<string, unknown> = { venueId, ...visFilter };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        venue: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        author: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = notes.length > limit;
    const page = hasMore ? notes.slice(0, limit) : notes;
    const nextCursor = hasMore
      ? page[page.length - 1].createdAt.toISOString()
      : null;

    // Load tier data for visible authors
    const authorIds = [...new Set(page.map((n) => n.authorId))];
    const pinnedIds = new Set(
      await tssCacheService.getPinnedFriendIds(viewerId),
    );

    const tssRows = await prisma.tasteSimilarity.findMany({
      where: {
        OR: [
          { userAId: viewerId, userBId: { in: authorIds } },
          { userAId: { in: authorIds }, userBId: viewerId },
        ],
      },
      select: { userAId: true, userBId: true, score: true },
    });

    const tssScores = new Map<string, number>();
    for (const row of tssRows) {
      if (row.score === null) continue;
      const otherId = row.userAId === viewerId ? row.userBId : row.userAId;
      const existing = tssScores.get(otherId) ?? 0;
      if (row.score > existing) tssScores.set(otherId, row.score);
    }

    const items = page.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      experiencedAt: note.experiencedAt.toISOString(),
      tier: assignNoteTier(note.authorId, pinnedIds, tssScores),
    }));

    // Sort by tier asc, then createdAt desc within tier
    items.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const result = { items, nextCursor, hasMore };
    await setJson(cacheKey, result, CACHE_TTL);
    return result;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd web && npx vitest run src/lib/api/services/venue-notes.service.test.ts
```

Expected: 4 tests passed.

- [ ] **Step 5: Create the route handler**

Create `web/src/app/api/v1/venues/[venueId]/notes/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/response';
import { venueNotesService } from '@/lib/api/services/venue-notes.service';
import { prisma } from '@/lib/api/clients/prisma';

export const GET = withAuth(async (req: NextRequest, user) => {
  const venueId = req.nextUrl.pathname.split('/').at(-2)!;
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined;
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) return apiError('Venue not found', 404);

  const result = await venueNotesService.getByVenue(user.id, venueId, cursor, limit);
  return apiSuccess(result);
});
```

- [ ] **Step 6: Update old explore endpoint to delegate**

Modify `web/src/app/api/v1/explore/venue/[venueId]/notes/route.ts` to delegate to the new service:

```ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { apiSuccess } from '@/lib/api/response';
import { venueNotesService } from '@/lib/api/services/venue-notes.service';

function extractVenueId(req: NextRequest): string {
  const parts = req.nextUrl.pathname.split('/');
  return parts[parts.length - 2];
}

export const GET = withAuth(async (req: NextRequest, user) => {
  const venueId = extractVenueId(req);
  const limitStr = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitStr || '20', 10) || 20, 1), 50);

  const result = await venueNotesService.getByVenue(user.id, venueId, undefined, limit);
  return apiSuccess(result.items);
});
```

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/api/services/venue-notes.service.ts web/src/lib/api/services/venue-notes.service.test.ts web/src/app/api/v1/venues/\[venueId\]/notes/ web/src/app/api/v1/explore/venue/\[venueId\]/notes/route.ts
git commit -m "feat: add venue notes service with visibility filter, tier assignment, tests, and endpoint"
```

---

## Task 7: Cache Invalidation Helper

**Files:**
- Create: `web/src/lib/api/services/venue-cache.ts`
- Modify: `web/src/lib/api/services/notes.service.ts`

- [ ] **Step 1: Create the invalidation helper**

Create `web/src/lib/api/services/venue-cache.ts`:

```ts
import { getRedis } from '../clients/redis';

/**
 * Invalidate all venue-related caches when notes change at a venue.
 * Clears stats (user-independent) and uses SCAN for user-specific keys.
 */
export async function invalidateVenueCache(venueId: string): Promise<void> {
  try {
    const redis = getRedis();
    // Delete the user-independent stats cache
    await redis.del(`venue-stats:${venueId}`);

    // Scan and delete user-specific gourmets and notes caches
    const patterns = [
      `venue-gourmets:${venueId}:*`,
      `venue-notes:${venueId}:*`,
    ];

    for (const pattern of patterns) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  } catch {
    // Cache invalidation failure is non-fatal — stale data will expire via TTL
  }
}
```

- [ ] **Step 2: Check the `getRedis` export from redis.ts**

Read `web/src/lib/api/clients/redis.ts` to verify `getRedis` is exported. If not, we'll need to export it or use an alternative.

```bash
cd web && grep -n "export.*getRedis\|function getRedis" src/lib/api/clients/redis.ts
```

If `getRedis` is not exported, add `export` before the function declaration.

- [ ] **Step 3: Wire into notes.service.ts create/update/remove**

In `web/src/lib/api/services/notes.service.ts`, add the import at the top:

```ts
import { invalidateVenueCache } from './venue-cache';
```

Then add cache invalidation calls at the end of `create`, `update`, and `remove` methods. In `create` (after note is created, around line 135):

```ts
    // Invalidate venue caches if note is linked to a venue
    if (resolvedVenueId) {
      invalidateVenueCache(resolvedVenueId);
    }
```

In `update` (after note is updated):

```ts
    if (note.venueId) {
      invalidateVenueCache(note.venueId);
    }
```

In `remove` (after note is deleted):

```ts
    if (note.venueId) {
      invalidateVenueCache(note.venueId);
    }
```

- [ ] **Step 4: Run existing tests to verify nothing broke**

```bash
cd web && npx vitest run
```

Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api/services/venue-cache.ts web/src/lib/api/services/notes.service.ts web/src/lib/api/clients/redis.ts
git commit -m "feat: add venue cache invalidation helper, wire into note mutations"
```

---

## Task 8: Shared API Client + Mobile/Web Wiring

**Files:**
- Modify: `packages/shared-api/src/endpoints.ts`
- Modify: `web/src/lib/api.ts`
- Modify: `mobile/src/api/endpoints.ts`

- [ ] **Step 1: Add `createVenueCommunityApi` to shared-api**

In `packages/shared-api/src/endpoints.ts`, add after the existing `createAreaExplorerApi`:

```ts
export function createVenueCommunityApi(client: AxiosInstance) {
  return {
    getStats: (venueId: string) =>
      client
        .get<ApiResponse<VenueStats>>(`/venues/${venueId}/stats`)
        .then((r) => r.data.data),
    getGourmets: (venueId: string, limit?: number) => {
      const params = limit ? `?limit=${limit}` : '';
      return client
        .get<ApiResponse<VenueGourmet[]>>(`/venues/${venueId}/gourmets${params}`)
        .then((r) => r.data.data);
    },
    getNotes: (venueId: string, cursor?: string, limit?: number) => {
      const searchParams = new URLSearchParams();
      if (cursor) searchParams.set('cursor', cursor);
      if (limit) searchParams.set('limit', String(limit));
      const qs = searchParams.toString();
      return client
        .get<ApiResponse<{ items: (SocialNote & { tier: number })[]; nextCursor: string | null; hasMore: boolean }>>(`/venues/${venueId}/notes${qs ? `?${qs}` : ''}`)
        .then((r) => r.data.data);
    },
  };
}
```

Add the required imports at the top of the file:

```ts
import type { VenueStats, VenueGourmet } from '@mygourmetdiary/shared-types';
```

- [ ] **Step 2: Export from web API**

In `web/src/lib/api.ts`, add:

```ts
export const venueCommunityApi = createVenueCommunityApi(apiClient);
```

And add `createVenueCommunityApi` to the import from shared-api.

- [ ] **Step 3: Export from mobile endpoints**

In `mobile/src/api/endpoints.ts`, add after the existing `areaExplorerApi`:

```ts
export const venueCommunityApi = {
  getStats: (venueId: string) =>
    apiClient
      .get<ApiResponse<VenueStats>>(`/venues/${venueId}/stats`)
      .then((r) => r.data.data),
  getGourmets: (venueId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient
      .get<ApiResponse<VenueGourmet[]>>(`/venues/${venueId}/gourmets${params}`)
      .then((r) => r.data.data);
  },
  getNotes: (venueId: string, cursor?: string, limit?: number) => {
    const searchParams = new URLSearchParams();
    if (cursor) searchParams.set('cursor', cursor);
    if (limit) searchParams.set('limit', String(limit));
    const qs = searchParams.toString();
    return apiClient
      .get<ApiResponse<{ items: Note[]; nextCursor: string | null; hasMore: boolean }>>(`/venues/${venueId}/notes${qs ? `?${qs}` : ''}`)
      .then((r) => r.data.data);
  },
};
```

Add `VenueStats`, `VenueGourmet` to the type imports at the top.

- [ ] **Step 4: Typecheck both workspaces**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared-api/ web/src/lib/api.ts mobile/src/api/endpoints.ts
git commit -m "feat: add venueCommunityApi client for mobile and web"
```

---

## Task 9: Mobile VisibilitySelector Component

**Files:**
- Create: `mobile/src/components/forms/VisibilitySelector.tsx`
- Modify: `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx`
- Modify: `mobile/src/screens/note-creation/WineNoteFormScreen.tsx`
- Modify: `mobile/src/screens/note-creation/SpiritNoteFormScreen.tsx`
- Modify: `mobile/src/screens/note-creation/WineryVisitNoteFormScreen.tsx`

- [ ] **Step 1: Create VisibilitySelector component**

Create `mobile/src/components/forms/VisibilitySelector.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Visibility } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: Visibility.PRIVATE, label: 'Private', hint: 'Only you can see this note' },
  { value: Visibility.FRIENDS, label: 'Friends', hint: 'Your pinned Gourmet Friends can see this note' },
  { value: Visibility.PUBLIC, label: 'Public', hint: 'Anyone can discover this note' },
];

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const selectedOption = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Visibility</Text>
      <View style={styles.segmented}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, value === opt.value && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === opt.value }}
          >
            <Text style={[styles.segmentText, value === opt.value && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>{selectedOption.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  segmentTextActive: { color: colors.textInverse },
  hint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
});
```

- [ ] **Step 2: Replace Switch with VisibilitySelector in RestaurantNoteFormScreen**

In `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx`, replace the visibility Switch block (around lines 226-237) with:

```tsx
<VisibilitySelector
  value={formData.visibility}
  onChange={(v) => updateField('visibility', v)}
/>
```

Add the import at the top:

```ts
import { VisibilitySelector } from '../../components/forms/VisibilitySelector';
```

Remove `Visibility` from the types import (if no longer used directly) and remove the now-unused `Switch` import.

- [ ] **Step 3: Repeat for WineNoteFormScreen, SpiritNoteFormScreen, WineryVisitNoteFormScreen**

Same change in each: replace the `<View style={styles.switchRow}>...<Switch>...</View>` block with `<VisibilitySelector>`, add the import, clean up unused imports.

- [ ] **Step 4: Typecheck**

```bash
cd mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/components/forms/VisibilitySelector.tsx mobile/src/screens/note-creation/
git commit -m "feat: add VisibilitySelector with FRIENDS option to all note forms (mobile)"
```

---

## Task 10: Mobile VenueCommunityScreen + Components

**Files:**
- Create: `mobile/src/components/venue-community/VenueHero.tsx`
- Create: `mobile/src/components/venue-community/RatingDistribution.tsx`
- Create: `mobile/src/components/venue-community/TopGourmetsRow.tsx`
- Create: `mobile/src/components/venue-community/GourmetCard.tsx`
- Create: `mobile/src/components/venue-community/NoteTierBadge.tsx`
- Create: `mobile/src/screens/map/VenueCommunityScreen.tsx`
- Delete: `mobile/src/screens/map/VenueNotesScreen.tsx`
- Modify: `mobile/src/navigation/SearchStackNavigator.tsx`

This task is UI-heavy — follow the layout from the spec (Section 7). Each sub-component is a focused file.

- [ ] **Step 1: Create NoteTierBadge**

Create `mobile/src/components/venue-community/NoteTierBadge.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const TIER_CONFIG: Record<number, { label: string; color: string; icon?: keyof typeof MaterialIcons.glyphMap }> = {
  1: { label: 'Friend', color: colors.primary, icon: 'push-pin' },
  2: { label: 'Match', color: colors.accent },
  3: { label: '', color: colors.textTertiary },
  4: { label: '', color: colors.textTertiary },
};

export function NoteTierBadge({ tier, tssScore }: { tier: number; tssScore?: number | null }) {
  if (tier > 2) return null;
  const config = TIER_CONFIG[tier];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
      {config.icon && <MaterialIcons name={config.icon} size={10} color={config.color} />}
      <Text style={[styles.text, { color: config.color }]}>
        {tier === 2 && tssScore ? `${Math.round(tssScore * 100)}%` : config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  text: { ...typography.caption, fontSize: 10, fontWeight: '700' },
});
```

- [ ] **Step 2: Create GourmetCard**

Create `mobile/src/components/venue-community/GourmetCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VenueGourmet } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Props {
  gourmet: VenueGourmet;
  onPress: () => void;
}

export function GourmetCard({ gourmet, onPress }: Props) {
  const { user, tier, noteCount, isPinned } = gourmet;
  const maxTss = gourmet.tasteSimilarity?.[0]?.score;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialIcons name="person" size={24} color={colors.textTertiary} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{user.displayName}</Text>
      {tier === 1 && (
        <View style={styles.badgeRow}>
          <MaterialIcons name="push-pin" size={10} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Friend</Text>
        </View>
      )}
      {tier === 2 && maxTss != null && (
        <Text style={[styles.badgeText, { color: colors.accent }]}>
          {Math.round(maxTss * 100)}% match
        </Text>
      )}
      {tier === 3 && (
        <Text style={styles.badgeText}>{noteCount} notes</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 90,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.caption, color: colors.text, fontWeight: '600', textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badgeText: { ...typography.caption, fontSize: 10, color: colors.textTertiary },
});
```

- [ ] **Step 3: Create TopGourmetsRow**

Create `mobile/src/components/venue-community/TopGourmetsRow.tsx`:

```tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { VenueGourmet } from '../../types';
import { GourmetCard } from './GourmetCard';
import { colors, typography, spacing } from '../../theme';

interface Props {
  gourmets: VenueGourmet[];
  onGourmetPress: (userId: string) => void;
}

export function TopGourmetsRow({ gourmets, onGourmetPress }: Props) {
  if (gourmets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Top Gourmets</Text>
      <FlatList
        data={gourmets}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(g) => g.user.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GourmetCard
            gourmet={item}
            onPress={() => onGourmetPress(item.user.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.md,
  },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
});
```

- [ ] **Step 4: Create RatingDistribution**

Create `mobile/src/components/venue-community/RatingDistribution.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Props {
  distribution: Record<string, number>;
}

export function RatingDistribution({ distribution }: Props) {
  const maxCount = Math.max(...Object.values(distribution), 1);
  const entries = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: distribution[String(i + 1)] ?? 0,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rating Distribution</Text>
      <View style={styles.chart}>
        {entries.map(({ rating, count }) => (
          <View key={rating} style={styles.barGroup}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${(count / maxCount) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.label}>{rating}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.sm },
  header: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chart: { flexDirection: 'row', height: 48, gap: 4, alignItems: 'flex-end' },
  barGroup: { flex: 1, alignItems: 'center', gap: 2 },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    minHeight: 2,
  },
  label: { ...typography.caption, fontSize: 9, color: colors.textTertiary },
});
```

- [ ] **Step 5: Create VenueHero**

Create `mobile/src/components/venue-community/VenueHero.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Venue, VenueStats } from '../../types';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Props {
  venue: Venue;
  stats: VenueStats | null;
}

export function VenueHero({ venue, stats }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{venue.name}</Text>
      {venue.address && (
        <View style={styles.row}>
          <MaterialIcons name="place" size={14} color={colors.textTertiary} />
          <Text style={styles.address}>{venue.address}</Text>
        </View>
      )}
      {stats && (
        <View style={styles.statsRow}>
          {stats.avgRating !== null && (
            <View style={styles.stat}>
              <MaterialIcons name="star" size={16} color={colors.ratingActive} />
              <Text style={styles.statValue}>{stats.avgRating}</Text>
            </View>
          )}
          <View style={styles.stat}>
            <MaterialIcons name="description" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{stats.totalNotes} notes</Text>
          </View>
          <View style={styles.stat}>
            <MaterialIcons name="people" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{stats.totalGourmets} gourmets</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.xs },
  name: { ...typography.h1, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
});
```

- [ ] **Step 6: Create VenueCommunityScreen**

Create `mobile/src/screens/map/VenueCommunityScreen.tsx`:

```tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { venuesApi, venueCommunityApi } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { VenueHero } from '../../components/venue-community/VenueHero';
import { RatingDistribution } from '../../components/venue-community/RatingDistribution';
import { TopGourmetsRow } from '../../components/venue-community/TopGourmetsRow';
import { NoteTierBadge } from '../../components/venue-community/NoteTierBadge';
import { SearchStackParamList } from '../../navigation/types';
import { Note, NoteType, SocialNote } from '../../types';
import { useUIStore } from '../../store/ui.store';
import { colors, typography, spacing, borderRadius } from '../../theme';

type RouteType = RouteProp<SearchStackParamList, 'VenueNotes'>;
type NavProp = NativeStackNavigationProp<SearchStackParamList>;

const NOTE_TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  RESTAURANT: 'restaurant',
  WINE: 'wine-bar',
  SPIRIT: 'local-bar',
  WINERY_VISIT: 'storefront',
};

export function VenueCommunityScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const openNoteCreation = useUIStore((s) => s.openNoteCreation);
  const { venueId, venueName } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: venueName });
  }, [navigation, venueName]);

  // Parallel data fetches
  const venueQuery = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => venuesApi.get(venueId),
  });

  const statsQuery = useQuery({
    queryKey: ['venueStats', venueId],
    queryFn: () => venueCommunityApi.getStats(venueId),
  });

  const gourmetsQuery = useQuery({
    queryKey: ['venueGourmets', venueId],
    queryFn: () => venueCommunityApi.getGourmets(venueId, 5),
  });

  const notesQuery = useInfiniteQuery({
    queryKey: ['venueNotes', venueId],
    queryFn: ({ pageParam }) =>
      venueCommunityApi.getNotes(venueId, pageParam, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allNotes = notesQuery.data?.pages.flatMap((p) => p.items) ?? [];

  if (venueQuery.isLoading) return <LoadingSpinner />;

  const venue = venueQuery.data;

  const renderHeader = () => (
    <View>
      {venue && <VenueHero venue={venue} stats={statsQuery.data ?? null} />}

      {statsQuery.data && statsQuery.data.totalNotes > 0 && (
        <RatingDistribution distribution={statsQuery.data.ratingDistribution} />
      )}

      <TopGourmetsRow
        gourmets={gourmetsQuery.data ?? []}
        onGourmetPress={(userId) => navigation.navigate('UserProfile', { userId })}
      />

      {allNotes.length > 0 && (
        <Text style={styles.sectionHeader}>Community Notes</Text>
      )}
    </View>
  );

  const renderNote = ({ item }: { item: SocialNote & { tier: number } }) => {
    const icon = NOTE_TYPE_ICONS[item.type] ?? 'description';
    const ext = item.extension as Record<string, any>;
    const subtitle =
      item.type === NoteType.RESTAURANT ? ext?.dishName :
      item.type === NoteType.WINE ? ext?.wineName :
      item.type === NoteType.SPIRIT ? ext?.spiritName : null;

    return (
      <TouchableOpacity
        style={styles.noteCard}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.noteTop}>
          {(item as SocialNote).author && (
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => navigation.navigate('UserProfile', { userId: (item as SocialNote).author!.id })}
            >
              <View style={styles.authorAvatar}>
                <MaterialIcons name="person" size={14} color={colors.textTertiary} />
              </View>
              <Text style={styles.authorName}>{(item as SocialNote).author!.displayName}</Text>
            </TouchableOpacity>
          )}
          <NoteTierBadge tier={item.tier} />
        </View>
        <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        {subtitle && <Text style={styles.noteSubtitle} numberOfLines={1}>{subtitle}</Text>}
        <View style={styles.noteMeta}>
          <MaterialIcons name="star" size={12} color={colors.ratingActive} />
          <Text style={styles.noteRating}>{item.rating}/10</Text>
          <Text style={styles.noteDate}>
            {format(new Date(item.experiencedAt), 'MMM d, yyyy')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={allNotes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (notesQuery.hasNextPage && !notesQuery.isFetchingNextPage) {
            notesQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          notesQuery.isFetchingNextPage ? (
            <ActivityIndicator style={{ padding: spacing.md }} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          !notesQuery.isLoading ? (
            <EmptyState
              title="No notes yet"
              description="Be the first to review this venue!"
            />
          ) : null
        }
      />
      {venue && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            openNoteCreation({
              placeId: venue.placeId,
              name: venue.name,
              address: venue.address ?? undefined,
              coordinate:
                venue.lat != null && venue.lng != null
                  ? { latitude: venue.lat, longitude: venue.lng }
                  : undefined,
            })
          }
        >
          <MaterialIcons name="edit" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 80 },
  sectionHeader: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  noteCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  noteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  noteTitle: { ...typography.label, color: colors.text },
  noteSubtitle: { ...typography.caption, color: colors.textSecondary },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  noteRating: { ...typography.caption, color: colors.text, fontWeight: '600' },
  noteDate: { ...typography.caption, color: colors.textTertiary, marginLeft: spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
```

- [ ] **Step 7: Update SearchStackNavigator**

In `mobile/src/navigation/SearchStackNavigator.tsx`:

Replace import:
```ts
// Remove: import { VenueNotesScreen } from '../screens/map/VenueNotesScreen';
import { VenueCommunityScreen } from '../screens/map/VenueCommunityScreen';
```

Replace the screen registration:
```tsx
<Stack.Screen
  name="VenueNotes"
  component={VenueCommunityScreen}
  options={{ title: 'Venue' }}
/>
```

- [ ] **Step 8: Delete VenueNotesScreen**

```bash
rm mobile/src/screens/map/VenueNotesScreen.tsx
```

- [ ] **Step 9: Typecheck**

```bash
cd mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add mobile/src/components/venue-community/ mobile/src/screens/map/VenueCommunityScreen.tsx mobile/src/navigation/SearchStackNavigator.tsx
git rm mobile/src/screens/map/VenueNotesScreen.tsx
git commit -m "feat: add VenueCommunityScreen with hero, stats, gourmets, and notes (mobile)"
```

---

## Task 11: Mobile Entry Points (Map + Note Detail)

**Files:**
- Modify: `mobile/src/screens/home/NoteDetailScreen.tsx:119-124`

- [ ] **Step 1: Make venue name tappable in NoteDetailScreen**

In `mobile/src/screens/home/NoteDetailScreen.tsx`, change lines 119-124 from:

```tsx
{note.venue && (
  <View style={styles.meta}>
    <MaterialIcons name="place" size={14} color={colors.textTertiary} />
    <Text style={styles.metaText}>{note.venue.name}</Text>
  </View>
)}
```

To:

```tsx
{note.venue && (
  <TouchableOpacity
    style={styles.meta}
    onPress={() => navigation.navigate('VenueNotes' as any, {
      venueId: note.venue!.id,
      venueName: note.venue!.name,
    })}
  >
    <MaterialIcons name="place" size={14} color={colors.primary} />
    <Text style={[styles.metaText, { color: colors.primary }]}>{note.venue.name}</Text>
    <MaterialIcons name="chevron-right" size={14} color={colors.primary} />
  </TouchableOpacity>
)}
```

The `as any` cast is needed because `NoteDetailScreen` is used in multiple stack navigators (Home, Binders, Search). Only Search has `VenueNotes`. For Home and Binders, the navigation will be a no-op if the route doesn't exist, which is acceptable for now — the venue community screen is reachable from Search tab. We can add VenueNotes to other stacks later.

- [ ] **Step 2: Typecheck**

```bash
cd mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/home/NoteDetailScreen.tsx
git commit -m "feat: make venue name tappable in note detail, links to venue community (mobile)"
```

---

## Task 12: Web VisibilitySelector + Note Form Update

**Files:**
- Create: `web/src/components/forms/visibility-selector.tsx`
- Modify: `web/src/components/note-form-layout.tsx:162-171` (or wherever the Switch lives)

- [ ] **Step 1: Create web VisibilitySelector**

Create `web/src/components/forms/visibility-selector.tsx`:

```tsx
'use client';

import { Visibility } from '@mygourmetdiary/shared-types';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: Visibility.PRIVATE, label: 'Private', hint: 'Only you can see this note' },
  { value: Visibility.FRIENDS, label: 'Friends', hint: 'Your pinned Gourmet Friends can see this note' },
  { value: Visibility.PUBLIC, label: 'Public', hint: 'Anyone can discover this note' },
];

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const selectedOption = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Visibility</label>
      <div className="flex rounded-lg border border-border overflow-hidden" role="radiogroup">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              value === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground hover:bg-surface-elevated',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{selectedOption.hint}</p>
    </div>
  );
}
```

- [ ] **Step 2: Replace Switch in note form layout**

In the web note creation form (check exact file path — likely `web/src/components/note-form-layout.tsx` around lines 162-171), replace the Switch block with:

```tsx
<VisibilitySelector
  value={formData.visibility}
  onChange={(v) => updateField('visibility', v)}
/>
```

Add the import:

```ts
import { VisibilitySelector } from './forms/visibility-selector';
```

Remove the now-unused `Switch` import and `Label` used only for the visibility toggle.

- [ ] **Step 3: Typecheck**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/forms/visibility-selector.tsx web/src/components/note-form-layout.tsx
git commit -m "feat: add VisibilitySelector with FRIENDS option to note forms (web)"
```

---

## Task 13: Web Venue Community Page

**Files:**
- Create: `web/src/app/(app)/venues/[placeId]/page.tsx`
- Create: `web/src/components/venue-community/venue-community-view.tsx`
- Create: `web/src/components/venue-community/venue-hero.tsx`
- Create: `web/src/components/venue-community/venue-stats-bar.tsx`
- Create: `web/src/components/venue-community/top-gourmets-list.tsx`
- Create: `web/src/components/venue-community/gourmet-card.tsx`
- Create: `web/src/components/venue-community/note-tier-badge.tsx`
- Create: `web/src/components/venue-community/write-note-fab.tsx`

This task creates the web venue community page. Follow the responsive layout from the spec: two-column on desktop (>=1024px), stacked on mobile. Use the same data fetching pattern as mobile (React Query parallel fetches per section).

Each component mirrors the mobile version but uses Tailwind CSS and shadcn conventions.

- [ ] **Step 1: Create all web components**

Create each file following the layout from the spec Section 8. Key details:
- `page.tsx` — server component that renders `VenueCommunityView`
- `venue-community-view.tsx` — client component with React Query fetches for venue, stats, gourmets, notes (each with independent loading states)
- `venue-hero.tsx` — venue name, address, stat badges
- `venue-stats-bar.tsx` — horizontal bar chart with Tailwind (no chart library)
- `top-gourmets-list.tsx` — horizontal scroll on mobile, vertical sidebar on desktop
- `gourmet-card.tsx` — avatar, name, tier badge, link to profile
- `note-tier-badge.tsx` — small colored badge (Friend / Match %)
- `write-note-fab.tsx` — fixed bottom-right button linking to note creation

Use the same `venueCommunityApi` from `@/lib/api` that was wired in Task 8.

- [ ] **Step 2: Typecheck**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/\(app\)/venues/ web/src/components/venue-community/
git commit -m "feat: add venue community page with hero, stats, gourmets, and notes (web)"
```

---

## Task 14: Web Entry Points (Map Preview + Note Detail)

**Files:**
- Modify: `web/src/components/map/venue-preview-panel.tsx:165-170,228-233`
- Modify: `web/src/app/(app)/notes/[noteId]/page.tsx`

- [ ] **Step 1: Update map preview panel "View Notes" links**

In `web/src/components/map/venue-preview-panel.tsx`, change the desktop "View Notes" link (lines 165-170):

From:
```tsx
href={`/search?q=${encodeURIComponent(venue.name)}`}
```
To:
```tsx
href={`/venues/${venue.placeId}`}
```

Same change for the mobile bottom panel (lines 228-233).

- [ ] **Step 2: Make venue name a link in note detail page**

In `web/src/app/(app)/notes/[noteId]/page.tsx`, find where the venue name is rendered and wrap it in a `<Link>`:

```tsx
import Link from 'next/link';

// Where venue name is shown:
{note.venue && (
  <Link
    href={`/venues/${note.venue.placeId}`}
    className="flex items-center gap-1 text-primary hover:underline"
  >
    <MapPin className="h-4 w-4" />
    {note.venue.name}
  </Link>
)}
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/map/venue-preview-panel.tsx web/src/app/\(app\)/notes/
git commit -m "feat: link map preview and note detail to venue community page (web)"
```

---

## Task 15: Run Full Test Suite + Typecheck

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
cd web && npx vitest run
```

Expected: All tests pass (existing + new from Tasks 3, 4, 5, 6).

- [ ] **Step 2: Typecheck both workspaces**

```bash
cd web && npx tsc --noEmit && cd ../mobile && npx tsc --noEmit
```

Expected: No errors in either.

- [ ] **Step 3: Run web build**

```bash
cd web && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Push all changes**

```bash
git push origin main
```

- [ ] **Step 5: Monitor CI**

```bash
gh run list --limit 1
```

Expected: All CI jobs pass.
