import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import LukiPlayLogo from '../../components/LukiPlayLogo';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Screen = 'login' | 'first-access' | 'request-code' | 'verify-code' | 'activate' | 'forgot' | 'register-request';

const P = {
    bg: ['#240046', '#140026'] as const,
    card: 'rgba(96, 38, 158, 0.15)',
    cardBorder: 'rgba(255, 184, 0, 0.15)',
    input: 'rgba(255, 255, 255, 0.08)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocus: 'rgba(255, 184, 0, 0.4)',
    accent: '#FFB800',
    accentSoft: 'rgba(255, 184, 0, 0.15)',
    text: '#FAF6E7',
    textSec: '#D0C4E8',
    muted: '#B07CC6',
    error: '#D1105A',
    errorBg: 'rgba(209, 16, 90, 0.15)',
    success: '#10B981',
    successBg: 'rgba(16,185,129,0.12)',
};

function AuthInput({ label, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize }: {
    label: string; placeholder: string; value: string; onChangeText: (t: string) => void;
    secure?: boolean; keyboardType?: 'email-address' | 'numeric' | 'default'; autoCapitalize?: 'none' | 'words' | 'characters';
}) {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
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
        <View style={{ backgroundColor: P.errorBg, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
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

function LoginForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [contractNumber, setContractNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        setError('');
        if (!contractNumber.trim()) { setError('El número de contrato es requerido'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        try {
            await login(contractNumber.trim(), password);
            router.replace('/');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Credenciales inválidas');
        }
    };

    return (
        <>
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Bienvenido de nuevo</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Inicia sesión con tu número de contrato</Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Número de contrato" placeholder="Ej: 000000003" value={contractNumber} onChangeText={setContractNumber} />
            <AuthInput label="Contraseña" placeholder="••••••••" value={password} onChangeText={setPassword} secure />
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
    const [contractNumber, setContractNumber] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [error, setError] = useState('');
    const { firstAccess, isLoading } = useAuthStore();

    const handleFirstAccess = async () => {
        setError('');
        if (!contractNumber.trim()) { setError('El número de contrato es requerido'); return; }
        if (!idNumber.trim()) { setError('La cédula es requerida'); return; }
        try {
            await firstAccess(contractNumber.trim(), idNumber.trim());
            onSwitch('request-code');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo verificar el contrato');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('login')} label="Volver al inicio de sesión" />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Activar cuenta</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>Ingresa tu número de contrato y cédula para verificar tu identidad</Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Número de contrato" placeholder="Ej: 000000003" value={contractNumber} onChangeText={setContractNumber} />
            <AuthInput label="Cédula de identidad" placeholder="Ej: 1720345678" value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
            <PrimaryButton title="Verificar identidad" onPress={handleFirstAccess} isLoading={isLoading} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 6 }}>
                <Text style={{ color: P.muted, fontSize: 13 }}>¿Ya tienes contraseña?</Text>
                <TouchableOpacity onPress={() => onSwitch('login')}>
                    <Text style={{ color: P.accent, fontSize: 13, fontWeight: '700' }}>Inicia sesión</Text>
                </TouchableOpacity>
            </View>
        </>
    );
}

// ─── Paso 2: Solicitar código ─────────────────────────────────────────────────

function RequestCodeForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [needsSupport, setNeedsSupport] = useState(false);
    const { pendingActivation, requestActivationCode, isLoading } = useAuthStore();

    if (!pendingActivation) {
        return <><Text style={{ color: P.text, textAlign: 'center', marginBottom: 16 }}>Sesión expirada</Text><PrimaryButton title="Comenzar de nuevo" onPress={() => onSwitch('first-access')} /></>;
    }

    const handleRequest = async () => {
        setError('');
        setNeedsSupport(false);
        try {
            const result = await requestActivationCode(pendingActivation.customerId, email.trim() || undefined);
            if (result.needsSupportCode) {
                setNeedsSupport(true);
            } else {
                onSwitch('verify-code');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al solicitar el código');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('first-access')} />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Código de activación</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 8, lineHeight: 20 }}>
                Hola, <Text style={{ color: P.accent, fontWeight: '700' }}>{pendingActivation.nombre}</Text>
            </Text>
            <Text style={{ color: P.muted, fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
                Ingresa tu correo para recibir el código. Si no tienes, selecciona "No tengo correo".
            </Text>
            {error ? <ErrorBox msg={error} /> : null}
            {needsSupport ? (
                <View style={{ backgroundColor: 'rgba(255,184,0,0.1)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)' }}>
                    <Text style={{ color: P.accent, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>Contacta a soporte Luki</Text>
                    <Text style={{ color: P.textSec, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                        Llama al <Text style={{ fontWeight: '700' }}>1-800-LUKI</Text> y proporciona tu número de contrato. Un agente te dará tu código de activación.
                    </Text>
                    <TouchableOpacity onPress={() => { setNeedsSupport(false); onSwitch('verify-code'); }} style={{ marginTop: 14, alignItems: 'center' }}>
                        <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>Ya tengo el código →</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
            {!needsSupport ? (
                <>
                    <AuthInput label="Correo electrónico (opcional)" placeholder="tu@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <PrimaryButton title={email.trim() ? 'Enviar código al correo' : 'No tengo correo'} onPress={handleRequest} isLoading={isLoading} />
                </>
            ) : null}
        </>
    );
}

// ─── Paso 3: Verificar código ─────────────────────────────────────────────────

function VerifyCodeForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const { pendingActivation, verifyActivationCode, isLoading } = useAuthStore();

    if (!pendingActivation) {
        return <><Text style={{ color: P.text, textAlign: 'center', marginBottom: 16 }}>Sesión expirada</Text><PrimaryButton title="Comenzar de nuevo" onPress={() => onSwitch('first-access')} /></>;
    }

    const handleVerify = async () => {
        setError('');
        if (code.trim().length !== 6) { setError('El código debe tener 6 caracteres'); return; }
        try {
            await verifyActivationCode(pendingActivation.customerId, code.trim());
            onSwitch('activate');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Código inválido o expirado');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('request-code')} />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Ingresa tu código</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Ingresa el código de 6 caracteres que recibiste
            </Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Código de activación" placeholder="Ej: A1B2C3" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" />
            <PrimaryButton title="Verificar código" onPress={handleVerify} isLoading={isLoading} />
            <TouchableOpacity onPress={() => onSwitch('request-code')} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: P.accent, fontSize: 13, fontWeight: '600' }}>¿No recibiste el código? Volver</Text>
            </TouchableOpacity>
        </>
    );
}

// ─── Paso 4: Crear contraseña ─────────────────────────────────────────────────

function ActivateForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [code] = useState(''); // El código ya fue verificado, pero lo guardamos en store
    const [error, setError] = useState('');
    const { activate, pendingActivation, isLoading } = useAuthStore();
    const router = useRouter();

    // Recuperar el código verificado del estado local del formulario anterior
    const [verifiedCode, setVerifiedCode] = useState('');

    if (!pendingActivation) {
        return <><Text style={{ color: P.text, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>Sesión expirada</Text><PrimaryButton title="Verificar contrato" onPress={() => onSwitch('first-access')} /></>;
    }

    const handleActivate = async () => {
        setError('');
        if (!verifiedCode.trim() || verifiedCode.trim().length !== 6) { setError('El código de activación es requerido'); return; }
        if (!password) { setError('La contraseña es requerida'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        try {
            await activate(pendingActivation.customerId, verifiedCode.trim(), password, email.trim() || undefined);
            router.replace('/');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo activar la cuenta');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('verify-code')} />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Crea tu contraseña</Text>
            <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
                Hola, <Text style={{ color: P.accent, fontWeight: '700' }}>{pendingActivation.nombre}</Text>
            </Text>
            <Text style={{ color: P.muted, fontSize: 12, textAlign: 'center', marginBottom: 24 }}>Contrato: {pendingActivation.contractNumber}</Text>
            {error ? <ErrorBox msg={error} /> : null}
            <AuthInput label="Código de activación" placeholder="Ej: A1B2C3" value={verifiedCode} onChangeText={(v) => setVerifiedCode(v.toUpperCase())} autoCapitalize="characters" />
            <AuthInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={password} onChangeText={setPassword} secure />
            <AuthInput label="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure />
            <AuthInput label="Correo electrónico (opcional)" placeholder="Para notificaciones" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <PrimaryButton title="Activar cuenta" onPress={handleActivate} isLoading={isLoading} />
        </>
    );
}

// ─── Recuperar contraseña ─────────────────────────────────────────────────────

function ForgotForm({ onSwitch }: { onSwitch: (s: Screen) => void }) {
    const [step, setStep] = useState<'identity' | 'done'>('identity');
    const [contractNumber, setContractNumber] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { resetPassword, isLoading } = useAuthStore();

    const handleReset = async () => {
        setError('');
        if (!contractNumber.trim()) { setError('El número de contrato es requerido'); return; }
        if (!idNumber.trim()) { setError('La cédula es requerida'); return; }
        if (!newPassword) { setError('La nueva contraseña es requerida'); return; }
        if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        try {
            await resetPassword(contractNumber.trim(), idNumber.trim(), newPassword);
            setStep('done');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña');
        }
    };

    return (
        <>
            <BackLink onPress={() => onSwitch('login')} label="Volver al inicio de sesión" />
            <Text style={{ color: P.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>Recuperar contraseña</Text>
            {error ? <ErrorBox msg={error} /> : null}
            {step === 'identity' ? (
                <>
                    <Text style={{ color: P.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>Ingresa tu contrato, cédula y nueva contraseña</Text>
                    <AuthInput label="Número de contrato" placeholder="Ej: 000000003" value={contractNumber} onChangeText={setContractNumber} />
                    <AuthInput label="Cédula de identidad" placeholder="Ej: 1720345678" value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
                    <AuthInput label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={newPassword} onChangeText={setNewPassword} secure />
                    <AuthInput label="Confirmar contraseña" placeholder="Repite tu nueva contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secure />
                    <PrimaryButton title="Restablecer contraseña" onPress={handleReset} isLoading={isLoading} />
                </>
            ) : (
                <>
                    <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: P.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
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
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: P.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' }}>
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
                    <AuthInput label="Nombres *" placeholder="Ej: Juan Carlos" value={nombres} onChangeText={setNombres} autoCapitalize="words" />
                    <AuthInput label="Apellidos *" placeholder="Ej: Pérez López" value={apellidos} onChangeText={setApellidos} autoCapitalize="words" />
                    <AuthInput label="Cédula *" placeholder="Ej: 1720345678" value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
                    <AuthInput label="Teléfono celular *" placeholder="Ej: 0991234567" value={telefono} onChangeText={setTelefono} keyboardType="numeric" />
                    <AuthInput label="Correo electrónico (opcional)" placeholder="tu@correo.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <AuthInput label="Dirección (opcional)" placeholder="Ciudad, barrio..." value={direccion} onChangeText={setDireccion} autoCapitalize="words" />
                    <PrimaryButton title="Enviar solicitud" onPress={handleSubmit} isLoading={isLoading} />
                </>
            )}
        </>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Login() {
    const [screen, setScreen] = useState<Screen>('login');

    const Content = (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <LukiPlayLogo variant="full" size={120} />
                    <Text style={{ color: P.muted, fontSize: 13, letterSpacing: 3, marginTop: 12, textTransform: 'uppercase', fontWeight: '600' }}>tu hogar digital</Text>
                </View>
                <View style={{ backgroundColor: P.card, borderRadius: 20, borderWidth: 1, borderColor: P.cardBorder, padding: 28, maxWidth: 420, width: '100%', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } }}>
                    {screen === 'login'            && <LoginForm onSwitch={setScreen} />}
                    {screen === 'first-access'     && <FirstAccessForm onSwitch={setScreen} />}
                    {screen === 'request-code'     && <RequestCodeForm onSwitch={setScreen} />}
                    {screen === 'verify-code'      && <VerifyCodeForm onSwitch={setScreen} />}
                    {screen === 'activate'         && <ActivateForm onSwitch={setScreen} />}
                    {screen === 'forgot'           && <ForgotForm onSwitch={setScreen} />}
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
