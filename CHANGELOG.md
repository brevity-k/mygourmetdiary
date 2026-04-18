# Changelog

All notable changes to MyGourmetDiary, organized by milestone.

---

## [Community Features] — 2026-04-09

Community pages for venues and products, visibility controls, and social web pages.

### Added
- Product model with category (wine, spirit, sake, beer), producer, vintage, region, ABV
- FRIENDS visibility level for notes (visible only to Gourmet Friends)
- `buildVisibilityFilter` helper with full test coverage
- Community stats service (parameterized by venue or product) with tests
- Community notes service with visibility filter and tier tags, with tests
- Community gourmets service (top contributors per venue/product) with tests
- Products service (search, create, get) with tests
- Community cache invalidation wired into note mutations
- `communityApi` and `productsApi` client wrappers in shared-api
- Venue community and product community pages (web + mobile)
- VisibilitySelector and ProductSearchInput form components (web + mobile)
- Links from note detail and map preview to community pages
- Social pages on web: Friends, Discover, Following, User Profile

### Fixed
- Viewer's own notes now included in community stats
- Correct Prisma relation name `gourmetFriendPins` in visibility filter

---

## [Supabase Migration] — 2026-04-06 to 2026-04-08

Full infrastructure migration from 7 vendors to 4. See `docs/superpowers/specs/2026-04-06-full-supabase-migration-design.md` for the design document.

### Changed
- **Auth**: Firebase Auth → Supabase Auth (Google OAuth + email/password)
- **Database**: Managed PostgreSQL → Supabase PostgreSQL (Prisma connection via PgBouncer)
- **Storage**: Cloudflare R2 → Supabase Storage (presigned uploads)
- **Search**: Meilisearch → PostgreSQL pg_trgm full-text search
- **API**: NestJS on Railway → Next.js 16 API Route Handlers on Vercel
- **Validation**: class-validator DTOs → Zod schemas
- **Cron**: NestJS @Schedule → Vercel Cron (TSS batch daily 2AM, photo cleanup daily 3AM)
- **Rate limiting**: @nestjs/throttler → Upstash Ratelimit (per-user sliding window)
- Environment variables reduced from ~27 to ~12

### Added
- `withAuth()`, `withPremium()`, `withCron()` middleware for route handlers
- `apiSuccess()`, `apiError()` response helpers
- Supabase server client, Prisma singleton, Redis client, Google Places client
- Vitest test infrastructure with path aliases
- Subscription status endpoint
- All 25+ API route handlers ported from NestJS controllers

### Removed
- `backend/` NestJS application (entire directory)
- `railway.toml` and Railway deployment config
- Firebase Admin SDK, Firebase client SDK
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `meilisearch` client library
- `class-validator`, `class-transformer`
- All NestJS dependencies (`@nestjs/*`)
- 21 Firebase/R2/Meilisearch environment variables

---

## [Dependency Upgrades & Hardening] — 2026-04-01 to 2026-04-05

Major dependency upgrades, security fixes, and CI improvements.

### Changed
- Next.js 15.5 → 16.2.2
- Prisma 5.22 → 7.6.0
- React 19.0 → 19.1.0
- TypeScript config updated for Next.js 16

### Added
- Dependabot for automated npm and GitHub Actions updates
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Web CI jobs (typecheck, test, build)
- OCR, email digest, and city lookup services (backend, later migrated)

### Fixed
- 35 npm audit vulnerabilities resolved
- ReDoS vulnerability in ajv (CVE-2025-69873)
- HIGH/MEDIUM/LOW severity tech debt across backend, web, and mobile
- Security scan findings (OWASP items)
- Silent error handlers replaced with logged warnings
- Bare `as any` casts replaced with typed alternatives

---

## [Phase 3: The Advisor] — 2026-02-19

Subscriptions, recommendations, and offline mode.

### Added
- RevenueCat integration for mobile subscriptions (Free / Connoisseur tiers)
- Menu Decider: "What should I order?" based on Gourmet Friend notes at a venue
- Area Explorer: map view with friend-weighted venue pins
- Pioneer Badge system (first to review a venue)
- Push notification infrastructure (tokens, preferences)
- Offline mode with SQLite cache and background sync
- Tiered search (Tier 1: friends, Tier 2: high-TSS, Tier 3: public, Tier 4: all)
- Notification preferences per user

### Infrastructure
- E2E testing, CI/CD, linting, and demo seed infrastructure

---

## [Phase 2: The Network] — 2026-02-18

Social taste-matching layer.

### Added
- Taste Similarity Score (TSS) algorithm with category-specific matching
- Gourmet Friend pin system with eligibility checks
- Taste Signals: Bookmark, Echo (agree), Diverge (disagree)
- Binder Follow system (subscribe to others' binders)
- Friend discovery (suggestions based on TSS overlap)
- TSS batch computation cron job
- TSS Redis cache layer
- Public user profiles with taste similarity display

### Fixed
- Cache invalidation and validation hardening
- Mobile UX polish for social features

---

## [Phase 1: The Notebook (MVP)] — 2026-02-17

Initial full-stack gourmet journaling application.

### Added
- Structured note types: Restaurant/Dish, Wine, Spirit, Winery Visit
- Binder system for organizing notes by category
- Tag taxonomy (restaurant, wine, spirit, cuisine tags)
- Venue integration via Google Places API
- Photo uploads with presigned URLs
- 1-10 rating scale with "Would Order Again" boolean
- Rich extension fields per note type (dish category, grape varietal, spirit type, etc.)
- Mobile app: React Native + Expo with bottom tab navigation
- Web app: Next.js with responsive sidebar/mobile nav
- Firebase Auth (Google OAuth + email/password)
- NestJS backend with Prisma ORM
- Dev auth bypass for local development

### Infrastructure
- npm workspaces monorepo (web, mobile, packages)
- Shared types, constants, and API client packages
- PostgreSQL database with Prisma migrations
- Meilisearch for full-text search (with PostgreSQL fallback)
- Cloudflare R2 for photo storage
- Railway deployment for backend
- Vercel deployment for web
- GitHub Actions CI (typecheck + build)
- Custom app icon (diary with fork and wine glass)

---

## Document History

| Date | Document | Change |
|------|----------|--------|
| 2026-02-17 | `DRAFT.md` | Original service spec brainstorm |
| 2026-02-17 | `COMPETITIVE_ANALYSIS.md` | Competitive landscape research |
| 2026-02-17 | `TECHNICAL_FEASIBILITY.md` | API assessment and infrastructure cost estimates |
| 2026-04-06 | `docs/superpowers/specs/2026-04-06-full-supabase-migration-design.md` | Supabase migration design spec |
| 2026-04-06 | `docs/superpowers/plans/2026-04-06-full-supabase-migration.md` | Supabase migration implementation plan |
| 2026-04-08 | Migration spec + plan | Status updated to "Completed" |
| 2026-04-09 | `CLAUDE.md` | Stack table updated to reflect post-migration reality; monorepo structure and dev commands added |
| 2026-04-09 | `DRAFT.md` | Marked as historical document with cross-references |
| 2026-04-09 | `COMPETITIVE_ANALYSIS.md` | Date label updated to clarify pre-launch research |
| 2026-04-09 | `TECHNICAL_FEASIBILITY.md` | Post-migration note added; decisions cross-referenced to current stack |
| 2026-04-09 | `CHANGELOG.md` | Created — consolidated project history from 205 commits |

---

## Known Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| `firebaseUid` / `firebaseUser` naming in shared-types + auth-context | Low | Should rename to `supabaseId` / `authUser` across ~14 references |
| `r2Key` column in Prisma schema | Low | Storage migrated to Supabase but column still named `r2_key`; requires DB migration |
| No ESLint configuration | Medium | `npm run lint` is a no-op; should add `@typescript-eslint` |
| Test coverage gaps | Medium | 7 test files cover community services; notes, binders, photos services untested |
| `backend/` directory remnants | Low | Vestigial empty DTO stubs; safe to delete entirely |
