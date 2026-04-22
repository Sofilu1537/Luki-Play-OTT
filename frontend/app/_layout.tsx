import './global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SplashIntro from '../components/SplashIntro';

SplashScreen.preventAutoHideAsync();

// Module-level flag: splash shows exactly once per session
let _splashPlayed = false;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Heavitas: require('../assets/fonts/Heavitas.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
  });
  const [showSplash, setShowSplash] = useState(!_splashPlayed);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  function handleSplashDone() {
    _splashPlayed = true;
    setShowSplash(false);
  }

  return (
    <View style={styles.root}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="cms" options={{ headerShown: false }} />
        <Stack.Screen name="player" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      {showSplash && <SplashIntro onFinish={handleSplashDone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
