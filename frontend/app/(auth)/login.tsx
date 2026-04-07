import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef } from 'react';
import { useAuthStore } from '../../services/authStore';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import LukiPlayLogo from '../../components/LukiPlayLogo';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Screen = 'login' | 'register' | 'forgot';

const P = {
    bg: ['#240046', '#0D001A'] as const,
    card: 'rgba(36, 0, 70, 0.65)',
    cardBorder: 'rgba(96, 38, 158, 0.24)',
    input: 'rgba(255,255,255,0.07)',
    inputBorder: 'rgba(255,255,255,0.12)',
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

function AuthInput({ label, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize }: {
    label: string; placeholder: string; value: string; onChangeText: (t: string) => void;
    secure?: boolean; keyboardType?: 'email-address' | 'default'; autoCapitalize?: 'none' | 'words';
}) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: P.textSec, fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 2 }}>{label}</Text>
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: P.input,
                borderRadius: 12, borderWidth: 1,
                borderColor: focused ? P.inputFocus : P.inputBorder,
                paddingHorizontal: 14,
            }}>
                <TextInput
                    style={{ flex: 1, color: P.text, paddingVertical: 14, fontSize: 15, fontWeight: '500', ...webInput }}
                    placeholder={placeholder}
                    placeholderTextColor={P.muted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secure && !showPassword}
                    keyboardType={keyboardType ?? 'default'}
                    autoCapitalize={autoCapitalize ?? 'none'}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                {secure ? (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={16} color={P.muted} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

function PrimaryButton({ title, onPress, isLoading, disabled }: {
    title: string; onPress: () => void; isLoading?: boolean; disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isLoading || disabled}
            style={{
                backgroundColor: P.accent,
                borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
                marginTop: 4,
                opacity: (isLoading || disabled) ? 0.6 : 1,
                shadowColor: P.accent, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
            }}
        >
            {isLoading ? (
                <ActivityIndicator color="#240046" />
            ) : (
                <Text style={{ color: '#240046', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

function LoginForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        if (!email.trim()) { setError('El correo electrónico es requerido'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        try {
            await login(email.trim(), password);
            router.replace('/(auth)/verify-otp');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Credenciales inválidas');
        }
    };

    return (
        <>
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Bienvenido de nuevo</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Inicia sesión con tu correo electrónico</Text>

            {error ? (
                <View style={{ backgroundColor: P.errorBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
                    <Text style={{ color: P.error, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{error}</Text>
                </View>
            ) : null}

            <AuthInput label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AuthInput label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secure />

            <PrimaryButton title="Iniciar sesión" onPress={handleLogin} isLoading={isLoading} />

            <TouchableOpacity onPress={() => onSwitch('forgot')} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿No tienes cuenta?</Text>
                <TouchableOpacity onPress={() => onSwitch('register')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Regístrate</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

function RegisterForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register, isLoading } = useAuthStore();
    const router = useRouter();

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        if (!nombre.trim()) { setError('El nombre es requerido'); return; }
        if (!email.trim()) { setError('El correo electrónico es requerido'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        try {
            await register(nombre.trim(), email.trim(), password);
            setSuccess('Cuenta creada. Verifica tu correo electrónico.');
            setTimeout(() => router.replace('/(auth)/verify-otp'), 1500);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta');
        }
    };

    return (
        <>
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Crear cuenta</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Regístrate para acceder a tu contenido</Text>

            {error ? (
                <View style={{ backgroundColor: P.errorBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
                    <Text style={{ color: P.error, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{error}</Text>
                </View>
            ) : null}

            {success ? (
                <View style={{ backgroundColor: P.successBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                    <Text style={{ color: P.success, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{success}</Text>
                </View>
            ) : null}

            <AuthInput label="Nombre completo" placeholder="Ej: María García" value={nombre} onChangeText={setNombre} autoCapitalize="words" />
            <AuthInput label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AuthInput label="Contraseña" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secure />
            <AuthInput label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure />

            <PrimaryButton title="Crear cuenta" onPress={handleRegister} isLoading={isLoading} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => onSwitch('login')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Inicia sesión</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

function ForgotForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [step, setStep] = useState<'email' | 'code' | 'newpass' | 'done'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { forgotPassword, isLoading } = useAuthStore();
    const API_BASE = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://localhost:3000';

    const handleSendCode = async () => {
        setError('');
        if (!email.trim()) { setError('El correo electrónico es requerido'); return; }
        try {
            await forgotPassword(email.trim());
            setStep('code');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo enviar el código');
        }
    };

    const handleVerifyAndReset = async () => {
        setError('');
        if (!code.trim()) { setError('Ingresa el código que recibiste por correo'); return; }
        if (code.trim().length < 6) { setError('El código debe tener al menos 6 caracteres'); return; }
        if (!newPassword) { setError('La nueva contraseña es requerida'); return; }
        if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        try {
            const response = await fetch(`${API_BASE}/auth/app/reset-with-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword, confirmPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Código inválido o expirado');
            setStep('done');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña');
        }
    };

    const stepDescriptions = {
        email: 'Ingresa tu correo electrónico y te enviaremos un código de verificación.',
        code: `Ingresá el código que enviamos a ${email} y elegí tu nueva contraseña.`,
        newpass: '',
        done: '',
    };

    return (
        <>
            <TouchableOpacity onPress={() => step === 'email' ? onSwitch('login') : setStep('email')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <FontAwesome name="arrow-left" size={14} color={P.accent} />
                <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>{step === 'email' ? 'Volver al inicio de sesión' : 'Cambiar correo'}</Text>
            </TouchableOpacity>

            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Recuperar contraseña</Text>

            {/* Step indicator */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 20 }}>
                {[1, 2, 3].map((s) => {
                    const stepIndex = step === 'email' ? 1 : step === 'code' ? 2 : 3;
                    const isActive = s === stepIndex;
                    const isDone = s < stepIndex || step === 'done';
                    return (
                        <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{
                                width: 26, height: 26, borderRadius: 13,
                                backgroundColor: isDone ? P.success : isActive ? P.accent : 'rgba(255,255,255,0.08)',
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: isActive ? 0 : 1, borderColor: 'rgba(255,255,255,0.1)',
                            }}>
                                {isDone ? (
                                    <FontAwesome name="check" size={11} color="#fff" />
                                ) : (
                                    <Text style={{ color: isActive ? '#240046' : P.muted, fontSize: 11, fontWeight: '800' }}>{s}</Text>
                                )}
                            </View>
                            {s < 3 ? <View style={{ width: 24, height: 2, backgroundColor: isDone ? P.success : 'rgba(255,255,255,0.08)', borderRadius: 1 }} /> : null}
                        </View>
                    );
                })}
            </View>

            {step !== 'done' && stepDescriptions[step] ? (
                <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                    {stepDescriptions[step]}
                </Text>
            ) : null}

            {error ? (
                <View style={{ backgroundColor: P.errorBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
                    <Text style={{ color: P.error, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{error}</Text>
                </View>
            ) : null}

            {/* Step 1: Email */}
            {step === 'email' ? (
                <>
                    <AuthInput label="Correo electrónico" placeholder="tu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <PrimaryButton title="Enviar código" onPress={handleSendCode} isLoading={isLoading} />
                </>
            ) : null}

            {/* Step 2: Code + new password */}
            {step === 'code' ? (
                <>
                    <View style={{ backgroundColor: P.accentSoft, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <FontAwesome name="envelope" size={14} color={P.accent} />
                            <Text style={{ color: P.textSec, fontSize: 12, flex: 1 }}>
                                Código enviado a <Text style={{ color: P.text, fontWeight: '700' }}>{email}</Text>
                            </Text>
                        </View>
                    </View>

                    <AuthInput label="Código de verificación" placeholder="Ej: A1B2C3D4" value={code} onChangeText={(t) => setCode(t.toUpperCase())} />
                    <AuthInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={newPassword} onChangeText={setNewPassword} secure />
                    <AuthInput label="Confirmar contraseña" placeholder="Repite tu nueva contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure />

                    <PrimaryButton title="Restablecer contraseña" onPress={handleVerifyAndReset} isLoading={isLoading} />

                    <TouchableOpacity onPress={handleSendCode} style={{ marginTop: 14, alignItems: 'center' }}>
                        <Text style={{ color: P.muted, fontSize: 12 }}>¿No recibiste el código? <Text style={{ color: P.accent, fontWeight: '600' }}>Reenviar</Text></Text>
                    </TouchableOpacity>
                </>
            ) : null}

            {/* Step 3: Success */}
            {step === 'done' ? (
                <>
                    <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: P.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
                            <FontAwesome name="check" size={24} color={P.success} />
                        </View>
                        <Text style={{ color: P.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Contraseña actualizada</Text>
                        <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                            Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                        </Text>
                    </View>
                    <PrimaryButton title="Iniciar sesión" onPress={() => onSwitch('login')} />
                </>
            ) : null}
        </>
    );
}

export default function Login() {
    const [screen, setScreen] = useState<Screen>('login');

    const Content = (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>

                {/* Logo */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <LukiPlayLogo variant="full" size={120} />
                    <Text style={{ color: P.muted, fontSize: 13, letterSpacing: 3, marginTop: 12, textTransform: 'uppercase', fontWeight: '600' }}>tu hogar digital</Text>
                </View>

                {/* Card */}
                <View style={{
                    backgroundColor: P.card,
                    borderRadius: 20, borderWidth: 1, borderColor: P.cardBorder,
                    padding: 28, maxWidth: 420, width: '100%', alignSelf: 'center',
                    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
                }}>
                    {screen === 'login' ? <LoginForm onSwitch={setScreen} /> : null}
                    {screen === 'register' ? <RegisterForm onSwitch={setScreen} /> : null}
                    {screen === 'forgot' ? <ForgotForm onSwitch={setScreen} /> : null}
                </View>

                {/* Version footer */}
                <Text style={{ color: P.muted, fontSize: 11, textAlign: 'center', marginTop: 24, opacity: 0.6 }}>Versión v1.0.0</Text>

            </KeyboardAvoidingView>
        </ScrollView>
    );

    return (
        <LinearGradient
            colors={P.bg}
            style={{ flex: 1 }}
        >
            <StatusBar style="light" />
            {Platform.OS === 'web' ? Content : (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    {Content}
                </TouchableWithoutFeedback>
            )}
        </LinearGradient>
    );
}
