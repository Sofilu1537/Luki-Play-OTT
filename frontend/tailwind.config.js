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
          purple: '#4A148C',
          lightPurple: '#7c43bd',
          accent: '#FFC107', // Yellow dots from logo
          background: '#2A0E47', // A bit lighter than deep purple for main BG
          dark: '#1A052E', // Deep background
          white: '#ffffff',
          gray: '#9E9E9E',
        }
      }
    },
  },
  plugins: [],
}