/**
 * CMS Login Screen.
 *
 * Email + password form for internal users (SUPPORT and SUPERADMIN).
 * Calls POST /auth/cms/login — does NOT require OTP.
 * On success redirects to /cms/dashboard.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';

export default function CmsLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { cmsLogin, cmsRestoreSession, isAuthenticated, isLoading, error, clearError } =
    useCmsStore();
  const router = useRouter();

  // Restore session and redirect if already authenticated
  useEffect(() => {
    cmsRestoreSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/cms/dashboard' as any);
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email.trim()) return;
    if (!password) return;
    clearError();
    try {
      await cmsLogin(email.trim().toLowerCase(), password);
      router.replace('/cms/dashboard' as any);
    } catch {
      // Error is set in the store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Card */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.logo}>🎬</Text>
            <Text style={styles.title}>Luki Play</Text>
            <Text style={styles.subtitle}>Panel de Administración</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="soporte@lukiplay.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  editable={!isLoading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer hint */}
          <Text style={styles.hint}>
            Solo para usuarios internos de Luki Play.{'\n'}
            Acceso restringido a roles SUPPORT y SUPERADMIN.
          </Text>
        </View>

        {/* Test credentials (development only) */}
        <View style={styles.devHints}>
          <Text style={styles.devTitle}>Credenciales de prueba</Text>
          <TouchableOpacity
            onPress={() => { setEmail('soporte@lukiplay.com'); setPassword('password123'); }}
            style={styles.devBtn}
          >
            <Text style={styles.devBtnText}>soporte@lukiplay.com — SUPPORT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setEmail('admin@lukiplay.com'); setPassword('password123'); }}
            style={styles.devBtn}
          >
            <Text style={styles.devBtnText}>admin@lukiplay.com — SUPERADMIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = '#0F172A';
const CARD_BG = '#1E293B';
const BORDER = '#334155';
const INPUT_BG = '#0F172A';
const ACCENT = '#3B82F6';
const TEXT = '#F1F5F9';
const TEXT_MUTED = '#94A3B8';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 36,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: TEXT,
  },
  passwordWrapper: {
    flexDirection: 'row',
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: TEXT,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorBox: {
    backgroundColor: '#450A0A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  // Dev hints
  devHints: {
    marginTop: 24,
    width: '100%',
    maxWidth: 420,
    gap: 8,
    alignItems: 'center',
  },
  devTitle: {
    color: TEXT_MUTED,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  devBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    width: '100%',
    alignItems: 'center',
  },
  devBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
});
