/**
 * Metro bundler configuration for the LUKI App.
 *
 * Wraps Expo's default Metro config with `withNativeWind` so that NativeWind
 * can process `./app/global.css` via PostCSS/Tailwind at bundle time,
 * injecting the generated styles into the React Native component tree.
 */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./app/global.css" });