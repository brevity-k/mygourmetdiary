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
