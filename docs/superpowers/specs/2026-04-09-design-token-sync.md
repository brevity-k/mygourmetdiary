# MyGourmetDiary — Design Token Sync Spec

> **Date:** 2026-04-09
> **Status:** Draft
> **Scope:** Web + mobile theme token alignment with DESIGN.md "Warm Precision" system
> **Approach:** Update design tokens + load custom fonts. No component-level changes.

---

## 1. Goal

Align web (`globals.css`) and mobile (`theme/*.ts`) design tokens with the DESIGN.md specification so every existing component automatically picks up the refined colors, shadows, borders, radius, and typography. Load Cormorant and DM Sans fonts on both platforms.

## 2. What Changes

### 2.1 Web — `web/src/app/globals.css`

**Colors (update existing CSS variables):**

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `--color-accent` | `#C2703E` | `#A0522D` | WCAG AA compliance (3.50:1 → 4.89:1) |
| `--color-accent-light` | `#E8A87C` | `#E8A87C` | No change |
| `--color-rating-active` | `#D4A574` | `#A07628` | WCAG AA Large (2.11:1 → 3.88:1) |
| `--color-error` | `#C0392B` | `#B33A2E` | Warmer tone, better contrast (5.58:1) |
| `--color-warning` | `#D4A017` | `#8B6914` | Contrast correction |
| `--color-border` | `#E8DDD0` | `rgba(44,24,16,0.08)` | Whisper border (from Notion) |
| `--color-border-light` | `#F0E8DC` | `rgba(44,24,16,0.05)` | Lighter whisper |
| `--color-input` | `#E8DDD0` | `rgba(44,24,16,0.12)` | Standard border for inputs |

**New CSS variables to add:**

```css
--color-surface-alt: #F7F1E8;
--color-primary-hover: #7A3B10;

--shadow-card: rgba(44,24,16,0.02) 0px 0px 0px 1px,
              rgba(44,24,16,0.04) 0px 2px 6px,
              rgba(44,24,16,0.08) 0px 4px 8px;
--shadow-hover: rgba(44,24,16,0.04) 0px 4px 12px;
--shadow-elevated: rgba(44,24,16,0.03) 0px 4px 18px,
                   rgba(44,24,16,0.02) 0px 2px 8px,
                   rgba(44,24,16,0.01) 0px 1px 3px;
```

**Radius (update):**

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `--radius-sm` | `0.375rem` (6px) | `0.5rem` (8px) | Buttons, inputs |
| `--radius-md` | `0.5rem` (8px) | `0.75rem` (12px) | Compact cards |
| `--radius-lg` | `0.75rem` (12px) | `1rem` (16px) | Full cards |
| `--radius-xl` | `1rem` (16px) | `1rem` (16px) | No change |

**New radius variable:**

```css
--radius-pill: 9999px;
```

**Font loading (update `web/src/app/layout.tsx`):**

Add Google Fonts import for Cormorant and DM Sans via `next/font/google`:

```typescript
import { Cormorant, DM_Sans } from 'next/font/google';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});
```

Apply to `<body className={`${cormorant.variable} ${dmSans.variable}`}>`.

Remove the raw `@theme` font declarations (Cormorant and DM Sans strings) since `next/font` handles them via CSS variables.

### 2.2 Mobile — `mobile/src/theme/colors.ts`

**Updates:**

| Key | Current | New | Reason |
|-----|---------|-----|--------|
| `accent` | `#C2703E` | `#A0522D` | WCAG AA alignment with web |
| `accentLight` | `#E8A87C` | `#E8A87C` | No change |
| `ratingActive` | `#D4A574` | `#A07628` | Contrast correction |
| `error` | `#C0392B` | `#B33A2E` | Warmer, aligned with web |
| `warning` | `#D4A017` | `#8B6914` | Contrast correction |
| `border` | `#E8DDD0` | Keep `#E8DDD0` | RN doesn't support rgba border natively in all contexts; keep solid hex. Whisper effect achieved via opacity on web only. |
| `borderLight` | `#F0E8DC` | Keep `#F0E8DC` | Same reason |

**New keys to add:**

```typescript
surfaceAlt: '#F7F1E8',
primaryHover: '#7A3B10',
```

### 2.3 Mobile — `mobile/src/theme/typography.ts`

**Updates:**

| Key | Current | New | Reason |
|-----|---------|-----|--------|
| `fonts.heading` | `'System'` | `'Cormorant_700Bold'` | Load via expo-font |
| `fonts.body` | `'System'` | `'DMSans_400Regular'` | Load via expo-font |
| `h1.fontSize` | 28 | 24 | Align with DESIGN.md scale |
| `h1.letterSpacing` | (none) | -0.3 | Negative tracking on headings |
| `h2.fontSize` | 22 | 20 | Align with DESIGN.md scale |
| `h2.letterSpacing` | (none) | -0.2 | Negative tracking |
| `body.fontSize` | 16 | 15 | Align with DESIGN.md |
| `button.letterSpacing` | 0.3 | 0.3 | No change |
| `badge` (new) | — | `{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }` | Pill badge text |

### 2.4 Mobile — `mobile/src/theme/spacing.ts`

**Border radius updates:**

| Key | Current | New | Reason |
|-----|---------|-----|--------|
| `borderRadius.sm` | 6 | 8 | Buttons, inputs (align with web) |
| `borderRadius.md` | 12 | 12 | Compact cards (no change) |
| `borderRadius.lg` | 16 | 16 | Full cards (no change) |
| `borderRadius.pill` | 20 | 9999 | True pill for badges |

**New shadow values — create `mobile/src/theme/shadows.ts`:**

```typescript
export const shadows = {
  card: {
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  hover: {
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;
```

Export from `mobile/src/theme/index.ts`.

### 2.5 Mobile — Font Loading (`mobile/App.tsx`)

Install and load fonts via expo-font:

```bash
npx expo install @expo-google-fonts/cormorant @expo-google-fonts/dm-sans expo-font
```

In `App.tsx`, use `useFonts()` hook:

```typescript
import { useFonts, Cormorant_600SemiBold, Cormorant_700Bold } from '@expo-google-fonts/cormorant';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';

const [fontsLoaded] = useFonts({
  Cormorant_600SemiBold,
  Cormorant_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
});
```

Hold splash screen until fonts load. Update `typography.ts` font family references to match loaded font names.

## 3. Files Changed

| File | Action | Description |
|------|--------|-------------|
| `web/src/app/globals.css` | Modify | Update colors, add shadows, update radius, add new variables |
| `web/src/app/layout.tsx` | Modify | Add next/font imports for Cormorant + DM Sans |
| `mobile/src/theme/colors.ts` | Modify | Update 4 color values, add 2 new keys |
| `mobile/src/theme/typography.ts` | Modify | Update font families, sizes, add letterSpacing, add badge style |
| `mobile/src/theme/spacing.ts` | Modify | Update borderRadius.sm and borderRadius.pill |
| `mobile/src/theme/shadows.ts` | Create | Brown-tinted shadow presets for RN |
| `mobile/src/theme/index.ts` | Modify | Export shadows |
| `mobile/App.tsx` | Modify | Load Cormorant + DM Sans via expo-font |
| `mobile/package.json` | Modify | Add @expo-google-fonts/cormorant, @expo-google-fonts/dm-sans |

## 4. What Does NOT Change

- No component files modified (cards, buttons, badges, inputs, navigation)
- No layout changes (no masonry grid, no list view toggle)
- No new pages or routes
- No API changes
- No Prisma schema changes

Components that reference theme tokens (`colors.primary`, `colors.accent`, `borderRadius.sm`, etc.) will automatically pick up the new values. Components with hardcoded values will be addressed in a future component redesign phase.

## 5. Verification

- `npm run build` passes (web)
- `npm run typecheck` passes (web + mobile)
- `npm test` passes (web)
- Visual check: open web dev server, confirm Cormorant headings render, shadows appear on cards, whisper borders visible
- Mobile: `expo start`, confirm fonts load (no System fallback), colors match web

## 6. Risk

| Risk | Mitigation |
|------|------------|
| Cormorant/DM Sans fail to load | `display: 'swap'` ensures fallback renders immediately. Web: next/font handles gracefully. Mobile: splash screen held until fonts ready. |
| Whisper borders invisible on some screens | Only affects web (rgba borders). Mobile keeps solid hex borders. Can always increase opacity if too subtle. |
| Radius change breaks existing layouts | 6px→8px and 20px→9999px are the only changes. Both are cosmetic, no layout shift. |
| expo-font package conflicts | Use `npx expo install` which resolves compatible versions automatically. |
