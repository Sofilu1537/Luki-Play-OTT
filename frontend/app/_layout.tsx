import './global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import SplashIntro from '../components/SplashIntro';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heavitas: require('../assets/fonts/Heavitas.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // No retornar null mientras cargan las fuentes — el SplashIntro cubre
  // el contenido de todas formas. Retornar null hace que en web el splash
  // nunca se vea porque React lo monta/desmonta antes del primer frame.
  return (
    <>
      {fontsLoaded && (
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="cms" options={{ headerShown: false }} />
          <Stack.Screen name="player" options={{ headerShown: false }} />
        </Stack>
      )}
      <StatusBar style="auto" />
      {!splashDone && <SplashIntro onFinish={() => setSplashDone(true)} />}
    </>
  );
}
