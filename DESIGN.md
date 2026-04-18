# MyGourmetDiary Design System

Cross-domain gourmet journal and taste-matching platform. Warm, editorial, photography-driven.

---

## 1. Visual Theme & Atmosphere

**Mood:** Leather-bound gourmet diary meets modern food magazine. Warm and personal — never corporate or clinical. The design evokes handwritten tasting notes on quality paper: parchment warmth, serif headings, careful structure, deliberate hierarchy.

**Density:** Medium. Photo-rich browsing cards balance visual richness with structured data (ratings, tags, venues). Grid view for discovery, list view for focused review.

**Design Philosophy:** "Warm Precision" — warm journal aesthetic provides the emotional identity (parchment, brown, serif headings) while structural rigor from best-in-class systems (Airbnb shadows, Notion borders, Pinterest masonry) provides polish. Photography is hero content — the UI recedes to let food, wine, and venue photos speak.

**Key Characteristics:**
- Parchment background (`#FDF8F0`) — warm off-white, like quality paper
- Saddle Brown (`#8B4513`) as singular brand accent — confident, not loud
- Cormorant serif headings — editorial, gourmet voice
- DM Sans body — warm, round terminals that complement the diary aesthetic
- Brown-tinted three-layer shadows — warm lift, never cold gray
- Whisper borders (`rgba(44,24,16,0.08)`) — structure without weight
- Photography-first cards — images hero, UI recedes
- Near-black brown text (`#2C1810`) — warm, never cold

---

## 2. Color Palette & Roles

### Primary Brand
- **Saddle Brown** (`#8B4513`): Primary CTA, brand accent, focus rings, active states. Contrast: 6.71:1 on parchment (WCAG AAA).
- **Primary Hover** (`#7A3B10`): Darker hover/pressed variant.
- **Primary Dark** (`#654321`): Deep variant for emphasis.

### Accent
- **Sienna** (`#A0522D`): Secondary accent, links, interactive highlights. Contrast: 4.89:1 on parchment (WCAG AA).
- **Copper Light** (`#E8A87C`): Decorative backgrounds, tinted pill badges.

### Background & Surface
- **Parchment** (`#FDF8F0`): Page background — the core warm off-white canvas.
- **White** (`#FFFFFF`): Card surfaces, inputs, elevated content.
- **Surface Alt** (`#F7F1E8`): Alternating section backgrounds for visual rhythm.
- **Surface Elevated** (`#FFF9F2`): Subtle warmth on hover/elevated cards.

### Text
- **Near-Black Brown** (`#2C1810`): Primary text, headings. Warm, never cold.
- **Text Secondary** (`#6B5B4F`): Descriptions, metadata. Contrast: 6.14:1 (WCAG AA).
- **Text Tertiary** (`#9A8B7F`): Placeholders, decorative labels. Use only for non-essential info.
- **Text Inverse** (`#FFFFFF`): Text on brown/dark surfaces.

### Rating
- **Rating Active** (`#A07628`): Filled rating indicators. Contrast: 3.88:1 on parchment (WCAG AA Large).
- **Rating Inactive** (`#E8DDD0`): Unfilled rating indicators (decorative).

### Status
- **Success** (`#4A7C59`): Positive states, Gourmet Friend match confirmation. Contrast: 4.60:1 (WCAG AA).
- **Error** (`#B33A2E`): Errors, destructive actions. Contrast: 5.58:1 (WCAG AA).
- **Warning** (`#8B6914`): Caution states, attention indicators.

### Borders & Shadows
- **Whisper Border** (`rgba(44,24,16,0.08)`): Default card/section borders — felt, not seen.
- **Standard Border** (`rgba(44,24,16,0.12)`): Inputs, active cards.
- **Muted** (`#F0E8DC`): Skeleton loaders, disabled backgrounds.
- **Card Shadow**: `rgba(44,24,16,0.02) 0px 0px 0px 1px, rgba(44,24,16,0.04) 0px 2px 6px, rgba(44,24,16,0.08) 0px 4px 8px` — three-layer warm lift.

---

## 3. Typography Rules

### Font Families
- **Headings**: `Cormorant`, fallbacks: `Georgia, "Times New Roman", serif`
- **Body**: `DM Sans`, fallbacks: `-apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Monospace** (data/stats): `JetBrains Mono`, fallbacks: `"SF Mono", Menlo, Monaco, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display | Cormorant | 32px (2.00rem) | 700 | 1.20 | -0.5px | Hero headlines, page titles |
| H1 | Cormorant | 24px (1.50rem) | 700 | 1.25 | -0.3px | Section headings |
| H2 | Cormorant | 20px (1.25rem) | 600 | 1.30 | -0.2px | Sub-section headings |
| H3 | DM Sans | 16px (1.00rem) | 600 | 1.40 | normal | Card titles, feature headers |
| Body | DM Sans | 15px (0.94rem) | 400 | 1.50 | normal | Standard reading text |
| Body Medium | DM Sans | 15px (0.94rem) | 500 | 1.50 | normal | Navigation, emphasized UI |
| Caption | DM Sans | 13px (0.81rem) | 400 | 1.40 | normal | Metadata, timestamps |
| Caption Medium | DM Sans | 13px (0.81rem) | 500 | 1.40 | normal | Strong metadata, labels |
| Badge | DM Sans | 11px (0.69rem) | 600 | 1.30 | 0.5px | Pill badges, tier labels |
| Button | DM Sans | 15px (0.94rem) | 600 | 1.00 | 0.3px | Button labels |
| Data Value | JetBrains Mono | 14px (0.88rem) | 500 | 1.40 | normal | TSS scores, ratings, stats |

### Principles
- **Serif for voice, sans for function**: Cormorant carries the gourmet editorial identity; DM Sans handles all functional UI. Never mix.
- **Warm weight range**: 400 (read), 500 (navigate), 600 (emphasize), 700 (announce). No thin weights.
- **Negative tracking on headings**: -0.5px to -0.2px on Cormorant creates cozy, intimate headings.
- **Positive tracking on badges**: 0.5px at 11px improves legibility at small sizes.
- **Mono for data**: TSS scores, ratings, and statistics use JetBrains Mono to signal precision.

---

## 4. Component Stylings

### Buttons

**Primary**
- Background: `#8B4513` (saddle brown)
- Text: `#FFFFFF`
- Padding: 8px 20px
- Radius: 8px
- Hover: `#7A3B10` (darker)
- Focus: `2px solid #8B4513` offset ring
- Active: scale(0.98) transform

**Secondary**
- Background: `#FFFFFF`
- Text: `#8B4513`
- Border: `1px solid rgba(44,24,16,0.12)`
- Padding: 8px 20px
- Radius: 8px
- Hover: `#FFF9F2` background

**Ghost**
- Background: transparent
- Text: `#6B5B4F`
- Padding: 8px 12px
- Hover: `rgba(139,69,19,0.06)` background

**Destructive**
- Background: `#B33A2E`
- Text: `#FFFFFF`
- Radius: 8px

### Cards & Containers

**Compact Card** (note tiles, data rows)
- Background: `#FFFFFF`
- Border: `1px solid rgba(44,24,16,0.08)` (whisper)
- Radius: 12px
- Shadow: three-layer warm card shadow
- Hover: shadow intensification + `#FFF9F2` background tint

**Full Card** (note detail, featured content)
- Background: `#FFFFFF`
- Border: `1px solid rgba(44,24,16,0.08)`
- Radius: 16px
- Shadow: three-layer warm card shadow

**Section Container**
- Alternating backgrounds: `#FDF8F0` ↔ `#FFFFFF`
- No borders between sections — background shift provides rhythm
- 48-80px vertical padding between sections

### Badges & Pills

**Brown Pill** (default — categories, note types)
- Background: `rgba(139,69,19,0.08)`
- Text: `#8B4513`
- Radius: 9999px (full pill)
- Padding: 2px 10px
- Font: 11px DM Sans weight 600, 0.5px tracking

**Success Pill** (Gourmet Friend match, high compatibility)
- Background: `rgba(74,124,89,0.10)`
- Text: `#4A7C59`

**Gold Pill** (high TSS, premium tier)
- Background: `rgba(160,118,40,0.10)`
- Text: `#A07628`

**Tier Badge** (1-4 tier indicators)
- Same pill structure, size varies by context
- Tier 1: success green | Tier 2: gold | Tier 3: secondary brown | Tier 4: muted gray

### Inputs & Forms
- Background: `#FFFFFF`
- Text: `#2C1810`
- Border: `1px solid rgba(44,24,16,0.12)` (standard)
- Padding: 10px 14px
- Radius: 8px
- Focus: `2px solid #8B4513` ring
- Placeholder: `#9A8B7F`

### Rating Input
- Active star/dot: `#A07628` (rating gold)
- Inactive star/dot: `#E8DDD0`
- Size: 24px touch targets (44px tap area)
- Animation: subtle scale on selection

### Navigation

**Web Sidebar**
- Background: `#FFFFFF`
- Width: 256px (16rem)
- Border-right: `1px solid rgba(44,24,16,0.08)`
- Active link: `rgba(139,69,19,0.08)` background, `#8B4513` text, 8px radius
- Inactive link: `#6B5B4F` text
- Logo: Cormorant 20px weight 700, `#8B4513`

**Mobile Bottom Tab**
- Background: `#FFFFFF`
- Border-top: `1px solid rgba(44,24,16,0.08)`
- Active: `#8B4513` icon + label
- Inactive: `#9A8B7F` icon + label
- FAB (create): `#8B4513` background, `#FFFFFF` icon, 50% radius, brown shadow

### Image Treatment
- Note photos: fill card top with 12px/16px top radius (matches card)
- Photo carousel with dot indicators
- Heart/bookmark overlay on images: `#FFFFFF` with shadow for legibility
- Venue photos: aspect ratio maintained, warm shadow beneath
- Avatar: 50% radius, `1px solid rgba(44,24,16,0.08)` border

---

## 5. Layout Principles

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 80
- Primary rhythm: 8, 16, 24, 32 (8px grid for most UI)
- Section spacing: 48px (mobile), 64-80px (desktop)

### Grid & Container
- Max content width: 1280px (7xl)
- Web: sidebar (256px) + content area
- Content padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Card grid: responsive multi-column (1-4 columns)

### Note Feed (dual mode)
- **Grid view** (default for Feed, Discover): Pinterest-style masonry, photo-dominant, compact cards (12px radius)
- **List view** (default for Binder detail, Search): Scannable rows with thumbnail + title + rating + date, full card (16px radius)
- Toggle always visible. User preference persisted.

### Whitespace Philosophy
- **Warm breathing room**: Parchment background IS the whitespace. Generous padding between sections, moderate density within cards.
- **Photography density**: Note cards pack photos prominently — images are the primary visual draw, like Airbnb listings.
- **Section alternation**: `#FDF8F0` ↔ `#FFFFFF` sections create gentle visual rhythm without harsh dividers (from Notion).
- **Sidebar clarity**: Web sidebar uses ample vertical spacing between groups. Mobile tab bar is clean with minimal labels.

### Border Radius Scale
- Buttons, inputs: 8px
- Compact cards, note tiles: 12px
- Full cards, featured content: 16px
- Badges, pills: 9999px (full pill)
- Avatars, FAB: 50% (circle)

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, inline text, section containers |
| Whisper (Level 1) | `1px solid rgba(44,24,16,0.08)` | Card outlines, sidebar border, dividers |
| Card (Level 2) | `rgba(44,24,16,0.02) 0px 0px 0px 1px, rgba(44,24,16,0.04) 0px 2px 6px, rgba(44,24,16,0.08) 0px 4px 8px` | Note cards, venue cards, binder cards |
| Hover (Level 3) | `rgba(44,24,16,0.04) 0px 4px 12px` | Card hover, interactive lift |
| Elevated (Level 4) | `rgba(44,24,16,0.03) 0px 4px 18px, rgba(44,24,16,0.02) 0px 2px 8px, rgba(44,24,16,0.01) 0px 1px 3px` | Modals, popovers, bottom sheets |
| Focus (Accessibility) | `2px solid #8B4513` | Keyboard focus on all interactive elements |

**Shadow Philosophy**: All shadows use brown-tinted rgba (`44,24,16`) instead of pure black, creating warm, natural lift that matches the parchment canvas. The three-layer card shadow (from Airbnb's pattern) provides a border ring + soft ambient + primary lift. Hover adds a single broader layer. Elevated surfaces use the inverse pattern — broader, softer layers for ambient occlusion.

---

## 7. Do's and Don'ts

### Do
- Use `#2C1810` (warm near-black brown) for text — never pure `#000000`
- Apply Saddle Brown (`#8B4513`) for primary CTAs and brand moments — it's the singular accent
- Use Cormorant for all headings — the editorial, gourmet voice
- Use DM Sans for all body/UI text — warm, rounded, functional
- Apply three-layer brown-tinted shadows on all elevated cards
- Use whisper borders (`rgba(44,24,16,0.08)`) — structure without weight
- Alternate parchment (`#FDF8F0`) and white (`#FFFFFF`) sections for rhythm
- Make photography the hero — note cards are image-first
- Provide list view alongside grid/masonry for data-heavy contexts
- Check all colors against `#FDF8F0` for WCAG AA contrast (4.5:1 minimum for text)
- Use 44px minimum touch targets on mobile

### Don't
- Don't use pure black (`#000000`) for text — always warm brown `#2C1810`
- Don't use cold grays — all neutrals carry brown/warm undertones
- Don't apply Saddle Brown to large backgrounds — it's an accent only
- Don't use DM Sans for headings or Cormorant for body text — each has its role
- Don't use sharp corners (< 8px) on cards — the generous rounding is core identity
- Don't use pure-black shadows — always brown-tinted rgba
- Don't use `#D4A574` or `#C2703E` for text — they fail WCAG contrast on parchment
- Don't skip the list view option — power users need scannable rows, not just visual grids
- Don't introduce blue, purple, or cool accent colors — the palette is warm earth tones only
- Don't use thin font weights (300) — DM Sans at 400 minimum, Cormorant at 600 minimum

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 640px | Single column, bottom tab nav, 16px padding |
| Tablet | 640–1024px | 2-column grid, sidebar hidden, 24px padding |
| Desktop | 1024–1280px | Sidebar visible (256px), 3-column grid |
| Large Desktop | > 1280px | 4-column grid, max-width 1280px centered |

### Touch Targets
- All interactive elements: 44px minimum touch area
- Bottom tab icons: adequate padding within 88px tab bar
- FAB (create note): 52px diameter
- Rating stars/dots: 24px visual, 44px tap area
- Cards: full-card tap target on mobile

### Collapsing Strategy
- Navigation: sidebar (desktop) → bottom tabs (mobile)
- Note grid: 4 → 3 → 2 → 1 columns
- Note feed: masonry (desktop) → single column (mobile)
- Map: side panel (desktop) → bottom sheet (mobile)
- Photo gallery: horizontal scroll at all sizes
- Section spacing: 80px → 48px on mobile

### Image Behavior
- Note photos: responsive with aspect ratio maintained
- Photo carousel: swipe on mobile, arrows on desktop
- Venue map preview: full width on mobile, contained on desktop
- Avatar: consistent 40px (list), 48px (detail), 80px (profile)

---

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: Parchment (`#FDF8F0`)
- Surface: White (`#FFFFFF`)
- Surface Alt: `#F7F1E8`
- Brand: Saddle Brown (`#8B4513`)
- Accent: Sienna (`#A0522D`)
- Text: Near-Black Brown (`#2C1810`)
- Text Secondary: `#6B5B4F`
- Text Tertiary: `#9A8B7F`
- Rating: `#A07628`
- Border: `rgba(44,24,16,0.08)`
- Success: `#4A7C59`
- Error: `#B33A2E`

### Example Component Prompts
- "Create a note card: white background, 12px radius. Three-layer shadow: rgba(44,24,16,0.02) 0px 0px 0px 1px, rgba(44,24,16,0.04) 0px 2px 6px, rgba(44,24,16,0.08) 0px 4px 8px. Photo area on top (16:10 ratio, 12px top radius), details below: 16px DM Sans 600 title in #2C1810, 13px DM Sans 400 venue name in #6B5B4F, rating dots in #A07628."
- "Design a binder page heading: 24px Cormorant 700, -0.3px letter-spacing, #2C1810. Below: 13px DM Sans 400 description in #6B5B4F. Toggle button for grid/list view: 8px radius, active has rgba(139,69,19,0.08) background."
- "Build a TSS badge pill: rgba(74,124,89,0.10) background, #4A7C59 text, 9999px radius, 2px 10px padding, 11px DM Sans 600, 0.5px letter-spacing."
- "Create the sidebar: white background, 256px width, 1px solid rgba(44,24,16,0.08) right border. Logo: 'MyGourmetDiary' in 20px Cormorant 700, #8B4513. Nav links: 15px DM Sans 500, #6B5B4F. Active: rgba(139,69,19,0.08) bg, #8B4513 text, 8px radius."
- "Design a venue community page: hero photo full-width with 16px bottom radius. Venue name in 32px Cormorant 700, -0.5px tracking. Stats row: rating in 14px JetBrains Mono 500 #A07628, note count in 13px DM Sans 400 #6B5B4F. Section below alternates white and #F7F1E8 backgrounds."

### Iteration Guide
1. Parchment (`#FDF8F0`) is the canvas — everything lives on warm paper
2. Saddle Brown (`#8B4513`) for CTAs and brand moments only — singular accent
3. Cormorant for headings (editorial voice), DM Sans for everything else (warm function)
4. Brown-tinted shadows (`rgba(44,24,16,...)`) — never pure black shadows
5. Whisper borders at 0.08 opacity — structure without weight
6. 12px radius for compact cards, 16px for full cards, 8px for buttons
7. Photography is hero — note cards are image-first
8. Always provide list view alongside masonry grids
9. Check contrast against `#FDF8F0` — warm background shifts the math
