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

// exceljs y jszip usan APIs de Node.js que Metro no puede resolver en mobile.
// Como el export Excel solo se ejecuta en web (Platform.OS !== 'web' guard),
// devolvemos un módulo vacío para iOS/Android.
const WEB_ONLY_MODULES = ['exceljs', 'jszip', 'archiver', 'fflate'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web') {
    const isWebOnly = WEB_ONLY_MODULES.some(
      (m) => moduleName === m || moduleName.startsWith(m + '/'),
    );
    if (isWebOnly) return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./app/global.css" });
