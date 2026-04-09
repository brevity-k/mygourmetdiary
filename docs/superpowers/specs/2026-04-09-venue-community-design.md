# Venue Community Page — Design Spec

> **Date:** 2026-04-09
> **Status:** Approved
> **Scope:** Venue-level social layer with FRIENDS visibility, for mobile (React Native) and web (Next.js)

---

## 1. Problem

The app lacks a dedicated social surface for venues. Users can browse notes in feeds and on the map, but there's no single page that aggregates community activity at a specific venue, surfaces taste-matched gourmets who've been there, or enables friend discovery through shared dining experiences.

Additionally, notes today are either PUBLIC (visible to everyone) or PRIVATE (visible to author only). There's no middle ground for sharing privately with trusted friends.

## 2. Design Principles

1. **No comments on notes. Ever.** Social interaction is through structured signals (Bookmark/Echo/Diverge) and venue-level discovery — not open-ended discussion on individual notes.
2. **Personal space and social space are separate.** Notes are the diary (personal). The venue community page is the social hub. A note may appear on both surfaces, but the diary is sacred.
3. **Discovery funnel:** venue page -> see notes -> visit profile -> check taste match -> pin friend. The venue community page is where people connect.

## 3. Scope

### In scope

- Venue community page (mobile + web) with hero, stats, top gourmets, own notes, and community notes
- `FRIENDS` visibility enum value for notes
- Four backend endpoints with independent caching (Approach 2 — scalable)
- Tiered gourmet ranking (friends -> TSS -> volume)
- Three-way visibility selector in all note creation forms
- Entry points from map markers and note detail venue links

### Out of scope

- Product community pages (wines, spirits, dishes) — deferred until beverage reference DB
- Per-friend note sharing (only "all pinned friends" granularity)
- Comment threads on notes — explicitly never
- SEO for venue pages — auth-gated today, future concern
- Search results linking to venue pages — second iteration
- Venue photos — no ingestion pipeline exists
- Stats denormalization on Venue table — deferred optimization
- Push notifications for FRIENDS notes — deferred
- Component tests — no existing infrastructure

## 4. Architecture

### Four endpoints, parallel client fetches

```
Client (Mobile / Web)
  venueCommunityApi.getCommunity(venueId)
    parallel fetches, returns composed VenueCommunity object
        |          |              |              |
        v          v              v              v
  GET /venues/   GET /venues/   GET /venues/   GET /venues/
  :placeId       :id/stats      :id/gourmets   :id/notes
  (exists)       (NEW)          (NEW)          (NEW, replaces
                                                explore/venue)
```

### Redis cache TTLs (heterogeneous)

| Endpoint | Cache key pattern | TTL | User-specific |
|----------|------------------|-----|---------------|
| Venue details | `venue:<placeId>` | 24h | No |
| Stats | `venue-stats:<venueId>` | 5 min | No |
| Gourmets | `venue-gourmets:<venueId>:<viewerId>` | 5 min | Yes |
| Notes | `venue-notes:<venueId>:<viewerId>:<cursor>` | 60s | Yes |

### Service decomposition

- `venuesService` (exists) — handles `getByPlaceId` with Google Places upsert
- `venueStatsService` (new) — pure aggregate queries, no user-specific data
- `venueGourmetsService` (new) — tiered ranking using TSS + pinned friends
- `notesService.getByVenue` (new) — refactored from `areaExplorerService.getVenueNotes`, paginated, tier-tagged

### Cache invalidation

- Stats and notes caches invalidated on note create/update/delete at a venue via centralized `invalidateVenueCache(venueId)` helper
- Gourmets cache is time-based only (5min TTL) since TSS is batch-computed nightly

## 5. Data Model Changes

### Add `FRIENDS` to Visibility enum

```prisma
enum Visibility {
  PUBLIC
  PRIVATE
  FRIENDS   // NEW — visible to author + users the author has pinned
}
```

Backward-compatible. Existing notes keep their current visibility values. No data migration needed.

### New index

```prisma
model GourmetFriendPin {
  // existing unique constraint: @@unique([pinnerId, pinnedId])
  @@index([pinnedId])  // NEW — enables "who pinned this user" lookups for FRIENDS visibility
}
```

### Visibility semantics

A `FRIENDS` note is visible to:
- The author (always)
- Users that the **author has pinned** as Gourmet Friends (via `GourmetFriendPin`)

This reuses the existing pinning infrastructure. No new tables.

### Visibility filter (reusable helper)

```ts
function buildVisibilityFilter(viewerId: string) {
  return {
    OR: [
      { visibility: 'PUBLIC' },
      { authorId: viewerId },
      {
        visibility: 'FRIENDS',
        author: {
          pinnedFriends: {
            some: { pinnedId: viewerId }
          }
        }
      }
    ]
  };
}
```

### FRIENDS notes and public stats

**FRIENDS notes do NOT contribute to public aggregate stats.** Stats queries continue to filter `WHERE visibility = 'PUBLIC'` only. This keeps stats user-independent and cacheable per-venue (not per-venue-per-viewer).

Friends see FRIENDS notes in the notes feed directly, but the aggregate numbers are always the public-only view.

## 6. API Contracts

### 6.1 `GET /api/v1/venues/:placeId` (existing, unchanged)

Returns venue details. Cache: 24h.

### 6.2 `GET /api/v1/venues/:venueId/stats` (NEW)

```ts
// Response
{
  venueId: string;
  totalNotes: number;           // PUBLIC notes only
  totalGourmets: number;        // distinct authors with PUBLIC notes
  avgRating: number | null;
  ratingDistribution: Record<'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10', number>;
}
```

Cache: 5min, keyed by `venue-stats:<venueId>`. User-independent.

### 6.3 `GET /api/v1/venues/:venueId/gourmets` (NEW)

Query params: `limit` (optional, default 5, max 20).

```ts
// Response
Array<{
  user: PublicUser;
  tier: 1 | 2 | 3;              // 1=pinned friend, 2=high TSS (>=0.7), 3=volume
  noteCount: number;             // visible-to-viewer notes at this venue
  tasteSimilarity: TasteSimilarity[] | null;
  isPinned: boolean;
}>
```

Ranking: Tier 1 (pinned friends, sorted by TSS desc) -> Tier 2 (TSS >= 0.7, sorted by max TSS) -> Tier 3 (remaining, sorted by note count desc). Stop at limit.

Cache: 5min, keyed by `venue-gourmets:<venueId>:<viewerId>`. Per-viewer.

### 6.4 `GET /api/v1/venues/:venueId/notes` (NEW)

Query params: `cursor` (optional ISO date), `limit` (optional, default 20, max 50).

```ts
// Response
{
  items: Array<SocialNote & { tier: 1 | 2 | 3 | 4 }>;
  nextCursor: string | null;
  hasMore: boolean;
}
```

Visibility: PUBLIC + own + FRIENDS (where author pinned viewer). Tier per note based on author's tier. Sorted by tier asc, createdAt desc within tier.

The old `/api/v1/explore/venue/:venueId/notes` endpoint becomes a thin wrapper delegating to this service for backward compatibility.

Cache: 60s, keyed by `venue-notes:<venueId>:<viewerId>:<cursor>`. Per-viewer.

### 6.5 Client API wrapper

**ID resolution:** The venue detail endpoint uses `placeId` (Google Places identifier), while stats/gourmets/notes use the internal `venueId` (cuid). The client resolves the venue first to get the internal ID, then fires the three venueId-based calls in parallel. This adds a sequential step (venue fetch → parallel fetches), but the venue response is cached for 24h so it's a near-instant cache hit after the first load.

```ts
// packages/shared-api/src/endpoints.ts
export function createVenueCommunityApi(client: AxiosInstance) {
  return {
    getStats: (venueId: string) =>
      client.get<ApiResponse<VenueStats>>(`/venues/${venueId}/stats`)
        .then(r => r.data.data),
    getGourmets: (venueId: string, limit?: number) =>
      client.get<ApiResponse<VenueGourmet[]>>(`/venues/${venueId}/gourmets`, { params: { limit } })
        .then(r => r.data.data),
    getNotes: (venueId: string, cursor?: string, limit?: number) =>
      client.get<ApiResponse<PaginatedResponse<SocialNote & { tier: number }>>>(`/venues/${venueId}/notes`, { params: { cursor, limit } })
        .then(r => r.data.data),
  };
}
```

### 6.6 Shared types

```ts
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
  notes: { items: (SocialNote & { tier: number })[]; nextCursor: string | null; hasMore: boolean };
}
```

### 6.7 Error handling

All endpoints: 400 (invalid params), 401 (unauthenticated), 404 (venue not found), 500 (internal). Client wrapper handles partial failures — each section renders independently.

## 7. Mobile UI

### Screen: `VenueCommunityScreen` (replaces `VenueNotesScreen`)

Route: `VenueNotes` in `SearchStackParamList` (same route name, same params `{ venueId, venueName }`).

Full-screen pushed route from both entry points (map marker and note detail).

### Layout (top to bottom)

1. **Hero** — venue name, address, stat badges (avg rating, note count, gourmet count)
2. **Rating distribution** — horizontal bar chart (1-10), built with native Views, no chart library
3. **Top Gourmets** — horizontal FlatList of up to 5 gourmet cards. Each card: avatar, name, tier badge. Tap -> `UserProfileScreen`. Hidden if no gourmets.
4. **My Notes** — own notes at this venue (private + friends + public). Hidden if none. Tap -> `NoteDetailScreen`.
5. **Community Notes** — paginated list of visible-to-viewer notes with author cards and tier badges. Infinite scroll via cursor pagination. Tap -> `NoteDetailScreen`.
6. **Write Note FAB** — bottom-right floating button, pre-fills venue.

### Visibility selector (all note forms)

Replace the current Public/Private `Switch` with a three-option segmented control:

```
┌──────────┬──────────┬──────────┐
│  Private │  Friends │  Public  │
└──────────┴──────────┴──────────┘
```

Helper text below the selector:
- Private: "Only you can see this note"
- Friends: "Your pinned Gourmet Friends can see this note"
- Public: "Anyone can discover this note"

New component: `mobile/src/components/forms/VisibilitySelector.tsx`.

Applied to all 4 form screens: Restaurant, Wine, Spirit, WineryVisit.

### Loading and error states

Progressive rendering: each section renders as its query resolves. Failed sections show inline error with retry. Skeleton shimmers during loading.

### Files

**New:**
- `mobile/src/screens/map/VenueCommunityScreen.tsx`
- `mobile/src/components/venue-community/VenueHero.tsx`
- `mobile/src/components/venue-community/RatingDistribution.tsx`
- `mobile/src/components/venue-community/TopGourmetsRow.tsx`
- `mobile/src/components/venue-community/GourmetCard.tsx`
- `mobile/src/components/venue-community/NoteTierBadge.tsx`
- `mobile/src/components/forms/VisibilitySelector.tsx`

**Modified:**
- `mobile/src/navigation/SearchStackNavigator.tsx` — swap import
- `mobile/src/screens/note-creation/RestaurantNoteFormScreen.tsx` — visibility selector
- `mobile/src/screens/note-creation/WineNoteFormScreen.tsx` — visibility selector
- `mobile/src/screens/note-creation/SpiritNoteFormScreen.tsx` — visibility selector
- `mobile/src/screens/note-creation/WineryVisitNoteFormScreen.tsx` — visibility selector
- `mobile/src/api/endpoints.ts` — add `venueCommunityApi`
- `mobile/src/types/index.ts` — consume new shared types

**Deleted:**
- `mobile/src/screens/map/VenueNotesScreen.tsx` — replaced

## 8. Web UI

### Route: `/venues/[placeId]`

New page at `web/src/app/(app)/venues/[placeId]/page.tsx`.

### Layout

**Desktop (>=1024px):** Two-column grid.
- Left (main): hero (full width above columns) + community notes feed
- Right (sticky sidebar): top gourmets list + rating distribution + my notes

**Mobile (<1024px):** Stacked, mirrors mobile app: hero -> gourmets row (horizontal scroll) -> distribution -> my notes -> community notes.

### Components

**New:**
- `web/src/app/(app)/venues/[placeId]/page.tsx`
- `web/src/components/venue-community/venue-community-view.tsx`
- `web/src/components/venue-community/venue-hero.tsx`
- `web/src/components/venue-community/venue-stats-bar.tsx`
- `web/src/components/venue-community/top-gourmets-list.tsx`
- `web/src/components/venue-community/gourmet-card.tsx`
- `web/src/components/venue-community/note-tier-badge.tsx`
- `web/src/components/venue-community/write-note-fab.tsx`
- `web/src/components/forms/visibility-selector.tsx`

**Modified:**
- `web/src/lib/api.ts` — export `venueCommunityApi`
- `web/src/components/map/venue-preview-panel.tsx` — "View Notes" links to `/venues/<placeId>`
- Note detail page — venue name becomes `<Link>` to `/venues/<placeId>`
- Note creation forms — swap visibility Switch for VisibilitySelector

### Data fetching

Client-side via React Query, same pattern as mobile. Four parallel queries: venue (existing), stats, gourmets, notes. Each section renders independently with its own loading/error state.

### Entry points

1. Map: "View Notes" button in `VenuePreviewPanel` and `VenuePreviewBottomPanel` links to `/venues/<placeId>` (replacing the current search link)
2. Note detail: venue name rendered as a `<Link>` to `/venues/<placeId>`

## 9. Testing

### Backend unit tests

1. `venue-stats.service.test.ts` — aggregate accuracy, FRIENDS exclusion, edge cases
2. `venue-gourmets.service.test.ts` — tier ranking, limit, fallback, visibility awareness
3. `notes.service.getByVenue.test.ts` — visibility filter (PUBLIC/PRIVATE/FRIENDS), pagination, tier assignment, sort order
4. `visibility-filter.test.ts` — reusable helper correctness for all three visibility states

### Route integration tests

5. `venues/[venueId]/stats/route.test.ts` — auth, params, 404, happy path
6. `venues/[venueId]/gourmets/route.test.ts` — auth, params, 404, happy path
7. `venues/[venueId]/notes/route.test.ts` — auth, params, 404, happy path

### Manual QA

Checklist covering both mobile simulator and web browser: hero rendering, stats accuracy, gourmet ranking, note visibility (PUBLIC/PRIVATE/FRIENDS), pagination, partial failure resilience, visibility selector in note creation, entry points from map and note detail.

## 10. Rollout

### Deployment order

1. **Schema migration** — add `FRIENDS` enum value + `@@index([pinnedId])`. Zero-downtime (additive enum, concurrent index).
2. **Backend services + endpoints** — deploy new services and route handlers. Old endpoints unaffected.
3. **Shared types + API client** — publish `VenueCommunity` types and `venueCommunityApi`.
4. **Web UI** — deploy new route, updated links, visibility selector.
5. **Mobile UI** — ship build with `VenueCommunityScreen` and visibility selector.

Each step independently rollback-safe. No feature flag needed (new feature, no existing behavior change).

## 11. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gourmet ranking query slow at scale | Medium | 5min cache per (venue, viewer). Indexes cover the join path. Materialized view if p95 > 500ms. |
| FRIENDS visibility subquery slow | Medium | New `@@index([pinnedId])`. Can pre-fetch "authors who pinned me" set if needed. |
| Cache invalidation incomplete | Medium | Centralized `invalidateVenueCache(venueId)` helper. Unit test verifying all key patterns deleted. |
| Users confused by pinning side effect | Low | Explanatory text next to pin action and Friends visibility option. |
| Pinning conflates discovery + privacy grant | Low | Documented limitation. Add "close friends" sublist if it becomes a real ask. |
| Redis unavailable | Low | Existing helpers fall through to Postgres. Acceptable at current scale. |
