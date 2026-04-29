import React, { useState } from 'react';
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
import { cmsSendRecoveryCode, cmsResetWithCode, cmsChangePassword } from '../../services/api/cmsApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import LukiPlayLogo from '../../components/LukiPlayLogo';

type Screen = 'login' | 'forgot' | 'change-password';

// ---------------------------------------------------------------------------
// Design tokens — Nebula Dark + Luki Play gold
// ---------------------------------------------------------------------------
const T = {
  bg: ['#1a0040', '#2e0a6e', '#4a18a0', '#2e0a6e'] as const,
  card: 'rgba(42, 14, 90, 0.88)',
  cardBorder: 'rgba(255,255,255,0.10)',
  input: 'rgba(70, 28, 130, 0.92)',
  inputBorder: 'rgba(255,255,255,0.10)',
  inputFocus: 'rgba(255,184,0,0.4)',
  accent: '#FFB800',
  accentSoft: 'rgba(255,184,0,0.12)',
  text: '#FFFFFF',
  textSec: '#D0C4E8',
  muted: '#8B72B2',
  error: '#F43F5E',
  errorBg: 'rgba(244,63,94,0.12)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
};

const webOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
function getPasswordStrength(pw: string): { label: string; color: string; ratio: number } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Débil', color: T.error, ratio: 0.25 };
  if (score === 2) return { label: 'Media', color: '#F59E0B', ratio: 0.5 };
  if (score === 3) return { label: 'Buena', color: T.accent, ratio: 0.75 };
  return { label: 'Fuerte', color: T.success, ratio: 1 };
}

// ---------------------------------------------------------------------------
// CmsInput
// ---------------------------------------------------------------------------
function CmsInput({
  label,
  placeholder,
  value,
  onChangeText,
  secure,
  keyboardType,
  autoCapitalize,
  errorHighlight,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'characters';
  errorHighlight?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: T.textSec,
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 8,
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: T.input,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: errorHighlight ? T.error : focused ? T.inputFocus : T.inputBorder,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            color: T.text,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            ...webOutline,
          }}
          placeholder={placeholder}
          placeholderTextColor={T.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPassword}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure ? (
          <TouchableOpacity
            style={{ paddingHorizontal: 14 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={17} color={T.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PasswordStrength indicator
// ---------------------------------------------------------------------------
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { label, color, ratio } = getPasswordStrength(password);

  return (
    <View style={{ marginTop: -8, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              backgroundColor: color,
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={{ color, fontSize: 11, fontWeight: '700', width: 48 }}>{label}</Text>
      </View>
      {ratio < 0.75 && (
        <Text style={{ color: T.muted, fontSize: 10, marginTop: 4 }}>
          Usa 8+ caracteres, una mayúscula, un número y un símbolo
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CmsPrimaryButton
// ---------------------------------------------------------------------------
function CmsPrimaryButton({
  title,
  onPress,
  isLoading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: T.accent,
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        opacity: isLoading || disabled ? 0.7 : 1,
        shadowColor: T.accent,
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
        marginTop: 4,
      }}
      onPress={onPress}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <ActivityIndicator color="#160035" />
      ) : (
        <Text style={{ color: '#160035', fontWeight: '800', fontSize: 16 }}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// ErrorBanner
// ---------------------------------------------------------------------------
function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View
      style={{
        backgroundColor: T.errorBg,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(244,63,94,0.2)',
      }}
    >
      <Text style={{ color: T.error, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LoginForm
// ---------------------------------------------------------------------------
function LoginForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useCmsStore();
  const router = useRouter();

  // Redirect handled by _layout.tsx

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
      await login({ email: email.trim().toLowerCase(), password });
      // Check if user must change password on first login
      if (useCmsStore.getState().profile?.mustChangePassword) {
        onSwitch('change-password');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Credenciales inválidas');
    }
  };

  return (
    <>
      <Text style={{ color: T.text, fontSize: 20, fontWeight: '700', marginBottom: 24 }}>
        Iniciar sesión
      </Text>

      <ErrorBanner message={error} />

      <CmsInput
        label="EMAIL"
        placeholder="admin@lukiplay.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError('');
        }}
        keyboardType="email-address"
        errorHighlight={!!error && !email.trim()}
      />

      <CmsInput
        label="CONTRASEÑA"
        placeholder="••••••••"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          setError('');
        }}
        secure
        errorHighlight={!!error && !password}
      />

      <CmsPrimaryButton title="Ingresar al CMS" onPress={handleLogin} isLoading={isLoading} />

      <TouchableOpacity
        onPress={() => onSwitch('forgot')}
        style={{ marginTop: 18, alignItems: 'center' }}
      >
        <Text style={{ color: T.accent, fontSize: 13, fontWeight: '600' }}>
          ¿Olvidaste tu contraseña?
        </Text>
      </TouchableOpacity>

      {/* Security badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 24,
          gap: 6,
          opacity: 0.7,
        }}
      >
        <FontAwesome name="lock" size={12} color={T.muted} />
        <Text style={{ color: T.muted, fontSize: 11 }}>
          Acceso restringido a personal autorizado
        </Text>
      </View>
    </>
  );
}

// ---------------------------------------------------------------------------
// ForceChangePasswordForm — shown on first login when mustChangePassword=true
// ---------------------------------------------------------------------------
function ForceChangePasswordForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { accessToken, logout } = useCmsStore();

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword) { setError('Ingresa tu contraseña actual (password123)'); return; }
    if (!newPassword) { setError('Ingresa tu nueva contraseña'); return; }
    if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres'); return; }
    if (newPassword === currentPassword) { setError('La nueva contraseña debe ser diferente a la actual'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      await cmsChangePassword(accessToken!, currentPassword, newPassword);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: T.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
            <FontAwesome name="check" size={24} color={T.success} />
          </View>
          <Text style={{ color: T.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>
            ¡Contraseña actualizada!
          </Text>
          <Text style={{ color: T.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            Tu contraseña ha sido cambiada. Inicia sesión con tu nueva contraseña.
          </Text>
        </View>
        <CmsPrimaryButton
          title="Ir al inicio de sesión"
          onPress={() => { logout(); onSwitch('login'); }}
        />
      </>
    );
  }

  return (
    <>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,184,0,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' }}>
          <FontAwesome name="lock" size={20} color={T.accent} />
        </View>
        <Text style={{ color: T.text, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
          Cambio de contraseña requerido
        </Text>
        <Text style={{ color: T.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
          Tu cuenta fue creada con una contraseña temporal. Debes establecer una contraseña personal antes de continuar.
        </Text>
      </View>

      <ErrorBanner message={error} />

      <CmsInput
        label="CONTRASEÑA ACTUAL"
        placeholder="password123"
        value={currentPassword}
        onChangeText={(t) => { setCurrentPassword(t); setError(''); }}
        secure
        errorHighlight={!!error && !currentPassword}
      />
      <CmsInput
        label="NUEVA CONTRASEÑA"
        placeholder="••••••••"
        value={newPassword}
        onChangeText={(t) => { setNewPassword(t); setError(''); }}
        secure
        errorHighlight={!!error && !newPassword}
      />
      <PasswordStrength password={newPassword} />
      <CmsInput
        label="CONFIRMAR NUEVA CONTRASEÑA"
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
        secure
        errorHighlight={!!error && newPassword !== confirmPassword}
      />

      <CmsPrimaryButton title="Cambiar contraseña" onPress={handleSubmit} isLoading={loading} />
    </>
  );
}

// ---------------------------------------------------------------------------
// ForgotPasswordForm — 3-step flow
// ---------------------------------------------------------------------------
function ForgotPasswordForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [directCode, setDirectCode] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError('');
    setInfoMessage('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('El correo electrónico es requerido');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }
    setLoading(true);
    try {
      const res = await cmsSendRecoveryCode(trimmed);
      // If the backend returns the code directly (SMTP unavailable), show it on screen
      if (res.code) {
        setDirectCode(res.code);
        setCode(res.code); // pre-fill the code input
      }
      if (step === 'email') {
        setStep('code');
      } else {
        setInfoMessage('Código generado. Cópialo de la pantalla.');
      }
    } catch (e: unknown) {
      // CMS endpoint rejects non-internal users — show the error, do NOT advance
      setError(e instanceof Error ? e.message : 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setInfoMessage('');
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Ingresa el código que recibiste por correo');
      return;
    }
    if (trimmedCode.length < 6) {
      setError('El código debe tener al menos 6 caracteres');
      return;
    }
    if (!newPassword) {
      setError('La nueva contraseña es requerida');
      return;
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe tener al menos una letra mayúscula');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe tener al menos un número');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await cmsResetWithCode(email.trim().toLowerCase(), trimmedCode, newPassword, confirmPassword);
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === 'email' ? 1 : step === 'code' ? 2 : 3;

  return (
    <>
      {/* Back link */}
      <TouchableOpacity
        onPress={() => (step === 'email' ? onSwitch('login') : setStep('email'))}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
      >
        <FontAwesome name="arrow-left" size={13} color={T.accent} />
        <Text style={{ color: T.accent, fontSize: 13, fontWeight: '600' }}>
          {step === 'email' ? 'Volver al inicio de sesión' : 'Cambiar correo'}
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          color: T.text,
          fontSize: 20,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        Recuperar contraseña
      </Text>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          marginBottom: 20,
        }}
      >
        {[1, 2, 3].map((s) => {
          const isActive = s === stepIndex;
          const isDone = s < stepIndex;
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: isDone ? T.success : isActive ? T.accent : 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isActive ? 0 : 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                {isDone ? (
                  <FontAwesome name="check" size={11} color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: isActive ? '#240046' : T.muted,
                      fontSize: 11,
                      fontWeight: '800',
                    }}
                  >
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 ? (
                <View
                  style={{
                    width: 24,
                    height: 2,
                    backgroundColor: isDone ? T.success : 'rgba(255,255,255,0.08)',
                    borderRadius: 1,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <ErrorBanner message={error} />

      {infoMessage ? (
        <View
          style={{
            backgroundColor: T.successBg,
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(16,185,129,0.2)',
          }}
        >
          <Text style={{ color: T.success, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
            {infoMessage}
          </Text>
        </View>
      ) : null}

      {/* Step 1: Email */}
      {step === 'email' ? (
        <>
          <Text
            style={{
              color: T.muted,
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            Ingresa tu correo electrónico y te enviaremos un código de verificación.
          </Text>

          <CmsInput
            label="CORREO ELECTRÓNICO"
            placeholder="tu@lukiplay.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError('');
            }}
            keyboardType="email-address"
          />

          <CmsPrimaryButton
            title="Enviar código de recuperación"
            onPress={handleSendCode}
            isLoading={loading}
          />
        </>
      ) : null}

      {/* Step 2: Code + new password */}
      {step === 'code' ? (
        <>
          <Text
            style={{
              color: T.muted,
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            {directCode
              ? 'El correo no está disponible. Copia el código de abajo y úsalo para cambiar tu contraseña.'
              : 'Ingresa el código que enviamos a tu correo y elige tu nueva contraseña.'}
          </Text>

          {/* Direct code banner — shown when SMTP is unavailable */}
          {directCode ? (
            <View
              style={{
                backgroundColor: 'rgba(34,197,94,0.10)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(34,197,94,0.30)',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FontAwesome name="key" size={18} color="#22C55E" />
              <Text style={{ color: T.textSec, fontSize: 12, textAlign: 'center' }}>
                Tu código de recuperación:
              </Text>
              <Text style={{
                color: '#22C55E',
                fontSize: 26,
                fontWeight: '900',
                letterSpacing: 6,
                fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
              }}>
                {directCode}
              </Text>
              <Text style={{ color: T.muted, fontSize: 11, textAlign: 'center' }}>
                Ya está cargado en el campo de abajo. Expira en 15 minutos.
              </Text>
            </View>
          ) : (
            /* Email confirmation banner */
            <View
              style={{
                backgroundColor: T.accentSoft,
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,184,0,0.2)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome name="envelope" size={14} color={T.accent} />
                <Text style={{ color: T.textSec, fontSize: 12, flex: 1 }}>
                  Código enviado a{' '}
                  <Text style={{ color: T.text, fontWeight: '700' }}>
                    {email.trim().toLowerCase()}
                  </Text>
                </Text>
              </View>
            </View>
          )}

          <CmsInput
            label="CÓDIGO DE VERIFICACIÓN"
            placeholder="Ej: A1B2C3D4"
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              setError('');
            }}
            autoCapitalize="characters"
          />

          <CmsInput
            label="NUEVA CONTRASEÑA"
            placeholder="Mínimo 8 caracteres"
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              setError('');
            }}
            secure
          />
          <PasswordStrength password={newPassword} />

          <CmsInput
            label="CONFIRMAR CONTRASEÑA"
            placeholder="Repite tu nueva contraseña"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setError('');
            }}
            secure
          />

          <CmsPrimaryButton
            title="Restablecer contraseña"
            onPress={handleResetPassword}
            isLoading={loading}
          />

          {/* Resend link */}
          <TouchableOpacity
            onPress={handleSendCode}
            style={{ marginTop: 16, alignItems: 'center' }}
            disabled={loading}
          >
            <Text style={{ color: T.muted, fontSize: 12 }}>
              ¿No recibiste el código?{' '}
              <Text style={{ color: T.accent, fontWeight: '600' }}>Reenviar</Text>
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      {/* Step 3: Success */}
      {step === 'done' ? (
        <>
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: T.successBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(16,185,129,0.2)',
              }}
            >
              <FontAwesome name="check" size={24} color={T.success} />
            </View>
            <Text
              style={{ color: T.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}
            >
              Contraseña actualizada
            </Text>
            <Text
              style={{
                color: T.muted,
                fontSize: 13,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Tu contraseña fue restablecida correctamente.{'\n'}Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>
          </View>
          <CmsPrimaryButton title="Iniciar sesión" onPress={() => onSwitch('login')} />
        </>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main CMS Login Screen
// ---------------------------------------------------------------------------
export default function CmsLogin() {
  const [screen, setScreen] = useState<Screen>('login');

  return (
    <LinearGradient
      colors={T.bg}
      locations={[0, 0.4, 0.7, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Bokeh orbs */}
      <View
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: 'rgba(123,47,190,0.25)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(90,30,158,0.20)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '40%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(255,184,0,0.06)',
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 28,
            minHeight: 600,
          }}
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <LukiPlayLogo variant="icon" size={120} />
            <Text
              style={{
                color: T.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginTop: 16,
              }}
            >
              LUKIPLAY CMS
            </Text>
            <Text style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
              Sistema de Administración de Contenido
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: T.card,
              borderRadius: 24,
              padding: 28,
              borderWidth: 1,
              borderColor: T.cardBorder,
              shadowColor: '#0D0020',
              shadowOpacity: 0.5,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 20 },
            }}
          >
            {screen === 'login' ? <LoginForm onSwitch={setScreen} /> : null}
            {screen === 'forgot' ? <ForgotPasswordForm onSwitch={setScreen} /> : null}
            {screen === 'change-password' ? <ForceChangePasswordForm onSwitch={setScreen} /> : null}
          </View>

          {/* Version footer */}
          <Text
            style={{
              color: T.muted,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 24,
              opacity: 0.6,
            }}
          >
            Versión v1.0.0
          </Text>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
}
