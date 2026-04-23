export const COLORS = {
  russianViolet:  '#240046',
  rebeccaPurple:  '#60269E',
  selectiveYellow:'#FFB800',
  cosmicLatte:    '#FAF6E7',
  roseRed:        '#D1105A',
  safetyOrange:   '#FF7900',
  dodgerBlue:     '#1E96FC',
  robinEggBlue:   '#17D1C6',
  frenchViolet:   '#7303C0',
  africanViolet:  '#B07CC6',
  spaceCadet:     '#22244E',
  wisteria:       '#AE95DA',
  melon:          '#FFB7AD',
  celeste:        '#B9FAF8',
  mintGreen:      '#D4FAE8',
} as const;

export interface ThemeTokens {
  bodyBg:       string;
  cardBg:       string;
  surfaceBg:    string;
  liftBg:       string;
  headerBg:     string;
  border:       string;
  borderAccent: string;
  text:         string;
  textSec:      string;
  textMuted:    string;
  accent:       string;
  accentSoft:   string;
  accentBorder: string;
  accentLight:  string;
  success:      string;
  successSoft:  string;
  info:         string;
  infoSoft:     string;
  danger:       string;
  dangerSoft:   string;
  warning:      string;
  warningSoft:  string;
  live:         string;
  tag:          string;
  softUiBorder: string;
  softUiShadow: string;
  softUiBorderDark: string;
  softUiShadowDark: string;
}

export const darkTheme: ThemeTokens = {
  // Backgrounds — brand palette: Russian Violet base, Rebecca Purple for surfaces
  bodyBg:       '#240046',                    // Russian Violet — fondo base de pantalla
  cardBg:       '#1A1A2E',                    // Dark card color shared across dashboard cards
  surfaceBg:    'rgba(96, 38, 158, 0.14)',    // Rebecca Purple 14% — superficies secundarias
  liftBg:       'rgba(96, 38, 158, 0.34)',    // Rebecca Purple 34% — elementos elevados (modales, popovers)
  headerBg:     '#240046',                    // Russian Violet sólido — navbar y headers
  border:       'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(255,184,0,0.28)',
  text:         '#FFFFFF',
  textSec:      'rgba(255,255,255,0.88)',
  textMuted:    'rgba(255,255,255,0.65)',
  accent:       '#FFB800',                    // Selective Yellow — acción principal
  accentSoft:   'rgba(255,184,0,0.12)',
  accentBorder: 'rgba(255,184,0,0.30)',
  accentLight:  '#FFDA6B',
  success:      '#17D1C6',
  successSoft:  'rgba(23,209,198,0.14)',
  info:         '#1E96FC',
  infoSoft:     'rgba(30,150,252,0.14)',
  danger:       '#D1105A',
  dangerSoft:   'rgba(209,16,90,0.14)',
  warning:      '#FF7900',
  warningSoft:  'rgba(255,121,0,0.14)',
  live:         '#17D1C6',
  tag:          '#B07CC6',
  softUiBorder: 'rgba(96,38,158,0.24)',
  softUiShadow: 'none',
  softUiBorderDark: 'rgba(96,38,158,0.34)',
  softUiShadowDark: '8px 8px 18px rgba(0,0,0,0.34), -6px -6px 14px rgba(118,72,170,0.10)',
};

export const lightTheme: ThemeTokens = {
  // Backgrounds — light neutral palette: white base + transparent gray surfaces
  bodyBg:       '#FFFFFF',                    // Blanco puro — fondo base de pantalla
  cardBg:       'rgba(120,120,120,0.36)',    // Gris suave más visible — tarjetas
  surfaceBg:    'rgba(120,120,120,0.28)',    // Gris suave — superficies secundarias
  liftBg:       'rgba(120,120,120,0.40)',    // Gris translúcido más sólido — elementos elevados
  headerBg:     '#240046',                    // Igual que sidebar en modo claro
  border:       'rgba(120,120,120,0.16)',    // Borde gris suave
  borderAccent: 'rgba(255,184,0,0.40)',
  text:         '#240046',                    // Russian Violet — texto primario (más on-brand que azul noche)
  textSec:      'rgba(36, 0, 70, 0.62)',
  textMuted:    'rgba(36, 0, 70, 0.42)',       // subido de 0.38 → 0.42 para pasar contraste AA
  accent:       '#FFB800',                    // Selective Yellow — acción principal
  accentSoft:   'rgba(255,184,0,0.12)',
  accentBorder: 'rgba(255,184,0,0.38)',
  accentLight:  '#CC9200',                    // Yellow más oscuro para contraste sobre fondo claro
  success:      '#17D1C6',
  successSoft:  'rgba(23,209,198,0.12)',
  info:         '#1E96FC',
  infoSoft:     'rgba(30,150,252,0.12)',
  danger:       '#D1105A',
  dangerSoft:   'rgba(209,16,90,0.12)',
  warning:      '#FF7900',
  warningSoft:  'rgba(255,121,0,0.12)',
  live:         '#17D1C6',
  tag:          '#B07CC6',
  softUiBorder: 'rgba(236,238,246,0.95)',
  softUiShadow: '10px 10px 22px rgba(24,39,75,0.13), -10px -10px 22px rgba(255,255,255,0.95)',
  softUiBorderDark: 'rgba(236,238,246,0.95)',
  softUiShadowDark: 'none',
};

/**
 * Sidebar tokens — always violet-dark regardless of app theme.
 * bg1/bg2 form the vertical LinearGradient (#240046 → #1a0033).
 */
export const SIDEBAR = {
  bg1:          '#240046',   // Russian Violet original (inicio)
  bg2:          '#3A0A68',   // Variación del mismo tono para degradado sutil
  border:       'rgba(255,255,255,0.10)',
  sectionLabel: 'rgba(250,246,231,0.28)',
  text:         '#FAF6E7',
  textMuted:    'rgba(250,246,231,0.55)',
  iconDefault:  'rgba(250,246,231,0.55)',
  hoverBg:      'rgba(255,198,41,0.06)',
  activeText:   '#FFB800',
  activeIcon:   '#FFB800',
  activeBg1:    'rgba(255,198,41,0.18)',
  activeBg2:    'rgba(255,198,41,0.05)',
  activeBorder: '#FFB800',
  footerBorder: 'rgba(255,255,255,0.10)',
  footerText:   '#17D1C6',
  footerSub:    'rgba(250,246,231,0.35)',
} as const;
