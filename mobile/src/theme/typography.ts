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
