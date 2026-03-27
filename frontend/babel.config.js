/**
 * Babel configuration for the LUKI App.
 *
 * - `babel-preset-expo` compiles JSX and TypeScript for Expo / React Native.
 * - `jsxImportSource: 'nativewind'` enables NativeWind's className prop on
 *   React Native components without an explicit import.
 * - `nativewind/babel` transforms `className` strings at build time.
 * - `react-native-reanimated/plugin` must be last because it relies on
 *   Babel's code generation after all other transforms have run.
 */
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            "react-native-reanimated/plugin",
        ],
    };
};