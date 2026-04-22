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
          purple: '#240046', // Russian Violet
          lightPurple: '#60269E', // Rebecca Purple 
          accent: '#FFB800', // Selective Yellow
          background: '#0D001A', // Deep background
          dark: '#140026', // Dark background
          surface: '#1A0033', // Cards surface
          white: '#FAF6E7', // Cosmic Latte
          gray: '#B07CC6', // African Violet
          gold: '#FFB800', // Selective Yellow
        }
      }
    },
  },
  plugins: [],
}