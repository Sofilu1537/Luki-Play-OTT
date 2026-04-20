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
}

export const darkTheme: ThemeTokens = {
  bodyBg:       '#090909',
  cardBg:       'rgba(18,18,18,0.92)',
  surfaceBg:    'rgba(24,24,24,0.86)',
  liftBg:       'rgba(34,34,34,0.96)',
  headerBg:     'rgba(20,20,20,0.92)',
  border:       'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(255,184,0,0.28)',
  text:         '#FAF6E7',
  textSec:      'rgba(250,246,231,0.65)',
  textMuted:    'rgba(250,246,231,0.38)',
  accent:       '#FFB800',
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
};

export const lightTheme: ThemeTokens = {
  bodyBg:       '#F5F3EE',
  cardBg:       '#FFFFFF',
  surfaceBg:    '#EEE9E2',
  liftBg:       '#E4DED7',
  headerBg:     'rgba(255,255,255,0.96)',
  border:       'rgba(0,0,0,0.08)',
  borderAccent: 'rgba(255,184,0,0.40)',
  text:         '#1A1A2E',
  textSec:      'rgba(26,26,46,0.65)',
  textMuted:    'rgba(26,26,46,0.38)',
  accent:       '#FFB800',
  accentSoft:   'rgba(255,184,0,0.12)',
  accentBorder: 'rgba(255,184,0,0.38)',
  accentLight:  '#CC9200',
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
};

/** Sidebar always stays dark regardless of app theme. */
export const SIDEBAR = {
  bg1:         'rgba(17,17,17,0.97)',
  bg2:         'rgba(12,12,12,0.99)',
  border:      'rgba(255,255,255,0.06)',
  sectionLabel:'rgba(255,255,255,0.22)',
  text:        '#FAF6E7',
  textMuted:   'rgba(250,246,231,0.38)',
  iconDefault: 'rgba(250,246,231,0.42)',
  hoverBg:     'rgba(255,255,255,0.04)',
  activeText:  '#FFB800',
  activeBg:    'rgba(255,198,41,0.11)',
  activeBorder:'#FFB800',
  footerBorder:'rgba(255,255,255,0.06)',
} as const;
