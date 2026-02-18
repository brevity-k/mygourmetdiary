# MyGourmetDiary — Technical Feasibility & API Strategy

> **Last updated:** 2026-02-17

---

## 1. External API Assessment

### 1.1 Google Places API (New) — RECOMMENDED for venue data

**Status:** Active, well-documented, reliable.

**What it provides:**
- Restaurant/winery/bar search by name, location, or category
- Place details: name, address, phone, hours, photos, rating, price level
- Nearby search for area exploration
- Place autocomplete for search UX

**Pricing (as of 2025-2026):**
| Plan | Cost | Calls/Month | Notes |
|------|------|-------------|-------|
| Essentials | ~$275/mo | 100,000 | Best for MVP-to-growth |
| Pro | ~$1,200/mo | 250,000 | For scale |
| Pay-as-you-go | $2-30 per 1K requests | Variable | SKU-dependent |

**Recommendation:** Start with Pay-as-you-go during MVP (low volume). Move to Essentials plan when usage reaches ~50K calls/month. Cache venue data aggressively — once a restaurant's metadata is fetched, store it locally and refresh weekly/monthly.

**Risk:** Google can change pricing. Mitigation: build an abstraction layer so we can swap to alternative (Foursquare Places, OpenStreetMap) if needed. Also, build own venue DB progressively from user-contributed data.

### 1.2 Yelp Fusion API — NOT RECOMMENDED as primary

**Status:** Active but expensive and developer-unfriendly.

**Pricing (as of 2025-2026):**
| Plan | Cost | Calls/Month |
|------|------|-------------|
| Starter | $7.99/1K calls | 30,000 included |
| Plus | $9.99/1K calls | 30,000 included |
| Enterprise | $14.99/1K calls | 150,000+ |

**Problems:**
- Expensive per-call pricing with no free tier for production
- Developer community backlash over opaque pricing changes (2024)
- ToS restrictions on caching and data storage
- Provides similar data to Google Places at higher cost

**Recommendation:** Do NOT use Yelp as primary data source. If desired, consider showing Yelp rating as supplementary info via a single API call when user views venue details (not for search). Google Places is superior in cost and reliability.

### 1.3 Vivino API — NOT AVAILABLE (public)

**Status:** No official public developer API.

**Reality check:** Despite the Gemini draft listing Vivino as an integration, Vivino does not offer a public API for third-party applications. Available options:

| Approach | Viability | Risk |
|----------|-----------|------|
| Official API partnership | Low probability for a startup | Vivino unlikely to partner with a potential competitor |
| Unofficial scraping | Technically possible (community tools exist) | ToS violation; unreliable; legal risk |
| Wine-Searcher API | Moderate | Provides pricing/availability data; limited tasting notes |
| Open wine databases | Good for MVP | Community-maintained; incomplete but growing |
| Build own DB from user contributions | Best long-term | Slow start; need seed data |

**Recommendation:**
1. **MVP:** Seed a basic wine/spirit database from open sources (e.g., OpenWineData, Wikidata wine entries). Allow users to add wines manually with structured fields.
2. **Phase 2-3:** Implement label photo recognition (Google Cloud Vision or dedicated wine label ML) to assist data entry.
3. **Long-term:** The community-contributed database becomes a competitive asset. Partner with wine retailers for data enrichment (mutual benefit: they get traffic, we get data).

### 1.4 Uber Eats / DoorDash API — NOT VIABLE for consumer apps

**Status:** Available, but partner-only (designed for restaurants managing their stores, not consumer-facing apps).

**Reality check:** The Gemini draft's "check if a rated item is currently deliverable" feature is not feasible with current APIs. Uber Eats API requires restaurant-partner authentication. DoorDash's API is similar.

**Alternative approaches:**
| Approach | Viability | User Experience |
|----------|-----------|-----------------|
| Deep link to delivery app | Simple, reliable | "Order on Uber Eats" button opens the app |
| Affiliate/referral program | Revenue opportunity | Links through delivery affiliate programs |
| Manual "Available on" tags | User-contributed | Users note if a dish is deliverable |

**Recommendation:** Defer entirely. In MVP, simply link to the restaurant's website. In Phase 3+, add deep links to Uber Eats/DoorDash as a convenience feature (no API needed — just URL scheme linking). This is a nice-to-have, not core value.

### 1.5 Stripe — RECOMMENDED for payments

**Status:** Industry standard, excellent documentation, global coverage.

**What we need:**
- Subscription management (Free → Premium tier)
- Tipping (user-to-user payments, Phase 4)
- Payouts (if creator economy develops)

**Pricing:** 2.9% + $0.30 per transaction (standard). Subscription management included.

**Recommendation:** Use Stripe from Phase 3 (when premium tier launches). Use Stripe Checkout for the subscription flow. For tipping (Phase 4), use Stripe Connect for user-to-user transfers.

---

## 2. Build-vs-Integrate Decision Matrix

| Capability | Build | Integrate | Recommendation |
|-----------|-------|-----------|----------------|
| Venue search & metadata | Own DB (long-term) | Google Places (MVP) | Integrate first, build progressively |
| Wine/spirit database | Own DB from day one | No viable API | Build (seed + community) |
| Taste similarity calculation | Must build | No off-the-shelf solution | Build |
| Photo storage | Object storage (S3/R2) | — | Build (standard infra) |
| Search & discovery | Meilisearch/Elasticsearch | — | Build (self-hosted or cloud) |
| Auth | — | Firebase Auth / Auth0 | Integrate |
| Payments | — | Stripe | Integrate |
| Push notifications | — | Firebase Cloud Messaging | Integrate |
| Image recognition (wine labels) | ML model (Phase 4) | Google Cloud Vision (Phase 4) | Integrate when ready |
| Maps/location | — | MapLibre (free) or Google Maps | Integrate |

---

## 3. Infrastructure Cost Estimates (Monthly)

### Phase 1 (MVP) — Targeting ~500 users

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Hosting (Railway/Render) | $25-50 | Small instance |
| PostgreSQL (managed) | $15-25 | Neon or Supabase free tier |
| Redis | $0-15 | Upstash free tier or small instance |
| S3/R2 (photo storage) | $5-20 | ~10GB initially |
| Google Places API | $20-50 | Low volume, cached aggressively |
| Firebase Auth | $0 | Free tier sufficient |
| Domain + SSL | $15/year | |
| **Total** | **~$80-175/mo** | |

### Phase 2 — Targeting ~5,000 users

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Hosting | $100-200 | Scaled instances |
| PostgreSQL | $50-100 | Growing data |
| Redis | $25-50 | TSS cache |
| Meilisearch | $30-50 | Search across all notes |
| S3/R2 | $30-60 | ~100GB |
| Google Places API | $100-275 | Essentials plan likely |
| **Total** | **~$335-735/mo** | |

### Phase 3 — Targeting ~20,000 users, revenue begins

| Service | Estimated Cost | Revenue Target |
|---------|---------------|----------------|
| Infrastructure | $800-1,500/mo | |
| Google Places | $275/mo (Essentials) | |
| Stripe fees | Variable | |
| **Total** | **~$1,200-2,000/mo** | 1,000 premium users @ $6.99 = $6,990/mo |

---

## 4. Technical Risks

### 4.1 Taste Similarity Computation at Scale

**Problem:** TSS requires comparing every user pair across all overlapping items. Naive implementation is O(n^2).

**Mitigation:**
- Only compute TSS between users who have >= 5 overlapping items (sparse matrix)
- Batch computation as nightly job (not real-time)
- Cache results in Redis with TTL; recompute when new ratings are added
- Use approximate nearest neighbor algorithms (e.g., Annoy, FAISS) for "similar users" discovery at scale
- At 20K users, the active overlap graph is likely sparse enough for direct computation

### 4.2 Cold Start Problem

**Problem:** Recommendations require data. New users have no notes and no matches.

**Mitigation strategy by phase:**
1. **Phase 1:** No social features needed — pure journal mode
2. **Phase 2 launch:** Seed with team + invited foodie beta testers (target: 50 power users with 20+ notes each)
3. **Popular venue prompting:** When a new user adds a restaurant, show "X other users also rated dishes here — rate yours to see your match!"
4. **Onboarding taste quiz:** Quick preference survey (cuisine types, wine styles, spirit preferences) to bootstrap a rough profile
5. **Geographic focus:** Launch in one city to maximize overlap density

### 4.3 Wine/Spirit Data Quality

**Problem:** No reliable external wine/spirit API. User-contributed data may be inconsistent.

**Mitigation:**
- Seed database with curated data from open sources (~5,000 popular wines, ~2,000 popular spirits)
- Fuzzy matching on user input ("Opus One 2018" matches "Opus One Napa Valley 2018")
- Community moderation: Allow users to merge duplicate entries
- Phase 4: Label photo recognition to standardize data entry

### 4.4 Search Relevance

**Problem:** Users expect fast, relevant search across venues, dishes, wines, and spirits.

**Mitigation:**
- Use Meilisearch (typo-tolerant, fast, easy to deploy) rather than building custom search
- Index: venue names, dish names, wine names, spirit names, tags, user display names
- Boosting: Results from Gourmet Friends rank higher (inject TSS as a relevance signal)

---

## 5. Security & Privacy Considerations

| Concern | Approach |
|---------|----------|
| User location data | Store only city-level for profile; exact coordinates only for venue-linked notes (from Google Places, not GPS) |
| Private notes | Encrypted at rest; never exposed in search or TSS computation |
| Taste data | TSS scores are derived data, not raw ratings; users can delete their account and all derived data |
| Payment data | Never stored — fully handled by Stripe |
| Photo content | User-owned; stored in private buckets; CDN-served only for public notes |
| GDPR/CCPA | Data export (Phase 3); account deletion with full data purge; cookie consent |

---

## Sources

- [Google Places API Pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Google Maps Platform Pricing Plans](https://mapsplatform.google.com/pricing/)
- [Yelp Fusion API Pricing](https://business.yelp.com/data/resources/pricing/)
- [Yelp API Pricing Controversy - TechCrunch](https://techcrunch.com/2024/08/02/yelps-lack-of-transparency-around-api-charges-angers-developers/)
- [Uber Eats Developer Documentation](https://developer.uber.com/docs/eats/introduction)
- [Vivino GitHub Community Tools](https://github.com/aptash/vivino-api)
- [Stripe Pricing](https://stripe.com/pricing)
