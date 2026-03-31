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

/**
 * CMS Login screen.
 *
 * Authenticates internal users (SUPPORT / SUPERADMIN) via email + password.
 * Does NOT use OTP or contract number — this is a direct email+password flow
 * against POST /auth/cms/login.
 *
 * On success, redirects to /cms/dashboard.
 */
export default function CmsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { cmsLogin, isAuthenticated, isLoading } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/cms/dashboard' as any);
  }, [isAuthenticated, router]);

  const handleLogin = async () => {
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    setError('');
    try {
      await cmsLogin(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión. Intenta nuevamente.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0f172a' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 72, height: 72, backgroundColor: '#3b82f6', borderRadius: 18,
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
          }}>
            <FontAwesome name="shield" size={30} color="#fff" />
          </View>
          <Text style={{ color: '#f1f5f9', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
            Luki Play CMS
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
            Panel de administración interno
          </Text>
        </View>

        {/* Login card */}
        <View style={{
          width: '100%', maxWidth: 420,
          backgroundColor: '#1e293b', borderRadius: 20, padding: 28,
          borderWidth: 1, borderColor: '#334155',
          shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
        }}>
          <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1 }}>
            CORREO ELECTRÓNICO
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#0f172a', borderRadius: 10,
            borderWidth: 1, borderColor: error && !email ? '#f87171' : '#334155',
            marginBottom: 16,
          }}>
            <FontAwesome name="envelope" size={14} color="#475569" style={{ marginLeft: 14 }} />
            <TextInput
              style={{
                flex: 1, color: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 13,
                fontSize: 15,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
              placeholder="soporte@lukiplay.com"
              placeholderTextColor="#334155"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              onSubmitEditing={handleLogin}
              returnKeyType="next"
            />
          </View>

          <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 1 }}>
            CONTRASEÑA
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#0f172a', borderRadius: 10,
            borderWidth: 1, borderColor: error && !password ? '#f87171' : '#334155',
            marginBottom: 20,
          }}>
            <FontAwesome name="lock" size={14} color="#475569" style={{ marginLeft: 14 }} />
            <TextInput
              style={{
                flex: 1, color: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 13,
                fontSize: 15,
                ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
              }}
              placeholder="••••••••"
              placeholderTextColor="#334155"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
            <TouchableOpacity style={{ paddingHorizontal: 14 }} onPress={() => setShowPass(!showPass)}>
              <FontAwesome name={showPass ? 'eye-slash' : 'eye'} size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={{
              backgroundColor: '#450a0a', borderRadius: 8, padding: 10,
              marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <FontAwesome name="exclamation-circle" size={14} color="#f87171" />
              <Text style={{ color: '#f87171', fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={{
              backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 15,
              alignItems: 'center', opacity: isLoading ? 0.7 : 1,
              shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Ingresar al Panel</Text>
            }
          </TouchableOpacity>

          {/* Hint for dev */}
          <View style={{ marginTop: 20, padding: 12, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#1e3a5f' }}>
            <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '600', marginBottom: 4 }}>CREDENCIALES DE PRUEBA</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>soporte@lukiplay.com / password123</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>admin@lukiplay.com / password123</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
