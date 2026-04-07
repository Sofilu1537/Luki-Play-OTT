import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import LukiPlayLogo from '../../components/LukiPlayLogo';

/**
 * CMS Login screen — for internal users (SUPPORT and SUPERADMIN).
 *
 * Authenticates via email + password directly.
 * Does NOT use contract number or OTP.
 * Calls POST /auth/cms/login through useCmsStore.
 *
 * Demo credentials:
 *   soporte@lukiplay.com / password123  (SUPPORT)
 *   admin@lukiplay.com   / password123  (SUPERADMIN)
 */
export default function CmsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading, profile } = useCmsStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (profile) {
      router.replace('/cms/dashboard' as never);
    }
  }, [profile, router]);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace('/cms/dashboard' as never);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Credenciales inválidas';
      setError(message);
    }
  };

  return (
    <LinearGradient
      colors={['#1a0040', '#2e0a6e', '#4a18a0', '#2e0a6e']}
      locations={[0, 0.4, 0.7, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Bokeh orbs */}
      <View style={{ position: 'absolute', top: -80, right: -60, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(123,47,190,0.25)' }} />
      <View style={{ position: 'absolute', bottom: -40, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(90,30,158,0.20)' }} />
      <View style={{ position: 'absolute', top: '40%', left: '10%', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,184,0,0.06)' }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, minHeight: 600 }}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <LukiPlayLogo variant="full" size={100} />
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 16 }}>
              Luki Play CMS
            </Text>
            <Text style={{ color: '#8B72B2', fontSize: 13, marginTop: 6 }}>
              Panel de administración interna
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: 'rgba(42, 14, 90, 0.88)',
              borderRadius: 24,
              padding: 28,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
              shadowColor: '#0D0020',
              shadowOpacity: 0.5,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 20 },
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 24 }}>
              Iniciar sesión
            </Text>

            {/* Email */}
            <Text
              style={{ color: '#D0C4E8', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}
            >
              EMAIL
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(70, 28, 130, 0.92)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: error && !email ? '#F43F5E' : 'rgba(255,255,255,0.10)',
                marginBottom: 16,
              }}
            >
              <TextInput
                style={{
                  color: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
                }}
                placeholder="admin@lukiplay.com"
                placeholderTextColor="#8B72B2"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
              />
            </View>

            {/* Password */}
            <Text
              style={{ color: '#D0C4E8', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}
            >
              CONTRASEÑA
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(70, 28, 130, 0.92)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: error && !password ? '#F43F5E' : 'rgba(255,255,255,0.10)',
                marginBottom: 8,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
                }}
                placeholder="••••••••"
                placeholderTextColor="#8B72B2"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setShowPass(!showPass)}>
                <FontAwesome name={showPass ? 'eye-slash' : 'eye'} size={17} color="#8B72B2" />
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error ? (
              <Text style={{ color: '#F43F5E', fontSize: 13, marginBottom: 16 }}>{error}</Text>
            ) : (
              <View style={{ marginBottom: 16 }} />
            )}

            {/* Submit — gold CTA with glow */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FFB800',
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1,
                shadowColor: '#FFB800',
                shadowOpacity: 0.3,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
              }}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#160035" />
              ) : (
                <Text style={{ color: '#160035', fontWeight: '800', fontSize: 16 }}>Ingresar al CMS</Text>
              )}
            </TouchableOpacity>

            {/* Hint */}
            <Text style={{ color: '#8B72B2', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
              Solo usuarios internos autorizados
            </Text>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
}
