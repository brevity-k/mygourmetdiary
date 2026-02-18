# MyGourmetDiary — Competitive Analysis

> **Last updated:** 2026-02-17

---

## 1. Competitive Landscape Map

```
                    Restaurant-Only ←————————————→ Multi-Domain (Food + Drink)
                         |                                    |
Social/Public    [ Beli ][ Yelp ]                    [ MyGourmetDiary ]
                 [ Google Maps ]                              |
                         |                                    |
                         |                                    |
Journal/Private  [ Savor ][ World of Mouth ]                  |
                         |                                    |
                         |                                    |
Beverage-Only            |                [ Vivino ][ Distiller ][ Delectable ]
                         |                                    |
```

**Key insight:** No existing player occupies the intersection of multi-domain (restaurants + beverages) AND social taste-matching. This is MyGourmetDiary's primary whitespace.

---

## 2. Competitor Deep Dives

### 2.1 Beli — The Closest Competitor

**What it is:** Restaurant-focused social app where users rank restaurants, build a taste profile, and get personalized recommendations. Gen Z growth phenomenon.

| Aspect | Beli | MyGourmetDiary | Advantage |
|--------|------|----------------|-----------|
| **Domain** | Restaurants only | Restaurants + Wine + Spirits + Wineries | MGD |
| **Rating system** | Relative ranking (compare to your other visits) | Absolute 1-10 scale per dish/item | Trade-off* |
| **Granularity** | Venue-level | Dish-level / bottle-level | MGD |
| **Taste matching** | Global taste profile; single similarity score | Category-specific TSS; Binder-level granularity | MGD |
| **Social model** | Full social (comments, friends, lists) | Silent diary (signals only, no comments) | Differentiated |
| **Recommendation** | Predicted score per restaurant | Tiered results by Gourmet Friend trust | MGD |
| **Maturity** | Established (2021), strong Gen Z base | Pre-launch | Beli |
| **Business model** | Free (ad/data monetized) | Freemium subscription | Trade-off |

*Rating trade-off: Beli's relative ranking creates strong comparative data but is unintuitive for new users. MGD's 1-10 absolute scale is more universally understood but may compress at the top end. **Decision:** Keep 1-10 but encourage "Would Order Again" boolean as the strongest binary signal.

**Beli's weaknesses MGD exploits:**
1. No beverage coverage — wine/spirits lovers need a separate app
2. Venue-level only — two dishes at the same restaurant can differ wildly
3. Single taste score — "I love your pizza picks but hate your sushi picks" is impossible
4. Full social noise — comments and replies dilute the diary experience

### 2.2 Savor — The Quality Journal

**What it is:** AI-powered dish-rating app that acts as a personal food database. Photo recognition auto-identifies dishes.

| Aspect | Savor | MyGourmetDiary | Advantage |
|--------|-------|----------------|-----------|
| **Domain** | Restaurants / dishes | Multi-domain | MGD |
| **Core UX** | Private journal first | Private journal first | Parity |
| **AI features** | Photo recognition, auto-categorization | Not in MVP (Phase 4 candidate) | Savor |
| **Social** | Minimal — share curated lists | Taste-matched friend recommendations | MGD |
| **Recommendation** | None (personal reference tool) | TSS-based friend recommendations | MGD |
| **Beverage support** | None | Full wine/spirit/sake notes | MGD |

**Savor's weaknesses MGD exploits:**
1. No social recommendation layer — it's a solo journal with no network effects
2. No beverages — huge gap for foodie-wine crossover users
3. No taste matching — can't discover who tastes like you

**Savor's strengths MGD should learn from:**
1. 30-second note entry — MGD must keep note creation fast despite structured fields
2. AI photo recognition — valuable for Phase 4
3. "Time Machine" dish comparison — interesting feature to consider

### 2.3 Vivino — The Wine Giant

**What it is:** World's largest wine community. Label scanning, ratings, reviews, purchase links. 65M+ users.

| Aspect | Vivino | MyGourmetDiary | Advantage |
|--------|--------|----------------|-----------|
| **Wine data** | Massive (label scanning, vintage DB) | Community-built over time | Vivino |
| **Social** | Follow, like, comment | Silent signals + TSS matching | Differentiated |
| **Restaurant integration** | None | Full restaurant notes | MGD |
| **Spirit support** | Wine only | Wine + spirits + sake | MGD |
| **Recommendation** | "Match for You" after 5 ratings | Category-specific TSS with friend tiers | MGD |
| **Commerce** | Wine marketplace (buy directly) | Affiliate links (Phase 4) | Vivino |
| **Maturity** | Dominant incumbent | Pre-launch | Vivino |

**Vivino's weaknesses MGD exploits:**
1. Wine-only silo — users who also care about food/spirits need a separate app
2. Generic "Match for You" — not peer-specific, algorithmic black box
3. Comment-heavy social — noisy, not journal-like
4. No restaurant pairing data — "What wine did you have WITH what food?"

**Vivino's strengths MGD cannot replicate immediately:**
1. Label scanning — requires ML model or third-party service
2. Massive wine database — years of community contribution
3. E-commerce integration — direct purchase flow

**Strategy:** Don't compete with Vivino on wine database depth. Compete on the **cross-domain experience** (wine + food together) and **trusted peer recommendations** (vs. algorithmic suggestions from strangers).

### 2.4 Distiller — The Spirits Niche

**What it is:** Whiskey/spirits information app with user reviews, tasting notes, and flavor profiles.

| Aspect | Distiller | MyGourmetDiary | Advantage |
|--------|-----------|----------------|-----------|
| **Spirit data** | Extensive curated database | Community-built | Distiller |
| **Social** | Friend network, recommendations | TSS matching + Binder follows | MGD |
| **Food integration** | None | Full restaurant + beverage | MGD |
| **Taste matching** | Flavor profile-based suggestions | Cross-domain TSS | MGD |

**Opportunity:** Spirits/whiskey community is underserved in social features compared to wine (Vivino). MGD can capture this audience by offering a better social layer + food pairing context.

### 2.5 Other Competitors

| App | Focus | MGD Advantage |
|-----|-------|---------------|
| **World of Mouth** | Private dining diary + guides | MGD adds taste matching + beverages |
| **Google Maps** | "Your Match" score for restaurants | MGD is item-level, not venue-level; adds beverages; peer-specific |
| **Yelp** | Crowd-sourced restaurant reviews | MGD is trust-curated, not crowd-averaged; adds beverages |
| **Letterboxd** (analog) | Film diary + social | Similar "diary + community" DNA; MGD applies this model to food/drink |
| **Goodreads** (analog) | Book diary + social | Similar concept; MGD is the Goodreads of eating/drinking |

---

## 3. Competitive Advantage Summary

### Primary Moat: Cross-Domain Taste Identity
No competitor spans restaurants + wine + spirits in one taste profile. This creates:
- Higher switching costs (your whole gourmet life is here)
- Richer taste signals (food preferences inform drink preferences and vice versa)
- Unique recommendation power ("people who like the same sushi as you also like these wines")

### Secondary Moat: Category-Specific Trust
Beli gives you one taste score. Vivino gives you one wine preference. MGD says: "You match 92% on whiskey, 45% on Italian food, 78% on natural wine." This granularity is defensible and grows more valuable with more data.

### Tertiary Moat: Silent Social Model
The no-comment design is a deliberate cultural choice that attracts quality-over-quantity users — serious foodies and sommeliers who want a journal, not a social feed. This self-selects for high-quality content, which in turn makes recommendations more reliable.

---

## 4. Threats & Responses

| Threat | Response |
|--------|----------|
| Beli adds wine/spirits | They'd need to rebuild their ranking system for multi-domain; MGD has head start on cross-domain architecture |
| Vivino adds restaurants | Vivino is commerce-first (selling wine); food recommendations don't fit their business model |
| Google Maps improves taste matching | Google optimizes for venue discovery, not dish/bottle-level granularity or peer trust |
| A new well-funded competitor copies the concept | Speed to market matters; build the taste data moat early; community is hard to replicate |

---

## Sources

- [Beli - Wikipedia](https://en.wikipedia.org/wiki/Beli_(app))
- [Beli: Food for thought - Snapshots](https://www.readsnapshots.com/p/beli-food-for-thought)
- [Beli: Knowing What Your Belly Wants - Harvard Digital](https://d3.harvard.edu/platform-digit/submission/beli-knowing-what-your-belly-wants/)
- [Savor - Dish Rating App](https://www.savortheapp.com/)
- [Vivino App](https://www.vivino.com/en/app)
- [Vivino Features - Symphony Solutions](https://symphony-solutions.com/insights/vivino-app-a-digital-wine-experience)
- [Distiller - Whisky Advocate](https://whiskyadvocate.com/7-whisky-mobile-apps)
- [World of Mouth](https://www.worldofmouth.app/)
- [Beli App Alternatives - Savor](https://www.savortheapp.com/blog/food-memories-journaling/beli-app-alternatives/)
