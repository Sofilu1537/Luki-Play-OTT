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
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 600 }}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <LukiPlayLogo variant="full" size={100} />
          <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 16 }}>
            Luki Play CMS
          </Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 6 }}>
            Panel de administración interna
          </Text>
        </View>

        {/* Card */}
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: '#1E293B',
            borderRadius: 20,
            padding: 28,
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 24 }}>
            Iniciar sesión
          </Text>

          {/* Email */}
          <Text
            style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}
          >
            EMAIL
          </Text>
          <View
            style={{
              backgroundColor: '#0F172A',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: error && !email ? '#F87171' : '#334155',
              marginBottom: 16,
            }}
          >
            <TextInput
              style={{
                color: 'white',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              placeholder="admin@lukiplay.com"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
            />
          </View>

          {/* Password */}
          <Text
            style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}
          >
            CONTRASEÑA
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#0F172A',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: error && !password ? '#F87171' : '#334155',
              marginBottom: 8,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                color: 'white',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setShowPass(!showPass)}>
              <FontAwesome name={showPass ? 'eye-slash' : 'eye'} size={17} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <Text style={{ color: '#F87171', fontSize: 13, marginBottom: 16 }}>{error}</Text>
          ) : (
            <View style={{ marginBottom: 16 }} />
          )}

          {/* Submit */}
          <TouchableOpacity
            style={{
              backgroundColor: '#6D28D9',
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              opacity: isLoading ? 0.7 : 1,
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Ingresar al CMS</Text>
            )}
          </TouchableOpacity>

          {/* Hint */}
          <Text style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            Solo usuarios internos autorizados
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
