import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, Platform, View } from 'react-native';
import LukiPlayLogo from './LukiPlayLogo';

const { width } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export default function SplashIntro({ onFinish }: Props) {
  const bgOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: CSS animation handles logo; JS controls bg fade-out
      const fadeOut = setTimeout(() => {
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }).start(() => onFinish());
      }, 1600); // hold 1.6s then fade out
      return () => clearTimeout(fadeOut);
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
        Animated.timing(logoScale, { toValue: 1.2, duration: 600, useNativeDriver: false }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]),
    ]).start(() => onFinish());
  }, []);

  const logoSize = Math.min(width * 0.42, 190);

  if (Platform.OS === 'web') {
    return (
      <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
        {/* Use inline style with CSS animation for web */}
        <View style={webLogoContainerStyle}>
          <LukiPlayLogo variant="full" size={logoSize} />
        </View>
        <style>{`
          @keyframes lukiSplashIn {
            0%   { opacity: 0; transform: scale(0.55); }
            40%  { opacity: 1; transform: scale(1); }
            80%  { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.2); }
          }
          .luki-splash-logo {
            animation: lukiSplashIn 2.2s ease forwards;
          }
        `}</style>
        <div className="luki-splash-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LukiPlayLogo variant="full" size={logoSize} />
        </div>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <LukiPlayLogo variant="full" size={logoSize} />
      </Animated.View>
    </Animated.View>
  );
}

const webLogoContainerStyle = { display: 'none' as const };

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
