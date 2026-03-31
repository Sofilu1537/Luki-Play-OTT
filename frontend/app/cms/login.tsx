import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../../services/cmsStore';

/**
 * CMS Login screen.
 *
 * Collects email + password and calls POST /auth/cms/login via cmsStore.
 * Does NOT require OTP — tokens are issued directly upon successful login.
 * On success, redirects to /cms/dashboard.
 *
 * This screen has a deliberately different visual style from the client app
 * login: corporate dark blue theme instead of the consumer purple gradient.
 */
export default function CmsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading, user } = useCmsStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.replace('/cms/dashboard' as never);
    }
  }, [user]);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/cms/dashboard' as never);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Credenciales inválidas';
      setError(msg);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          minHeight: '100%',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%', maxWidth: 440, alignItems: 'center' }}
        >
          {/* ── Logo ── */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: '#2563EB',
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#2563EB',
                shadowOpacity: 0.4,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <FontAwesome name="play" size={28} color="#fff" />
            </View>
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}
            >
              Luki Play CMS
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 6 }}>
              Panel de administración interno
            </Text>
          </View>

          {/* ── Card ── */}
          <View
            style={{
              width: '100%',
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 28,
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Text
              style={{
                color: '#F1F5F9',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              Iniciar sesión
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 13, marginBottom: 24 }}>
              Acceso restringido a personal autorizado
            </Text>

            {/* Error banner */}
            {!!error && (
              <View
                style={{
                  backgroundColor: '#7F1D1D',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FontAwesome name="exclamation-circle" size={14} color="#FCA5A5" />
                <Text style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Email field */}
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              CORREO ELECTRÓNICO
            </Text>
            <View
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: error && !email ? '#EF4444' : '#334155',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View style={{ paddingLeft: 14 }}>
                <FontAwesome name="envelope-o" size={15} color="#475569" />
              </View>
              <TextInput
                style={{
                  flex: 1,
                  color: '#F1F5F9',
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  fontSize: 15,
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
                }}
                placeholder="soporte@lukiplay.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Password field */}
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              CONTRASEÑA
            </Text>
            <View
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: error && !password ? '#EF4444' : '#334155',
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <View style={{ paddingLeft: 14 }}>
                <FontAwesome name="lock" size={16} color="#475569" />
              </View>
              <TextInput
                style={{
                  flex: 1,
                  color: '#F1F5F9',
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  fontSize: 15,
                  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
                }}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={{ paddingHorizontal: 14 }}
                onPress={() => setShowPass((v) => !v)}
              >
                <FontAwesome
                  name={showPass ? 'eye-slash' : 'eye'}
                  size={16}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={{
                backgroundColor: isLoading ? '#1D4ED8' : '#2563EB',
                borderRadius: 12,
                paddingVertical: 15,
                alignItems: 'center',
                opacity: isLoading ? 0.8 : 1,
              }}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}
                >
                  Ingresar al CMS
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Credentials hint — visible in development builds only */}
          {__DEV__ && (
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={{ color: '#334155', fontSize: 11 }}>
                soporte@lukiplay.com · admin@lukiplay.com · password123
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
