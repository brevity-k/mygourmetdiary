# Community Pages — Unified Design Spec

> **Date:** 2026-04-09
> **Status:** Approved (replaces venue-community-design.md)
> **Scope:** Venue + product community pages with FRIENDS visibility, for mobile and web

---

## 1. Problem

The app needs social surfaces where users discover taste-matched gourmets. But socializing behavior differs by category:

- **Restaurants** — social happens around a physical venue (map-based)
- **Wines** — social happens around a winery (venue) AND around a specific bottle (product, like Vivino)
- **Spirits/Sake/Beer** — social happens around a distillery/brewery (venue) AND around a specific bottle (product)

A venue-only community page would leave wine/spirit/sake/beer notes without a social surface. The design must handle both entity types from the start.

Additionally, notes are either PUBLIC or PRIVATE today. Users need a middle ground: sharing privately with trusted friends without making notes fully public.

## 2. Design Principles

1. **No comments on notes. Ever.** Social is through structured signals and community-level discovery.
2. **Personal space and social space are separate.** Notes are the diary. Community pages are the social hub.
3. **Discovery funnel:** community page -> see notes -> visit profile -> check taste match -> pin friend.

## 3. Scope

### In scope

- Community pages for venues AND products (shared component pattern)
- `Product` model (community-contributed, LWIN enrichment later)
- `FRIENDS` visibility enum (author's pinned friends can see)
- Unified community endpoints parameterized by subject type
- `ProductSearchInput` for wine/spirit note creation (type-ahead + create)
- Three-way visibility selector in all note forms
- Entry points: map (venue), note detail (venue + product)

### Out of scope

- LWIN/Kaggle seed import, barcode scanner
- SAKE/BEER note types (use SPIRIT for now, ProductCategory distinguishes)
- Comment threads on notes — explicitly never
- SEO for community pages, push notifications for FRIENDS notes
- Component tests, venue photos

## 4. Data Model

### New: Product model

```prisma
enum ProductCategory {
  WINE
  SPIRIT
  SAKE
  BEER
}

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

### Modified: Note model

```prisma
model Note {
  // existing fields...
  venueId    String?  @map("venue_id")
  productId  String?  @map("product_id")  // NEW

  venue      Venue?    @relation(...)
  product    Product?  @relation(fields: [productId], references: [id])  // NEW

  @@index([productId])  // NEW
}
```

A note can link to a venue, a product, both, or neither:

| Note type | venueId | productId | Example |
|-----------|---------|-----------|---------|
| RESTAURANT | required | null | "Spicy Tuna Roll at Sushi Gen" |
| WINE | optional | optional | "Opus One 2018 at dinner" or just "Opus One 2018" |
| SPIRIT | optional | optional | "Yamazaki 12 neat at a bar" |
| WINERY_VISIT | required | optional | "Tasting flight — Opus One 2018 was the standout" |

### Modified: Visibility enum

```prisma
enum Visibility {
  PUBLIC
  PRIVATE
  FRIENDS   // NEW — visible to author + users the author has pinned
}
```

FRIENDS notes do NOT contribute to public aggregate stats.

### Visibility filter (reusable helper)

```ts
function buildVisibilityFilter(viewerId: string) {
  return {
    OR: [
      { visibility: 'PUBLIC' },
      { authorId: viewerId },
      {
        visibility: 'FRIENDS',
        author: { pinnedFriends: { some: { pinnedId: viewerId } } },
      },
    ],
  };
}
```

### Shared abstraction: SubjectFilter

```ts
type CommunitySubjectType = 'venue' | 'product';

interface SubjectFilter {
  type: CommunitySubjectType;
  id: string;
  noteField: 'venueId' | 'productId';
}
```

One stats/gourmets/notes service parameterized by subject type. No code duplication.

### Existing index: `@@index([pinnedId])` on GourmetFriendPin already exists. No new index needed.

## 5. API Contracts

### Community endpoints (unified, parameterized)

| Endpoint | Cache TTL | User-specific |
|----------|-----------|---------------|
| `GET /community/:subjectType/:subjectId/stats` | 5min | No |
| `GET /community/:subjectType/:subjectId/gourmets?limit=5` | 5min | Yes |
| `GET /community/:subjectType/:subjectId/notes?cursor=&limit=20` | 60s | Yes |

`subjectType` is `venue` or `product`. `subjectId` is the internal cuid.

### Stats response

```ts
{
  subjectType: 'venue' | 'product';
  subjectId: string;
  totalNotes: number;
  totalGourmets: number;
  avgRating: number | null;
  ratingDistribution: Record<string, number>;  // keys "1" through "10"
}
```

Stats count only PUBLIC notes (FRIENDS excluded).

### Gourmets response

```ts
Array<{
  user: PublicUser;
  tier: 1 | 2 | 3;  // 1=pinned friend, 2=TSS>=0.7, 3=volume
  noteCount: number;
  tasteSimilarity: TasteSimilarity[] | null;
  isPinned: boolean;
}>
```

Ranking: Tier 1 (friends, sorted by TSS desc) -> Tier 2 (high TSS, sorted by max TSS) -> Tier 3 (remaining, sorted by note count desc).

### Notes response

```ts
{
  items: Array<SocialNote & { tier: 1 | 2 | 3 | 4 }>;
  nextCursor: string | null;
  hasMore: boolean;
}
```

Visibility: PUBLIC + own + FRIENDS (where author pinned viewer). Sorted by tier asc, createdAt desc within tier.

### Product endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /products/:productId` | Product details |
| `POST /products/search` | Type-ahead search (body: `{ query, category? }`) |
| `POST /products` | Create new product |

### Existing venue endpoint

`GET /venues/:placeId` — unchanged, already exists.

### Client API wrappers

```ts
createCommunityApi(client)    // getStats, getGourmets, getNotes
createProductsApi(client)     // search, create, get
```

### Shared types

```ts
export type CommunitySubjectType = 'venue' | 'product';

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
```

### Error handling

All endpoints: 400 (invalid params/subjectType), 401 (unauthenticated), 404 (subject not found), 500 (internal). Client handles partial failure — each section renders independently.

### Cache invalidation

Centralized `invalidateCommunityCache(subjectType, subjectId)` called from note create/update/delete. Clears stats (user-independent key) + SCAN-deletes gourmets and notes keys (user-specific pattern).

## 6. Mobile UI

### Screens

**`VenueCommunityScreen`** — thin wrapper: resolves venue, renders `<CommunityView subjectType="venue" />`.

**`ProductCommunityScreen`** — thin wrapper: resolves product, renders `<CommunityView subjectType="product" />`.

### Shared CommunityView layout (top to bottom)

1. **Hero** — venue variant (name, address, map pin) OR product variant (name, producer, category badge, subType/vintage/region)
2. **Stats bar** — avg rating, note count, gourmet count
3. **Rating distribution** — horizontal bar chart (1-10), native Views, no chart library
4. **Top Gourmets** — horizontal FlatList, up to 5. Each card: avatar, name, tier badge. Tap -> UserProfileScreen.
5. **My Notes** — own notes at this subject. Hidden if none.
6. **Community Notes** — paginated, infinite scroll, tier badges, author cards. Tap -> NoteDetailScreen.
7. **Write Note FAB** — pre-fills venue/product context.

### ProductSearchInput

For wine/spirit note creation. Type-ahead against `productsApi.search()`. "Create new" fallback with inline mini-form (name, producer, subType, vintage). Category auto-set from note type.

### VisibilitySelector

Three-way segmented control: Private / Friends / Public. Helper text below. Replaces Switch in all 4 note form screens.

### Navigation

```ts
// SearchStackParamList additions:
VenueCommunity: { venueId: string; venueName: string };
ProductCommunity: { productId: string; productName: string };
```

### Entry points

- Map marker "View Community" -> VenueCommunityScreen
- Note detail venue name tap -> VenueCommunityScreen
- Note detail product name tap -> ProductCommunityScreen

### Files

**New:** `screens/community/VenueCommunityScreen.tsx`, `screens/community/ProductCommunityScreen.tsx`, `components/community/{CommunityView,VenueHero,ProductHero,RatingDistribution,TopGourmetsRow,GourmetCard,NoteTierBadge}.tsx`, `components/forms/{ProductSearchInput,VisibilitySelector}.tsx`

**Modified:** navigation types + navigator, note form screens (VisibilitySelector + ProductSearchInput), NoteDetailScreen (tappable venue/product names), AreaExplorerScreen (navigate to VenueCommunity), endpoints.ts (communityApi + productsApi)

**Deleted:** `screens/map/VenueNotesScreen.tsx`

## 7. Web UI

### Pages

- `/venues/[placeId]/page.tsx` — resolves venue, renders `<CommunityView subjectType="venue" />`
- `/products/[productId]/page.tsx` — resolves product, renders `<CommunityView subjectType="product" />`

### Layout

**Desktop (>=1024px):** Hero (full width) + two-column grid (notes feed left, sticky sidebar right: gourmets + distribution + my notes).

**Mobile (<1024px):** Stacked, mirrors mobile app order.

### Components

Same pattern as mobile: shared `community/` directory with `community-view.tsx`, `venue-hero.tsx`, `product-hero.tsx`, `rating-distribution.tsx`, `top-gourmets-list.tsx`, `gourmet-card.tsx`, `note-tier-badge.tsx`, `write-note-fab.tsx`. Plus `forms/product-search-input.tsx`, `forms/visibility-selector.tsx`.

### Entry points

- Map preview "View Notes" -> `/venues/<placeId>`
- Note detail venue name -> `<Link>` to `/venues/<placeId>`
- Note detail product name -> `<Link>` to `/products/<productId>`

## 8. Testing

### Backend unit tests (5)

1. `community-stats.service.test.ts` — aggregates, FRIENDS exclusion, both subject types
2. `community-gourmets.service.test.ts` — tier ranking, limit, fallback, both subject types
3. `community-notes.service.test.ts` — visibility filter, pagination, tier assignment, both subject types
4. `visibility-filter.test.ts` — all three visibility states
5. `products.service.test.ts` — search, create, validation

### Route integration tests (5)

6-8. Community routes (stats, gourmets, notes) — auth, params, 404, happy path
9-10. Product routes (search, create) — validation, shape

### Manual QA

Checklist covering mobile simulator + web browser: community pages for both venues and products, ProductSearchInput flow, visibility selector, gourmet ranking, pagination, partial failure, entry points.

## 9. Rollout

1. **Schema migration** — FRIENDS enum, ProductCategory enum, Product model, Note.productId. Single migration, zero-downtime.
2. **Backend services** — visibility filter, community services (parameterized), products service, cache invalidation.
3. **Shared types + API client** — new types, createCommunityApi, createProductsApi.
4. **Web UI** — both pages, shared components, ProductSearchInput, VisibilitySelector, entry point links.
5. **Mobile UI** — both screens, shared components, ProductSearchInput, VisibilitySelector, entry point navigation.

Each step independently rollback-safe.

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Product name duplicates | Medium | Fuzzy search before create. Normalize on save. Admin merge later with LWIN. |
| Existing wine/spirit notes have no productId | Medium | Notes still work. Users can edit to link. Optional batch match later. |
| FRIENDS visibility subquery | Medium | @@index([pinnedId]) exists. Pre-fetch if needed. |
| Product community sparse at launch | Medium | Pioneer system. "Be the first" CTA. Grows organically. |
| Sake/beer notes use NoteType.SPIRIT | Low | ProductCategory distinguishes. Add note types later. |
| Pinning conflates discovery + privacy grant | Low | Explanatory text on pin action and Friends selector. |
