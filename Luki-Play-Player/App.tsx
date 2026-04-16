import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { useAuthStore } from './src/store/authStore';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';

const RootNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : isAuthenticated ? (
        <HomeScreen />
      ) : (
        <LoginScreen />
      )}
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
