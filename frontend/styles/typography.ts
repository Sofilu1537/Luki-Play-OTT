/**
 * Font family tokens — usa las fuentes locales cargadas en _layout.tsx
 * assets/fonts/Heavitas.ttf, Montserrat-Regular.ttf, Montserrat-SemiBold.ttf, Montserrat-Bold.ttf
 */
export const FONT_FAMILY = {
  hero:         'Heavitas',
  heading:      'Heavitas',
  headingBold:  'Heavitas',
  body:         'Montserrat-Regular',
  bodySemiBold: 'Montserrat-SemiBold',
  bodyBold:     'Montserrat-Bold',
  mono:         'monospace',
} as const;

/** Escala tipográfica según el manual de marca Luki Play */
export const TYPE_SCALE = {
  h1:       { fontSize: 34, fontWeight: '700' as const, lineHeight: 37, fontFamily: 'Heavitas'            },
  h2:       { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, fontFamily: 'Heavitas'            },
  h3:       { fontSize: 22, fontWeight: '700' as const, lineHeight: 29, fontFamily: 'Heavitas'            },
  h4:       { fontSize: 17, fontWeight: '600' as const, lineHeight: 24, fontFamily: 'Heavitas'            },
  bodyLg:   { fontSize: 15, fontWeight: '600' as const, lineHeight: 23, fontFamily: 'Montserrat-SemiBold' },
  body:     { fontSize: 14, fontWeight: '600' as const, lineHeight: 20, fontFamily: 'Montserrat-SemiBold' },
  bodySm:   { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, fontFamily: 'Montserrat-SemiBold' },
  caption:  { fontSize: 12, fontWeight: '700' as const, lineHeight: 16, fontFamily: 'Montserrat-Bold'     },
  overline: { fontSize: 10, fontWeight: '800' as const, lineHeight: 12, fontFamily: 'Montserrat-Bold', letterSpacing: 1.2, textTransform: 'uppercase' as const },
  badge:    { fontSize: 9,  fontWeight: '800' as const, lineHeight: 10, fontFamily: 'Montserrat-Bold'     },
} as const;
