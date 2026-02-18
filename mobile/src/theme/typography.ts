import { TextStyle } from 'react-native';

export const fonts = {
  heading: 'System', // Will swap for Cormorant when custom fonts load
  body: 'System', // Will swap for DM Sans
} as const;

type TypographyStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TypographyStyle> = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20, letterSpacing: 0.3 },
} as const;
