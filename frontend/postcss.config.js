/**
 * PostCSS configuration used by Metro (via NativeWind) and by the Expo web
 * build to compile Tailwind CSS utility classes from `app/global.css`.
 * The `tailwindcss` plugin reads `tailwind.config.js` to determine which
 * classes to include and applies the LUKI theme extensions.
 */
module.exports = {
    plugins: {
        tailwindcss: {},
    },
};