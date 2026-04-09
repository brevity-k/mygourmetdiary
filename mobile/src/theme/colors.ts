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
