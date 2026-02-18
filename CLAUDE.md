# MyGourmetDiary — Service Specification v1.0

> **Last updated:** 2026-02-17
> **Status:** Planning phase — pre-implementation

---

## 1. Product Vision

**Tagline:** "Secretly peeking into a gourmet's hidden notes."

**One-liner:** A cross-domain gourmet journal and taste-matching platform where users log detailed notes on restaurants, wines, and spirits — then discover trusted peers whose specific tastes provably align with theirs.

**Problem:** Current food/drink platforms force a false choice:
- **Beli / Yelp / Google Maps** — Restaurant-only. No beverages. Social signals are shallow (follow/unfollow) without verifiable taste alignment.
- **Vivino / Distiller** — Beverage-only. No restaurant integration. Community features are generic.
- **Savor** — Dish-level journaling, but private-first with minimal social recommendation.
- **All of the above** — Users must scatter their gourmet life across 4+ apps, losing the unified taste identity that would power genuinely useful recommendations.

**Solution:** One platform that spans restaurants, wines, and spirits with:
1. Structured, menu-item-level and bottle-level notes (not venue-level star ratings)
2. Category-specific taste matching ("I trust your whiskey picks but not your sushi picks")
3. A silent, diary-first aesthetic — no comment sections, no social noise
4. Validated "Gourmet Friend" relationships built on proven taste overlap

---

## 2. Core Differentiators (Why This Wins)

### 2.1 Cross-Domain Taste Identity
No existing app unifies restaurant dining, wine, spirits, and winery visits into a single taste profile. This is the foundational moat. A user who logs 50 restaurant visits, 30 wines, and 20 whiskeys builds a rich, multi-dimensional taste fingerprint that no single-vertical competitor can replicate.

### 2.2 Category-Specific Trust ("Binder" System)
Unlike Beli (one overall taste score) or Vivino (one wine preference), MyGourmetDiary lets users subscribe to specific **Binders** of another user's notes. You might follow someone's "Natural Wine" binder but ignore their "Fast Casual" binder. Trust is granular, not binary.

### 2.3 Silent Social Layer
No comments. No replies. No "great pic!" noise. Interaction is through structured signals:
- **Bookmarked** — "I want to try this"
- **Echoed** — "I tried this and my rating aligns" (strengthens taste-match score)
- **Diverged** — "I tried this but disagree" (weakens taste-match score in this category)

This is a deliberate anti-pattern to Instagram/Yelp social dynamics. The diary is sacred.

### 2.4 Validated Gourmet Friends (Not Just Followers)
A "Gourmet Friend" is not someone you know personally — it's someone whose documented ratings demonstrably overlap with yours in specific categories. The system calculates this. Users can then **pin** a Gourmet Friend to elevate their notes in search results, creating a personally curated panel of trusted tasters.

---

## 3. User Roles & Interactions

### 3.1 Gourmet (Any User Who Writes Notes)
- Creates structured notes (see Section 4)
- Organizes notes into Binders (category-based collections)
- Sets visibility: Public (discoverable) or Private (personal journal only)
- Receives "Bookmarked / Echoed / Diverged" signals from others

### 3.2 Peeker (Any User Who Reads Notes)
- Browses and searches notes by restaurant, dish, wine, spirit, or location
- Follows specific Binders from specific Gourmets
- Sends Taste Signals (Bookmarked, Echoed, Diverged)
- Receives recommendations based on Gourmet Friend network

### 3.3 Pioneer (Incentive Role)
- Users who contribute the first notes in under-covered areas
- Earn credits/recognition for filling geographic or category gaps (see Section 7.3)

**Note:** Every user is both Gourmet and Peeker. These are behaviors, not account types.

---

## 4. Core Features — Detailed Specification

### 4.1 Gourmet Notes (Content Creation)

All notes share a common structure with domain-specific extensions:

#### Common Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | text | Yes | User-written or auto-generated from venue+item |
| Date | date | Yes | When the experience occurred |
| Photos | image[] | No | Up to 10 photos per note |
| Overall Rating | 1-10 scale | Yes | Personal rating (not relative ranking) |
| Tasting Tags | tag[] | No | Structured flavor descriptors (see Tag Taxonomy) |
| Free-form Notes | rich text | No | Personal observations, markdown supported |
| Binder | reference | Yes | Which binder this note belongs to |
| Visibility | enum | Yes | Public or Private |

#### 4.1.1 Restaurant / Dish Notes
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Venue | venue reference | Yes | Linked to Google Places data |
| Dish Name | text | Yes | Specific menu item |
| Dish Category | enum | Yes | Appetizer, Main, Dessert, Side, etc. |
| Price Paid | currency | No | What the user actually paid |
| Cuisine Tags | tag[] | Auto | Auto-populated from venue, user-editable |
| Would Order Again | boolean | Yes | Simple binary signal |
| Portion Size | enum | No | Small / Adequate / Generous |

#### 4.1.2 Wine Notes
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Wine Name | text | Yes | Label name, ideally matched to external DB |
| Vintage | year | No | Production year |
| Grape/Varietal | tag[] | No | Auto-populated if matched externally |
| Region | text | No | Wine region |
| Type | enum | Yes | Red, White, Rose, Sparkling, Orange, Dessert |
| Nose | tag[] | No | Aroma descriptors |
| Palate | tag[] | No | Taste descriptors |
| Finish | enum | No | Short / Medium / Long |
| Price Paid | currency | No | |
| Pairing Notes | text | No | What food it paired well with |
| Purchase Context | enum | No | Restaurant, Wine Shop, Winery, Online |

#### 4.1.3 Spirit Notes (Whiskey, Sake, Tequila, etc.)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Spirit Name | text | Yes | Label name |
| Spirit Type | enum | Yes | Whiskey, Sake, Tequila, Rum, Gin, Brandy, Other |
| Sub-type | text | No | e.g., Bourbon, Junmai Daiginjo, Reposado |
| Distillery/Brewery | text | No | Producer name |
| Age Statement | text | No | e.g., "12 Year" |
| ABV | number | No | Alcohol percentage |
| Nose / Palate / Finish | tag[] | No | Same as wine |
| Serving Method | enum | No | Neat, On Rocks, Cocktail, Warm (for sake) |
| Price Paid | currency | No | |

#### 4.1.4 Winery / Distillery Visit Notes
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Venue | venue reference | Yes | Linked to Google Places |
| Visit Date | date | Yes | |
| Ambiance Rating | 1-10 | No | Physical space experience |
| Service Rating | 1-10 | No | Staff knowledge and hospitality |
| Tasting Flight Notes | note reference[] | No | Links to individual wine/spirit notes |
| Would Revisit | boolean | Yes | |
| Reservation Required | boolean | No | Helpful for others planning visits |

### 4.2 The Binder System

Binders are user-created, category-based collections of notes. They serve as the unit of subscription.

**Default Binders** (auto-created for new users):
- My Restaurant Notes
- My Wine Notes
- My Spirit Notes
- My Winery Visits

**Custom Binders** (user-created examples):
- "Tokyo Ramen Spots"
- "California Pinot Noirs Under $30"
- "Bourbon Trail Diary"
- "Date Night Restaurants"

**Binder Attributes:**
- Name, Description, Cover Photo
- Category tag (Restaurant, Wine, Spirit, Mixed)
- Visibility (Public / Private)
- Follower count (public binders)

**Subscription model:** Users follow specific Binders, not entire profiles. This enables granular taste alignment. When a user follows a Binder, new public notes in that Binder appear in their feed.

### 4.3 Taste Matching Engine

#### 4.3.1 Taste Similarity Score (TSS)

For any two users A and B, the system calculates a TSS per category:

```
TSS_category(A, B) = (1 / N) * SUM[ 1 - |rating_A(i) - rating_B(i)| / max_rating_diff ] * weight(i)
```

Where:
- `N` = number of overlapping rated items in that category
- `rating_A(i)`, `rating_B(i)` = user A and B's ratings for item i
- `max_rating_diff` = 9 (on a 1-10 scale)
- `weight(i)` = recency weight (more recent ratings count more)

**Minimum overlap threshold:** At least 5 overlapping ratings in a category before a TSS is calculated. Below this, the score shows "Insufficient data."

**Category-level scores** (not one global score):
- TSS_restaurant(A, B)
- TSS_wine(A, B)
- TSS_spirit(A, B)

#### 4.3.2 Gourmet Friend Designation

A user can **pin** another user as a "Gourmet Friend" if:
1. The TSS in at least one category is >= 0.7 (70% alignment), AND
2. There are at least 5 overlapping ratings in that category

Pinning is one-directional (A can pin B without B pinning A). Pinned Gourmet Friends get priority placement in all search results and recommendations.

**Echo/Diverge feedback loop:** When a user marks "Echoed" on a Gourmet Friend's note (tried it, rating is within 1 point), the TSS gets a boost. "Diverged" signals reduce TSS in that category. This keeps the matching dynamic and honest.

#### 4.3.3 Recommendation Tiers (Search Results)

When a user searches for an item, venue, or category:

| Tier | Source | Display Priority |
|------|--------|-----------------|
| 1 | Pinned Gourmet Friends | Highest — shown first with profile badge |
| 2 | High-TSS users (>= 0.7 in relevant category) | Second — shown with similarity % |
| 3 | Moderate-TSS users (0.5 - 0.7) | Third — shown with lower prominence |
| 4 | General highly-rated notes | Lowest — aggregated, no individual profile |

### 4.4 Discovery & Search Features

#### 4.4.1 Menu Decider
- User selects a restaurant (via search or GPS proximity)
- System shows: specific dishes rated by Gourmet Friends and high-TSS users
- Display: "3 taste-matched friends recommend the Salmon (avg 8.2/10)"
- Fallback: If no friend data, show highest-rated dishes from general user base

#### 4.4.2 Area Explorer (Map View)
- Map pins from Gourmet Friends only (default view)
- Toggle to "All Users" view
- Category filter: Restaurants / Wineries / Bars
- Each pin shows: venue name, friend count who visited, avg friend rating
- Tap for detail: individual Gourmet Friend notes

#### 4.4.3 Beverage Search
- Search by wine name, grape varietal, spirit type, distillery
- Results prioritized by Gourmet Friend network (same tier system)
- Cross-reference: "Your Gourmet Friends also enjoyed these at [Restaurant X]"

### 4.5 Pioneer Incentive System

When a geographic area or venue category has < 3 notes:

1. Flag as **"Pioneer Zone"** on the map (subtle visual indicator)
2. First 5 users to write quality notes (minimum: photo + 3 structured fields + rating) earn:
   - "Pioneer" badge on their profile
   - Premium feature credits (e.g., 1 month of Menu Decider)
3. Quality gate: Notes must meet minimum structure to prevent spam

---

## 5. Monetization Strategy

### 5.1 Free Tier — "Peeker"
- Unlimited personal note creation (private journal is always free)
- View public notes and search
- Follow up to 5 Binders
- See Taste Similarity Scores for up to 10 users
- Basic search (Tier 3 & 4 results only)

### 5.2 Premium Tier — "Connoisseur" ($6.99/month or $59.99/year)
- Unlimited Binder follows
- Full Gourmet Friend network (unlimited pins)
- Menu Decider access
- Tier 1 & 2 search results (friend-prioritized)
- Advanced filters (by taste tags, price range, rating threshold)
- Offline mode (download notes for travel)
- Export personal data (CSV/PDF)

### 5.3 Future Monetization (Post-Growth)
- **Tipping:** Users can tip Gourmets for valuable notes ($1, $3, $5 presets)
- **Pioneer Bounties:** Sponsored bounty zones (e.g., a wine region tourism board sponsors Pioneer incentives for their area)
- **Affiliate links:** When a user views a wine/spirit note, optional "Buy This" links to partnered retailers (Wine.com, Drizly, etc.) — revenue share model
- **B2B data licensing:** Anonymized, aggregated taste trend data for restaurants, wineries, and spirit brands (long-term, only with user consent and privacy safeguards)

**Pricing rationale:** $6.99/month positions below Beli's implicit cost (free but ad-driven) and well below premium wine services. The core value proposition — "see what people who taste like you actually recommend" — justifies the price because it directly saves money on bad dining choices.

---

## 6. Technical Architecture (High-Level)

### 6.1 Recommended Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Mobile Client | React Native or Flutter | Cross-platform, single codebase |
| Backend API | Node.js (NestJS) or Python (FastAPI) | Strong ecosystem, async-capable |
| Database | PostgreSQL (primary) + Redis (cache) | Relational for structured notes, Redis for TSS cache |
| Search | Elasticsearch or Meilisearch | Full-text search across notes, venues, beverages |
| File Storage | AWS S3 / Cloudflare R2 | Photo storage |
| Auth | Firebase Auth or Auth0 | Quick setup, social login support |
| Hosting | AWS (ECS/Lambda) or Railway/Render (MVP) | Start simple, scale later |

### 6.2 External API Strategy

See [TECHNICAL_FEASIBILITY.md](./TECHNICAL_FEASIBILITY.md) for full analysis. Summary:

| Data Need | Primary Source | Fallback | Notes |
|-----------|---------------|----------|-------|
| Restaurant metadata | **Google Places API** | Manual entry | $275/mo Essentials plan; most reliable |
| Wine metadata | **Open-source wine DBs** + user-contributed | Wine-Searcher affiliate links | Vivino has no public API; build own DB over time |
| Spirit metadata | **User-contributed** + curated seed data | Whiskybase (limited) | No reliable spirits API exists; this is an opportunity |
| Winery/Distillery data | **Google Places API** | Manual entry | Same source as restaurants |
| Delivery availability | **Deferred to Phase 3** | Deep link to delivery apps | Uber Eats API is partner-only; not viable for MVP |
| Payments | **Stripe** | — | Industry standard |

### 6.3 Key Data Models (Simplified)

```
User
  ├── id, email, display_name, avatar
  ├── taste_profile (computed, cached)
  └── subscription_tier

Binder
  ├── id, owner_id, name, category, visibility
  └── follower_count

Note (polymorphic: restaurant_note, wine_note, spirit_note, visit_note)
  ├── id, author_id, binder_id, type
  ├── rating, tags[], photos[], text
  ├── venue_ref (nullable), item_name
  ├── created_at, visibility
  └── [type-specific fields]

TasteSignal
  ├── id, sender_id, note_id
  ├── signal_type (bookmarked | echoed | diverged)
  └── sender_rating (for echo/diverge)

TasteSimilarity (materialized/cached)
  ├── user_a_id, user_b_id, category
  ├── score (0.0 - 1.0)
  ├── overlap_count
  └── last_computed_at

GourmetFriendPin
  ├── pinner_id, pinned_id
  └── categories[] (which categories this pin applies to)
```

---

## 7. Development Roadmap

### Phase 1 — "The Notebook" (MVP) — 3-4 months
**Goal:** Prove the core value of structured gourmet journaling.

**Scope:**
- [ ] User auth (email + Google/Apple sign-in)
- [ ] Note creation for all 4 types (restaurant, wine, spirit, winery visit)
- [ ] Binder creation and management
- [ ] Google Places integration for venue search
- [ ] Photo upload (up to 5 per note for MVP)
- [ ] Personal feed (chronological view of own notes)
- [ ] Basic search across own notes
- [ ] Public/Private note visibility toggle
- [ ] Mobile app (React Native + Expo, iOS + Android)

**NOT in scope for Phase 1:** Social features, TSS calculation, recommendations, payments.

**Success metrics:**
- 500+ beta users
- Average 10+ notes per active user
- 60% Day-30 retention

### Phase 2 — "The Network" — 3-4 months after Phase 1
**Goal:** Activate the social taste-matching layer.

**Scope:**
- [ ] Public note browsing and search (across all users)
- [ ] Binder following (subscribe to others' binders)
- [ ] Taste Similarity Score calculation (batch job, nightly)
- [ ] Gourmet Friend pinning (with minimum overlap requirement)
- [ ] Taste Signals (Bookmarked, Echoed, Diverged)
- [ ] Tiered search results (Friend > High-TSS > General)
- [ ] User discovery: "Users with similar taste" suggestions
- [ ] (Cross-platform already shipped in Phase 1)

**Success metrics:**
- 5,000+ users
- Average 3+ Gourmet Friend pins per active user
- 40% of searches return Tier 1 or 2 results

### Phase 3 — "The Advisor" — 3-4 months after Phase 2
**Goal:** Deliver real-time decision support.

**Scope:**
- [ ] Menu Decider (restaurant-specific friend recommendations)
- [ ] Area Explorer (map view with friend pins)
- [ ] Premium subscription launch (Stripe integration)
- [ ] Offline mode for premium users
- [ ] Pioneer incentive system
- [ ] Push notifications (new notes from followed binders)
- [ ] Advanced search filters

**Success metrics:**
- 20,000+ users
- 5% free-to-premium conversion rate
- Menu Decider used 2+ times/week by premium users

### Phase 4 — "The Ecosystem" — Ongoing
**Goal:** Build sustainable revenue and community flywheel.

**Scope:**
- [ ] Tipping system
- [ ] Affiliate buy links for wines/spirits
- [ ] Pioneer bounty sponsorships
- [ ] Wine label photo recognition (ML model or partner API)
- [ ] Data export and personal analytics
- [ ] Curated "Taste Journey" reports (annual summary of your palate evolution)
- [ ] Web app (companion to mobile)

---

## 8. Key Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start: No notes = no recommendations | High | Seed with team content; focus on a single city first; Pioneer incentives |
| Taste matching requires overlap | High | Gamify overlapping ratings ("Both tried X — rate it to see your match!"); popular venue prompts |
| API costs at scale | Medium | Cache aggressively; Google Places Essentials plan; build own venue DB over time |
| Vivino/wine data unavailability | Medium | Build community-contributed wine DB; partner with wine retailers for data |
| User confusion: "Is this Yelp? Is this Vivino?" | Medium | Strong onboarding flow emphasizing "your personal notes + trusted friends" positioning |
| Low engagement on spirit notes | Low | Spirits community is underserved; partner with whiskey/sake clubs for early adoption |

---

## 9. Design Principles

1. **Journal first, social second.** The private note is the core experience. Social features enhance it but never override it.
2. **Specificity over generality.** Rate the dish, not the restaurant. Rate the bottle, not the winery. Granular data powers better matching.
3. **Silence is a feature.** No comments means no trolls, no "nice pic" spam, no social anxiety. Interaction is through structured signals.
4. **Trust is earned, not assumed.** Gourmet Friend status requires demonstrated taste overlap. Follow counts are irrelevant.
5. **Cross-domain is the moat.** Every feature should reinforce the unique value of spanning restaurants + wine + spirits.

---

## 10. Decisions Made (2026-02-17)

- [x] **Rating scale:** 1-10 absolute scale + "Would Order Again" boolean
- [x] **Launch market:** Los Angeles (strong food/wine/K-Town scene, proximity to wine country)
- [x] **Platform:** React Native (cross-platform, iOS + Android from single codebase)
- [x] **Backend:** Node.js + NestJS (TypeScript end-to-end with React Native)
- [x] **Content language:** English-only MVP
- [x] **Tag taxonomy:** Pre-defined curated taxonomy per category
- [x] **Minimum note quality:** Flexible — rating required, photo/tags/text optional with UI nudges
- [x] **Wine/spirit data:** Community-built DB seeded from open sources (no Vivino API — doesn't exist publicly; scrapers are ToS-violating and unreliable)

---

## 11. Implementation Stack (Decided)

```
Frontend:  React Native + Expo (managed workflow)
Backend:   Node.js + NestJS + TypeScript
Database:  PostgreSQL (Prisma ORM)
Cache:     Redis (Upstash for MVP)
Search:    Meilisearch
Storage:   Cloudflare R2 (S3-compatible, cheaper)
Auth:      Firebase Auth (Google/Apple sign-in)
Maps:      Google Places API (venue data) + react-native-maps
Payments:  Stripe (Phase 3)
Hosting:   Railway or Render (MVP) → AWS (scale)
```
