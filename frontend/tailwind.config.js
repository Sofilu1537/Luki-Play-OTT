/**
 * Tailwind CSS configuration for LUKI App.
 *
 * - `content` scans all TypeScript/TSX files so unused classes are purged in
 *   production builds.
 * - `theme.extend.colors` adds LUKI brand tokens (`luki-*`) that can be used
 *   as Tailwind utility classes anywhere in the codebase.
 * - NativeWind reads this file to generate the CSS that Metro bundles.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        luki: {
          purple: '#240046',      // COLORS.russianViolet (was #4A148C)
          lightPurple: '#7c43bd',
          accent: '#FFB800',      // COLORS.selectiveYellow (was #FFC107)
          background: '#050B17',  // APP.bodyBg — Nebula Dark
          dark: '#0F041C',        // APP.tabBar — tab bar & gradient end (was #070E1D)
          surface: '#1A052E',     // APP.surface — card/panel surface (was #0C1829)
          white: '#ffffff',
          gray: '#94A3B8',        // APP.textMuted — muted labels
          gold: '#FFB800',        // same as accent (explicit semantic alias)
          danger: '#D1105A',      // COLORS.roseRed
          success: '#17D1C6',     // COLORS.robinEggBlue
          info: '#1E96FC',        // COLORS.dodgerBlue
        }
      }
    },
  },
  plugins: [],
}