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
      const fadeOut = setTimeout(() => {
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }).start(() => onFinish());
      }, 1600);
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

  // Web: renderizar con puro HTML/CSS para evitar problemas con Dimensions=0 (SSR)
  // y position:absolute que no cubre el viewport sin padre dimensionado.
  if (Platform.OS === 'web') {
    return (
      <>
        <style>{`
          #luki-splash-overlay {
            position: fixed;
            inset: 0;
            background: #0A0014;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.6s ease;
          }
          #luki-splash-overlay.fade-out {
            opacity: 0;
            pointer-events: none;
          }
          @keyframes lukiSplashIn {
            0%   { opacity: 0; transform: scale(0.55); }
            40%  { opacity: 1; transform: scale(1);    }
            80%  { opacity: 1; transform: scale(1);    }
            100% { opacity: 0; transform: scale(1.15); }
          }
          #luki-splash-logo {
            width: min(42vw, 190px);
            height: min(42vw, 190px);
            animation: lukiSplashIn 2.2s ease forwards;
            object-fit: contain;
          }
        `}</style>
        <div id="luki-splash-overlay">
          <img id="luki-splash-logo" src={(LOGO as any).default ?? LOGO} alt="LUKI Play" />
        </div>
      </>
    );
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

