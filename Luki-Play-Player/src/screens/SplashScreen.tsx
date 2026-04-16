import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image, Easing } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useAppTheme();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // 1. Animación de entrada estilo Netflix (Glow & Scale)
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Ejecutar validación de credenciales localmente contra el servidor
    const initializeApp = async () => {
      await checkAuth();
      // Pequeño delay adicional para mostrar la marca
      setTimeout(() => {
        // Fade out
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, 2500); 
    };

    initializeApp();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
        <Image 
          source={require('../../assets/lukiplay.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 120,
  },
});
