import './global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout component for the entire application.
 *
 * Responsible for:
 * - Importing global NativeWind CSS.
 * - Preventing the splash screen from hiding automatically.
 * - Hiding the splash screen after a 500 ms grace period.
 * - Defining the root `Stack` navigator with all top-level route groups.
 *
 * Route groups registered:
 * - `index`  — auth redirect gate
 * - `(auth)` — unauthenticated flows (login)
 * - `(app)`  — authenticated main tab area
 * - `admin`  — administration panel
 * - `player` — fullscreen video player
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heavitas: require('../assets/fonts/Heavitas.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="cms" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
