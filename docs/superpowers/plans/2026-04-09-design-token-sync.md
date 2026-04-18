# Design Token Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align web and mobile design tokens with the DESIGN.md "Warm Precision" specification — colors, shadows, borders, radius, and font loading.

**Architecture:** Update theme token files on both platforms (globals.css for web, theme/*.ts for mobile). Load Cormorant and DM Sans fonts via next/font (web) and expo-font (mobile). No component files are modified — existing components pick up new values through theme references.

**Tech Stack:** Tailwind 4 CSS variables, next/font/google, @expo-google-fonts/*, expo-font, React Native StyleSheet

**Spec:** `docs/superpowers/specs/2026-04-09-design-token-sync.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `web/src/app/globals.css` | Modify | All web CSS variables (colors, shadows, borders, radius) |
| `web/src/app/layout.tsx` | Modify | Font loading via next/font/google |
| `mobile/src/theme/colors.ts` | Modify | Mobile color tokens |
| `mobile/src/theme/typography.ts` | Modify | Font families, sizes, letterSpacing |
| `mobile/src/theme/spacing.ts` | Modify | Border radius values |
| `mobile/src/theme/shadows.ts` | Create | Brown-tinted RN shadow presets |
| `mobile/src/theme/index.ts` | Modify | Export shadows |
| `mobile/App.tsx` | Modify | Font loading via expo-font |
| `mobile/package.json` | Modify | Add font dependencies |

---

### Task 1: Update web CSS variables — colors

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Update color variables in globals.css**

Replace the `@theme` block color values:

```css
@theme {
  --font-heading: "Cormorant", serif;
  --font-body: "DM Sans", sans-serif;

  --color-background: #FDF8F0;
  --color-foreground: #2C1810;

  --color-primary: #8B4513;
  --color-primary-light: #A0522D;
  --color-primary-dark: #654321;
  --color-primary-foreground: #FFFFFF;
  --color-primary-hover: #7A3B10;

  --color-accent: #A0522D;
  --color-accent-light: #E8A87C;
  --color-accent-foreground: #FFFFFF;

  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFF9F2;
  --color-surface-alt: #F7F1E8;

  --color-muted: #F0E8DC;
  --color-muted-foreground: #6B5B4F;

  --color-card: #FFFFFF;
  --color-card-foreground: #2C1810;

  --color-border: rgba(44,24,16,0.08);
  --color-border-light: rgba(44,24,16,0.05);

  --color-input: rgba(44,24,16,0.12);
  --color-ring: #8B4513;

  --color-success: #4A7C59;
  --color-error: #B33A2E;
  --color-warning: #8B6914;

  --color-rating-active: #A07628;
  --color-rating-inactive: #E8DDD0;

  --color-skeleton: #F0E8DC;

  --color-destructive: #B33A2E;
  --color-destructive-foreground: #FFFFFF;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1rem;
  --radius-pill: 9999px;

  --shadow-card: rgba(44,24,16,0.02) 0px 0px 0px 1px,
                 rgba(44,24,16,0.04) 0px 2px 6px,
                 rgba(44,24,16,0.08) 0px 4px 8px;
  --shadow-hover: rgba(44,24,16,0.04) 0px 4px 12px;
  --shadow-elevated: rgba(44,24,16,0.03) 0px 4px 18px,
                     rgba(44,24,16,0.02) 0px 2px 8px,
                     rgba(44,24,16,0.01) 0px 1px 3px;
}
```

Keep the `@layer base` section unchanged.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors. Tailwind 4 resolves the new CSS variables.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/globals.css
git commit -m "style: update web CSS tokens — contrast-corrected colors, whisper borders, warm shadows, pill radius"
```

---

### Task 2: Load fonts on web via next/font

**Files:**
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Read current layout.tsx**

Read `web/src/app/layout.tsx` to understand the current structure and imports.

- [ ] **Step 2: Add next/font imports and apply to body**

Add Cormorant and DM Sans imports from `next/font/google`. Apply their CSS variable classes to the `<body>` tag:

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

On the `<body>` tag, add both font variable classes:

```tsx
<body className={`${cormorant.variable} ${dmSans.variable}`}>
```

If existing classes are already on `<body>`, append the font variables to them.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds. Next.js downloads and self-hosts the font files.

- [ ] **Step 4: Verify fonts render**

Run: `npm run dev` (manually check in browser at localhost:3001)
Expected: Headings use Cormorant (serif), body text uses DM Sans (rounded sans-serif). Check the login page and feed page.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "style: load Cormorant + DM Sans via next/font"
```

---

### Task 3: Update mobile color tokens

**Files:**
- Modify: `mobile/src/theme/colors.ts`

- [ ] **Step 1: Update color values**

Replace the full `colors` export:

```typescript
export const colors = {
  // Primary palette — warm diary aesthetic
  primary: '#8B4513', // Saddle brown
  primaryLight: '#A0522D', // Sienna
  primaryDark: '#654321',
  primaryHover: '#7A3B10',

  // Background
  background: '#FDF8F0', // Warm off-white / parchment
  surface: '#FFFFFF',
  surfaceElevated: '#FFF9F2',
  surfaceAlt: '#F7F1E8',

  // Text
  text: '#2C1810', // Near-black brown
  textSecondary: '#6B5B4F',
  textTertiary: '#9A8B7F',
  textInverse: '#FFFFFF',

  // Accent
  accent: '#A0522D', // Sienna (was #C2703E, contrast-corrected)
  accentLight: '#E8A87C',

  // Rating
  ratingActive: '#A07628', // Was #D4A574 (contrast-corrected)
  ratingInactive: '#E8DDD0',

  // Status
  success: '#4A7C59',
  error: '#B33A2E', // Was #C0392B (warmer)
  warning: '#8B6914', // Was #D4A017 (contrast-corrected)

  // Borders
  border: '#E8DDD0',
  borderLight: '#F0E8DC',

  // Misc
  skeleton: '#F0E8DC',
  overlay: 'rgba(44, 24, 16, 0.5)',
} as const;
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx --workspace=mobile tsc --noEmit`
Expected: No errors. All existing references to `colors.accent`, `colors.error`, etc. still resolve.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/theme/colors.ts
git commit -m "style: update mobile color tokens — contrast-corrected accent, rating, error, warning"
```

---

### Task 4: Update mobile typography

**Files:**
- Modify: `mobile/src/theme/typography.ts`

- [ ] **Step 1: Update font families and scale**

Replace the full file:

```typescript
import { TextStyle } from 'react-native';

export const fonts = {
  heading: 'Cormorant_700Bold',
  headingSemiBold: 'Cormorant_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
} as const;

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing' | 'fontFamily'>;

export const typography: Record<string, TypographyStyle> = {
  h1: { fontSize: 24, fontFamily: 'Cormorant_700Bold', lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontFamily: 'Cormorant_600SemiBold', lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', lineHeight: 22 },
  body: { fontSize: 15, fontFamily: 'DMSans_400Regular', lineHeight: 22.5 },
  bodyMedium: { fontSize: 15, fontFamily: 'DMSans_500Medium', lineHeight: 22.5 },
  bodySmall: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18.2 },
  caption: { fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18.2 },
  label: { fontSize: 13, fontFamily: 'DMSans_500Medium', lineHeight: 18.2 },
  badge: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', lineHeight: 14.3, letterSpacing: 0.5 },
  button: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', lineHeight: 15, letterSpacing: 0.3 },
} as const;
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx --workspace=mobile tsc --noEmit`
Expected: No errors. The `fontFamily` field is valid on `TextStyle`. Components using `typography.h1` etc. still work — they get new values but the same shape.

Note: Components that reference `fonts.heading` or `fonts.body` will need updating if they use the old two-key structure. Check for breaking references:

Run: `grep -r "fonts\.heading\|fonts\.body" mobile/src/ --include="*.ts" --include="*.tsx" | head -20`

If any component uses `fonts.heading` or `fonts.body`, they'll still work since those keys still exist. Components using `fontWeight` from the typography object may need review since we moved to `fontFamily`-based weight selection.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/theme/typography.ts
git commit -m "style: update mobile typography — Cormorant headings, DM Sans body, aligned scale"
```

---

### Task 5: Update mobile spacing and create shadows

**Files:**
- Modify: `mobile/src/theme/spacing.ts`
- Create: `mobile/src/theme/shadows.ts`
- Modify: `mobile/src/theme/index.ts`

- [ ] **Step 1: Update borderRadius in spacing.ts**

Replace the `borderRadius` export:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,      // Was 6. Buttons, inputs.
  md: 12,     // Compact cards. No change.
  lg: 16,     // Full cards. No change.
  pill: 9999, // Was 20. True pill for badges.
  xl: 24,     // No change.
  full: 9999, // No change.
} as const;
```

- [ ] **Step 2: Create shadows.ts**

Create `mobile/src/theme/shadows.ts`:

```typescript
import { ViewStyle } from 'react-native';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

export const shadows: Record<string, ShadowStyle> = {
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

- [ ] **Step 3: Export shadows from index.ts**

Update `mobile/src/theme/index.ts`:

```typescript
export { colors } from './colors';
export { typography, fonts } from './typography';
export { spacing, borderRadius } from './spacing';
export { shadows } from './shadows';
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npx --workspace=mobile tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/theme/spacing.ts mobile/src/theme/shadows.ts mobile/src/theme/index.ts
git commit -m "style: update mobile radius, add brown-tinted shadow presets"
```

---

### Task 6: Load fonts on mobile via expo-font

**Files:**
- Modify: `mobile/App.tsx`
- Modify: `mobile/package.json` (via npm install)

- [ ] **Step 1: Install font packages**

Run from project root:

```bash
cd mobile && npx expo install @expo-google-fonts/cormorant @expo-google-fonts/dm-sans expo-font && cd ..
```

Expected: Packages install successfully, compatible with Expo SDK 54.

- [ ] **Step 2: Read current App.tsx**

Read `mobile/App.tsx` to understand current structure (splash screen, auth, providers).

- [ ] **Step 3: Add font loading to App.tsx**

Add font imports and `useFonts` hook. Hold splash screen until fonts load:

```typescript
import { useFonts, Cormorant_600SemiBold, Cormorant_700Bold } from '@expo-google-fonts/cormorant';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
```

Inside the App component, add before existing hooks:

```typescript
const [fontsLoaded] = useFonts({
  Cormorant_600SemiBold,
  Cormorant_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
});
```

In the loading/splash logic, add `!fontsLoaded` as an additional condition to keep the splash screen visible. The exact integration depends on the current splash screen pattern in App.tsx — read the file first.

- [ ] **Step 4: Verify the app starts**

Run: `cd mobile && npx expo start` (manually test on simulator or device)
Expected: App loads with Cormorant headings and DM Sans body text. No "System" font fallback visible.

- [ ] **Step 5: Commit**

```bash
git add mobile/App.tsx mobile/package.json
git commit -m "style: load Cormorant + DM Sans via expo-font"
```

---

### Task 7: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Web builds successfully.

- [ ] **Step 2: Run typecheck on both platforms**

Run: `npm run typecheck`
Expected: Both web and mobile typecheck clean.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All existing tests pass. No test changes needed (token updates are cosmetic).

- [ ] **Step 4: Regenerate package-lock.json**

Run: `npm install`
Expected: Lock file updated with new expo-font dependencies.

- [ ] **Step 5: Final commit**

```bash
git add package-lock.json
git commit -m "chore: sync package-lock after font dependency additions"
```
