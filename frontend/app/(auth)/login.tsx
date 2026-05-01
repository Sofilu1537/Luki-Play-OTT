import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import LukiPlayLogo from '../../components/LukiPlayLogo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { APP } from '../../styles/theme';

type Screen = 'login' | 'first-access' | 'activate' | 'forgot' | 'register-request';

const P = {
    bg: [APP.gradientStart, APP.gradientEnd] as const,
    card: 'rgba(36, 0, 70, 0.65)',
    cardBorder: 'rgba(96, 38, 158, 0.24)',
    input: 'rgba(255,255,255,0.07)',
    inputBorder: 'rgba(255,255,255,0.12)',
    inputFocus: 'rgba(255,184,0,0.4)',
    accent: APP.accent,
    accentSoft: 'rgba(255,184,0,0.12)',
    text: '#FFFFFF',
    textSec: '#D0C4E8',
    muted: '#8B72B2',
    error: APP.danger,
    errorBg: 'rgba(209,16,90,0.12)',
    success: APP.success,
    successBg: 'rgba(23,209,198,0.12)',
};

function AuthInput({ label, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize, maxLength, returnKeyType, onSubmitEditing }: {
    label: string; placeholder: string; value: string; onChangeText: (t: string) => void;
    secure?: boolean; keyboardType?: 'email-address' | 'numeric' | 'default'; autoCapitalize?: 'none' | 'words' | 'characters';
    maxLength?: number; returnKeyType?: 'go' | 'next' | 'done' | 'send'; onSubmitEditing?: () => void;
}) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none', backgroundColor: 'transparent' } as object) : {};
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: P.textSec, fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 2 }}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: P.input, borderRadius: 12, borderWidth: 1, borderColor: focused ? P.inputFocus : P.inputBorder, paddingHorizontal: 14 }}>
                <TextInput
                    style={{ flex: 1, color: P.text, paddingVertical: 14, fontSize: 15, fontWeight: '500', ...webInput }}
                    placeholder={placeholder} placeholderTextColor={P.muted}
                    value={value} onChangeText={onChangeText}
                    secureTextEntry={secure && !showPassword}
                    keyboardType={keyboardType ?? 'default'}
                    autoCapitalize={autoCapitalize ?? 'none'}
                    maxLength={maxLength}
                    returnKeyType={returnKeyType ?? 'default'}
                    onSubmitEditing={onSubmitEditing}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
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

function PrimaryButton({ title, onPress, isLoading, disabled }: { title: string; onPress: () => void; isLoading?: boolean; disabled?: boolean }) {
    return (
        <TouchableOpacity onPress={onPress} disabled={isLoading || disabled}
            style={{ backgroundColor: P.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4, opacity: (isLoading || disabled) ? 0.6 : 1, shadowColor: P.accent, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
            {isLoading ? <ActivityIndicator color="#240046" /> : <Text style={{ color: '#240046', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>{title}</Text>}
        </TouchableOpacity>
    );
}

function ErrorBox({ msg }: { msg: string }) {
    return (
        <View style={{ backgroundColor: P.errorBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(209,16,90,0.2)' }}>
            <Text style={{ color: P.error, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{msg}</Text>
        </View>
    );
}

function BackLink({ onPress, label = 'Volver' }: { onPress: () => void; label?: string }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FontAwesome name="arrow-left" size={14} color={P.accent} />
            <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginForm({ onSwitch, onForcedChange }: { onSwitch: (s: Screen) => void; onForcedChange: (id: string) => void }) {
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginWithId, isLoading } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        if (!idNumber.trim()) { setError('La cédula es requerida'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        try {
            await loginWithId(idNumber.trim(), password);
            if (useAuthStore.getState().mustChangePassword) {
                onForcedChange(idNumber.trim());
                onSwitch('forgot');
            } else {
                router.replace('/');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Credenciales inválidas');
        }
    };

    return (
        <>
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Bienvenido de nuevo</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Inicia sesión con tu cédula de identidad</Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Cédula de identidad" placeholder="Ej: 0503557068" value={idNumber} onChangeText={t => setIdNumber(t.replace(/\D/g, ''))} keyboardType="numeric" returnKeyType="next" />
            <AuthInput label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secure returnKeyType="go" onSubmitEditing={handleLogin} />
            <PrimaryButton title="Iniciar sesión" onPress={handleLogin} isLoading={isLoading} />
            <TouchableOpacity onPress={() => onSwitch('forgot')} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿Primera vez?</Text>
                <TouchableOpacity onPress={() => onSwitch('first-access')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Activa tu cuenta</Text>
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿No eres cliente Luki?</Text>
                <TouchableOpacity onPress={() => onSwitch('register-request')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Solicitar acceso</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

// ─── Paso 1: First Access ─────────────────────────────────────────────────────

function FirstAccessForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [idNumber, setIdNumber] = useState('');
    const [error, setError] = useState('');
    const { firstAccess, isLoading } = useAuthStore();

    const handleFirstAccess = async () => {
        setError('');
        if (!idNumber.trim()) { setError('La cédula es requerida'); return; }
        try {
            await firstAccess(idNumber.trim());
            onSwitch('activate');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo verificar la cédula');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('login')} label="Volver al inicio de sesión" />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Activar cuenta</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Ingresa tu cédula. Te enviaremos un código al correo registrado.
            </Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Cédula de identidad" placeholder="Ej: 0503557068" value={idNumber} onChangeText={t => setIdNumber(t.replace(/\D/g, ''))} keyboardType="numeric" returnKeyType="go" onSubmitEditing={handleFirstAccess} />
            <PrimaryButton title="Enviar código" onPress={handleFirstAccess} isLoading={isLoading} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿Ya tienes contraseña?</Text>
                <TouchableOpacity onPress={() => onSwitch('login')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Inicia sesión</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

// ─── Paso 2: Crear contraseña ─────────────────────────────────────────────────

function ActivateForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [otpCode, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const { activate, pendingActivation, isLoading } = useAuthStore();
    const router = useRouter();

    if (!pendingActivation) {
        return <><Text style={{ color: P.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>Sesión expirada</Text><PrimaryButton title="Comenzar de nuevo" onPress={() => onSwitch('first-access')} /></>;
    }

    const handleActivate = async () => {
        setError('');
        if (otpCode.trim().length !== 6) { setError('El código debe tener 6 dígitos'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('El correo electrónico no tiene un formato válido'); return; }
        try {
            await activate(pendingActivation.customerId, otpCode.trim(), password, email.trim() || undefined);
            router.replace('/');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo activar la cuenta');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('first-access')} />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Crea tu contraseña</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
                Hola, <Text style={{ color: P.accent, fontWeight: '700' }}>{pendingActivation.nombre}</Text>
            </Text>
            <Text style={{ color: P.muted, fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
                Ingresa el código que recibiste en tu correo y crea tu contraseña.
            </Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Código OTP (6 dígitos)" placeholder="123456" value={otpCode} onChangeText={t => setOtpCode(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={6} returnKeyType="next" />
            <AuthInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secure returnKeyType="next" />
            <AuthInput label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure returnKeyType="next" />
            <AuthInput label="Correo electrónico (opcional)" placeholder="Para notificaciones" value={email} onChangeText={setEmail} keyboardType="email-address" returnKeyType="go" onSubmitEditing={handleActivate} />
            <PrimaryButton title="Activar cuenta" onPress={handleActivate} isLoading={isLoading} />
            <TouchableOpacity onPress={() => onSwitch('first-access')} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>¿No recibiste el código? Volver</Text>
            </TouchableOpacity>
        </>
    );
}

// ─── Recuperar contraseña ─────────────────────────────────────────────────────

function ForgotForm({ onSwitch, defaultIdNumber }: { onSwitch: (s: Screen) => void; defaultIdNumber?: string }) {
    const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
    const [idNumber, setIdNumber] = useState(defaultIdNumber ?? '');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { requestPasswordOtp, resetWithOtp, isLoading } = useAuthStore();

    const handleRequestOtp = async () => {
        setError('');
        if (!idNumber.trim()) { setError('La cédula es requerida'); return; }
        try {
            await requestPasswordOtp(idNumber.trim());
            setStep('reset');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al solicitar el código');
        }
    };

    const handleResetWithOtp = async () => {
        setError('');
        if (otpCode.trim().length !== 6) { setError('El código debe tener 6 dígitos'); return; }
        if (!newPassword) { setError('La nueva contraseña es requerida'); return; }
        if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        try {
            await resetWithOtp(idNumber.trim(), otpCode.trim(), newPassword);
            setStep('done');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('login')} label="Volver al inicio de sesión" />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Recuperar contraseña</Text>
            {defaultIdNumber ? (
                <View style={{ backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' }}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                        El administrador generó una clave temporal. Debes crear una nueva contraseña para continuar.
                    </Text>
                </View>
            ) : null}
            {error ? <ErrorBox msg={error} /> : null}
            {step === 'request' && (
                <>
                    <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                        Ingresa tu cédula. Te enviaremos un código al correo registrado.
                    </Text>
                    <AuthInput label="Cédula de identidad" placeholder="Ej: 0503557068" value={idNumber} onChangeText={t => setIdNumber(t.replace(/\D/g, ''))} keyboardType="numeric" returnKeyType="go" onSubmitEditing={handleRequestOtp} />
                    <PrimaryButton title="Enviar código" onPress={handleRequestOtp} isLoading={isLoading} />
                </>
            )}
            {step === 'reset' && (
                <>
                    <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                        Ingresa el código que recibiste y tu nueva contraseña.
                    </Text>
                    <AuthInput label="Código OTP (6 dígitos)" placeholder="123456" value={otpCode} onChangeText={t => setOtpCode(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={6} returnKeyType="next" />
                    <AuthInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={newPassword} onChangeText={setNewPassword} secure returnKeyType="next" />
                    <AuthInput label="Confirmar contraseña" placeholder="Repite tu nueva contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure returnKeyType="go" onSubmitEditing={handleResetWithOtp} />
                    <PrimaryButton title="Restablecer contraseña" onPress={handleResetWithOtp} isLoading={isLoading} />
                    <TouchableOpacity onPress={() => { setStep('request'); setOtpCode(''); setNewPassword(''); setConfirmPassword(''); setError(''); }} style={{ marginTop: 16, alignItems: 'center' }}>
                        <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>¿No recibiste el código? Volver</Text>
                    </TouchableOpacity>
                </>
            )}
            {step === 'done' && (
                <>
                    <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: P.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(23,209,198,0.2)' }}>
                            <FontAwesome name="check" size={24} color={P.success} />
                        </View>
                        <Text style={{ color: P.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Contraseña actualizada</Text>
                        <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
                    </View>
                    <PrimaryButton title="Iniciar sesión" onPress={() => onSwitch('login')} />
                </>
            )}
        </>
    );
}

// ─── Flujo 3: Solicitud de registro (no-ISP) ──────────────────────────────────

function RegisterRequestForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [direccion, setDireccion] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const { submitRegistrationRequest, isLoading } = useAuthStore();

    const handleSubmit = async () => {
        setError('');
        if (!nombres.trim()) { setError('El nombre es requerido'); return; }
        if (!apellidos.trim()) { setError('Los apellidos son requeridos'); return; }
        if (idNumber.trim().length < 10) { setError('La cédula debe tener al menos 10 dígitos'); return; }
        if (!telefono.trim()) { setError('El teléfono es requerido'); return; }
        if (telefono.trim().length < 10) { setError('El teléfono debe tener al menos 10 dígitos'); return; }
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('El correo electrónico no tiene un formato válido'); return; }
        try {
            await submitRegistrationRequest({
                nombres: nombres.trim(),
                apellidos: apellidos.trim(),
                idNumber: idNumber.trim(),
                telefono: telefono.trim(),
                email: email.trim() || undefined,
                direccion: direccion.trim() || undefined,
            });
            setDone(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('login')} label="Volver" />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Solicitar acceso</Text>
            {done ? (
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: P.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(23,209,198,0.2)' }}>
                        <FontAwesome name="check" size={24} color={P.success} />
                    </View>
                    <Text style={{ color: P.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Solicitud enviada</Text>
                    <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                        Tu solicitud fue recibida. Un agente de Luki te contactará pronto para activar tu cuenta.
                    </Text>
                    <PrimaryButton title="Volver al inicio" onPress={() => onSwitch('login')} />
                </View>
            ) : (
                <>
                    <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                        Completa el formulario y un agente te contactará para activar tu cuenta.
                    </Text>
                    {error ? <ErrorBox msg={error} /> : null}
                    <AuthInput label="Nombres *" placeholder="Ej: Juan Carlos" value={nombres} onChangeText={setNombres} autoCapitalize="words" returnKeyType="next" />
                    <AuthInput label="Apellidos *" placeholder="Ej: Pérez López" value={apellidos} onChangeText={setApellidos} autoCapitalize="words" returnKeyType="next" />
                    <AuthInput label="Cédula *" placeholder="Ej: 1720345678" value={idNumber} onChangeText={t => setIdNumber(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={13} returnKeyType="next" />
                    <AuthInput label="Teléfono celular *" placeholder="Ej: 0991234567" value={telefono} onChangeText={t => setTelefono(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={15} returnKeyType="next" />
                    <AuthInput label="Correo electrónico (opcional)" placeholder="tu@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" returnKeyType="next" />
                    <AuthInput label="Dirección (opcional)" placeholder="Ciudad, barrio..." value={direccion} onChangeText={setDireccion} autoCapitalize="words" returnKeyType="go" onSubmitEditing={handleSubmit} />
                    <PrimaryButton title="Enviar solicitud" onPress={handleSubmit} isLoading={isLoading} />
                </>
            )}
        </>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Login() {
    const [screen, setScreen] = useState<Screen>('login');
    const [forcedChangeId, setForcedChangeId] = useState<string | undefined>(undefined);

    const Content = (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <LukiPlayLogo variant="icon" size={120} />
                    <Text style={{ color: P.muted, fontSize: 13, letterSpacing: 3, marginTop: 12, textTransform: 'uppercase', fontWeight: '600' }}>tu hogar digital</Text>
                </View>
                <View style={{ backgroundColor: P.card, borderRadius: 20, borderWidth: 1, borderColor: P.cardBorder, padding: 28, maxWidth: 420, width: '100%', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } }}>
                    {screen === 'login'            && <LoginForm onSwitch={setScreen} onForcedChange={id => setForcedChangeId(id)} />}
                    {screen === 'first-access'     && <FirstAccessForm onSwitch={setScreen} />}
                    {screen === 'activate'         && <ActivateForm onSwitch={setScreen} />}
                    {screen === 'forgot'           && <ForgotForm onSwitch={setScreen} defaultIdNumber={forcedChangeId} />}
                    {screen === 'register-request' && <RegisterRequestForm onSwitch={setScreen} />}
                </View>
                <Text style={{ color: P.muted, fontSize: 11, textAlign: 'center', marginTop: 24, opacity: 0.6 }}>Versión v1.0.0</Text>
            </KeyboardAvoidingView>
        </ScrollView>
    );

    return (
        <LinearGradient colors={P.bg} style={{ flex: 1 }}>
            <StatusBar style="light" />
            {Platform.OS === 'web' ? Content : <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{Content}</TouchableWithoutFeedback>}
        </LinearGradient>
    );
}
