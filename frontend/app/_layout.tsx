import './global.css';
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
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}