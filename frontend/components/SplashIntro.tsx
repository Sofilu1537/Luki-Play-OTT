import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Platform, Image } from 'react-native';

const LOGO = require('../assets/branding/logo.png');

interface Props {
  onFinish: () => void;
}

export default function SplashIntro({ onFinish }: Props) {
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      // The splash overlay is injected via app/+html.tsx and removed by an
      // inline script after 3 s. We just need to call onFinish in sync.
      const t = setTimeout(() => onFinish(), 3100);
      return () => clearTimeout(t);
    }

    // Native: full Animated sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(logoScale, { toValue: 1, duration: 700, useNativeDriver: false }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
        Animated.timing(logoScale, { toValue: 1.15, duration: 600, useNativeDriver: false }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ]).start(() => onFinish());
  }, []);

  if (Platform.OS === 'web') {
    // On web, the splash is rendered directly in app/+html.tsx (HTML template)
    // before React loads. Nothing to render here — just call onFinish after the
    // CSS animation completes so the app can mount normally.
    return null;
  }

  const { width } = Dimensions.get('window');
  const logoSize = Math.min(width * 0.42, 190);

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image source={LOGO} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0014',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
});
