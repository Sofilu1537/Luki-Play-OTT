import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const BG = '#0F172A';
const SURFACE = '#1E293B';
const ACCENT = '#6D28D9';
const BORDER = '#334155';
const TEXT = '#F1F5F9';
const MUTED = '#94A3B8';

/**
 * CMS Login screen.
 *
 * Authenticates internal CMS users (SUPPORT / SUPERADMIN) via email + password.
 * Does NOT require OTP verification — CMS users log in directly.
 *
 * Credentials (seed data):
 *   - soporte@lukiplay.com / password123
 *   - admin@lukiplay.com   / password123
 */
export default function CmsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, isLoading, admin } = useCmsStore();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (admin) {
      router.replace('/cms/dashboard');
    }
  }, [admin]);

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('El correo es requerido'); return; }
    if (!password) { setError('La contraseña es requerida'); return; }

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/cms/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Credenciales inválidas';
      setError(message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 24 }}
    >
      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{
          width: 72, height: 72, backgroundColor: ACCENT, borderRadius: 18,
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
        }}>
          <FontAwesome name="television" size={30} color="#FFFFFF" />
        </View>
        <Text style={{ color: TEXT, fontSize: 26, fontWeight: '800' }}>Luki Play CMS</Text>
        <Text style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>Panel de administración</Text>
      </View>

      {/* Card */}
      <View style={{
        width: '100%', maxWidth: 400,
        backgroundColor: SURFACE, borderRadius: 20, padding: 28,
        borderWidth: 1, borderColor: BORDER,
        ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as any : {}),
      }}>
        {error ? (
          <View style={{ backgroundColor: '#7F1D1D33', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#F87171', fontSize: 14, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        {/* Email field */}
        <Text style={{ color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
          CORREO ELECTRÓNICO
        </Text>
        <TextInput
          style={{
            backgroundColor: BG, borderRadius: 10, borderWidth: 1,
            borderColor: BORDER, color: TEXT, paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 15, marginBottom: 16,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
          }}
          placeholder="admin@lukiplay.com"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Password field */}
        <Text style={{ color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
          CONTRASEÑA
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: BG, borderRadius: 10, borderWidth: 1,
          borderColor: BORDER, marginBottom: 24,
        }}>
          <TextInput
            style={{
              flex: 1, color: TEXT, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: 15,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={16} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={{
            backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 15,
            alignItems: 'center', opacity: isLoading ? 0.75 : 1,
          }}
        >
          {isLoading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Ingresar al CMS</Text>
          }
        </TouchableOpacity>

        <Text style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Solo para usuarios internos autorizados
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
