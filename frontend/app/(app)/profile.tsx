import {
    View, Text, ScrollView, TouchableOpacity, StatusBar,
    ActivityIndicator, Platform, Animated, Modal,
    TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { getMe, changePassword } from '../../services/api/authApi';
import type { UserProfileResponse } from '../../services/api/authApi';

// ─── Apple-dark palette ───────────────────────────────────────────────────────

const C = {
    bg:             '#000000',
    surface:        '#1C1C1E',
    surfaceHigh:    '#2C2C2E',
    separator:      'rgba(84,84,88,0.65)',
    separatorInset: 'rgba(84,84,88,0.45)',
    label:          '#FFFFFF',
    labelSecond:    'rgba(235,235,245,0.6)',
    labelThird:     'rgba(235,235,245,0.3)',
    blue:           '#0A84FF',
    green:          '#30D158',
    red:            '#FF453A',
    orange:         '#FF9F0A',
    purple:         '#BF5AF2',
    yellow:         '#FFD60A',
    teal:           '#5AC8FA',
    pink:           '#FF375F',
    inputBg:        '#1C1C1E',
    inputBorder:    'rgba(84,84,88,0.5)',
} as const;

const PLAN_COLORS: Record<string, string> = {
    lukiplay:     C.yellow,
    'lukiplay go': '#00E5FF',
    basic:        C.blue,
    premium:      C.purple,
    pro:          C.green,
    familiar:     C.pink,
    empresarial:  C.orange,
};

const CONTRACT_TYPE_LABEL: Record<string, string> = {
    INTERNET: 'Internet',
    TV:       'Televisión',
    COMBO:    'Combo Internet + TV',
    FIBER:    'Fibra óptica',
};

const SERVICE_STATUS_CFG: Record<string, { label: string; color: string }> = {
    ACTIVE:    { label: 'Activo',     color: C.green },
    SUSPENDED: { label: 'Suspendido', color: C.orange },
    CANCELLED: { label: 'Cancelado',  color: C.red },
    PENDING:   { label: 'Pendiente',  color: C.labelSecond },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function planColor(plan: string) {
    return PLAN_COLORS[plan?.toLowerCase()] ?? C.yellow;
}

function initials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function formatDateTime(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-EC', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({
    iconName, iconBg, label, value, valueColor,
    isLast, chevron, onPress, destructive,
}: {
    iconName: string; iconBg: string; label: string;
    value?: string; valueColor?: string;
    isLast?: boolean; chevron?: boolean;
    onPress?: () => void; destructive?: boolean;
}) {
    const Inner = (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, gap: 12 }}>
            <View style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ionicons name={iconName as any} size={16} color="#fff" />
            </View>
            <Text style={{ color: destructive ? C.red : C.label, fontSize: 17, flex: 1 }} numberOfLines={1}>
                {label}
            </Text>
            {value !== undefined && (
                <Text style={{ color: valueColor ?? C.labelSecond, fontSize: 17, maxWidth: 180, textAlign: 'right' }} numberOfLines={1}>
                    {value}
                </Text>
            )}
            {chevron && <Ionicons name="chevron-forward" size={14} color={C.labelThird} style={{ marginLeft: 2 }} />}
        </View>
    );

    return (
        <View>
            {onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.6}>{Inner}</TouchableOpacity>
            ) : Inner}
            {!isLast && <View style={{ height: 0.5, backgroundColor: C.separatorInset, marginLeft: 58 }} />}
        </View>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ label, children, footer }: { label?: string; children: React.ReactNode; footer?: string }) {
    return (
        <View style={{ marginBottom: 10 }}>
            {label && (
                <Text style={{ color: C.labelSecond, fontSize: 13, paddingHorizontal: 20, marginBottom: 6, letterSpacing: 0.1 }}>
                    {label}
                </Text>
            )}
            <View style={{ backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' }}>
                {children}
            </View>
            {footer && (
                <Text style={{ color: C.labelThird, fontSize: 13, paddingHorizontal: 20, marginTop: 6, lineHeight: 18 }}>
                    {footer}
                </Text>
            )}
        </View>
    );
}

// ─── Password Field ───────────────────────────────────────────────────────────

function PasswordField({
    label, value, onChangeText, placeholder, returnKeyType, onSubmitEditing,
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    placeholder?: string; returnKeyType?: 'next' | 'done'; onSubmitEditing?: () => void;
}) {
    const [show, setShow] = useState(false);
    const [focused, setFocused] = useState(false);
    const webStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

    return (
        <View style={{ marginBottom: 14 }}>
            <Text style={{ color: C.labelSecond, fontSize: 13, marginBottom: 6, paddingLeft: 2 }}>{label}</Text>
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: C.inputBg, borderRadius: 10,
                borderWidth: 1, borderColor: focused ? C.blue : C.inputBorder,
                paddingHorizontal: 14,
            }}>
                <TextInput
                    style={{ flex: 1, color: C.label, paddingVertical: 13, fontSize: 16, ...webStyle }}
                    value={value} onChangeText={onChangeText}
                    placeholder={placeholder ?? '••••••••'}
                    placeholderTextColor={C.labelThird}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    returnKeyType={returnKeyType ?? 'done'}
                    onSubmitEditing={onSubmitEditing}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={show ? 'eye-off' : 'eye'} size={18} color={C.labelThird} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Change Password Sheet ────────────────────────────────────────────────────

function ChangePasswordSheet({
    visible, onClose, onSuccess,
}: {
    visible: boolean; onClose: () => void; onSuccess: () => void;
}) {
    const accessToken = useAuthStore((s) => s.accessToken);
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const reset = () => { setCurrent(''); setNext(''); setConfirm(''); setError(''); setDone(false); };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async () => {
        setError('');
        if (!current) { setError('Ingresa tu contraseña actual'); return; }
        if (next.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
        if (next !== confirm) { setError('Las contraseñas no coinciden'); return; }
        if (!accessToken) return;
        setLoading(true);
        try {
            await changePassword(accessToken, current, next);
            setDone(true);
            setTimeout(onSuccess, 1800);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={{ flex: 1 }}>
                {/* Backdrop — tapping it closes the sheet */}
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={{
                            backgroundColor: '#1C1C1E',
                            borderTopLeftRadius: 20, borderTopRightRadius: 20,
                            paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                        }}>
                            {/* Handle */}
                            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
                                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.surfaceHigh }} />
                            </View>

                            {/* Header */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                paddingHorizontal: 20, paddingVertical: 12,
                                borderBottomWidth: 0.5, borderBottomColor: C.separator,
                            }}>
                                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                                </TouchableOpacity>
                                <Text style={{ flex: 1, textAlign: 'center', color: C.label, fontSize: 17, fontWeight: '600' }}>
                                    Cambiar contraseña
                                </Text>
                                <View style={{ width: 60 }} />
                            </View>

                            {/* Body */}
                            <View style={{ padding: 20 }}>
                                {done ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 20, gap: 12 }}>
                                        <View style={{
                                            width: 56, height: 56, borderRadius: 28,
                                            backgroundColor: 'rgba(48,209,88,0.15)',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Ionicons name="checkmark" size={28} color={C.green} />
                                        </View>
                                        <Text style={{ color: C.label, fontSize: 17, fontWeight: '600' }}>
                                            Contraseña actualizada
                                        </Text>
                                        <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                                            Todas tus sesiones han sido cerradas. Iniciando sesión nuevamente…
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {error ? (
                                            <View style={{
                                                backgroundColor: 'rgba(255,69,58,0.1)',
                                                borderRadius: 10, padding: 12, marginBottom: 16,
                                                borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)',
                                            }}>
                                                <Text style={{ color: C.red, fontSize: 14, textAlign: 'center' }}>{error}</Text>
                                            </View>
                                        ) : null}

                                        <PasswordField
                                            label="Contraseña actual"
                                            value={current} onChangeText={setCurrent}
                                            returnKeyType="next"
                                        />
                                        <PasswordField
                                            label="Nueva contraseña"
                                            value={next} onChangeText={setNext}
                                            placeholder="Mínimo 6 caracteres"
                                            returnKeyType="next"
                                        />
                                        <PasswordField
                                            label="Confirmar nueva contraseña"
                                            value={confirm} onChangeText={setConfirm}
                                            placeholder="Repite la nueva contraseña"
                                            returnKeyType="done"
                                            onSubmitEditing={handleSubmit}
                                        />

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            disabled={loading}
                                            style={{
                                                backgroundColor: C.blue,
                                                borderRadius: 12, paddingVertical: 15,
                                                alignItems: 'center', marginTop: 4,
                                                opacity: loading ? 0.6 : 1,
                                            }}
                                        >
                                            {loading
                                                ? <ActivityIndicator color="#fff" />
                                                : <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Actualizar contraseña</Text>
                                            }
                                        </TouchableOpacity>

                                        <Text style={{ color: C.labelThird, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
                                            Al cambiar tu contraseña, todas tus sesiones activas serán cerradas.
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

// ─── Logout Action Sheet ──────────────────────────────────────────────────────

function LogoutSheet({
    visible, onConfirm, onCancel,
}: {
    visible: boolean; onConfirm: () => void; onCancel: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 12 }}>
                <TouchableOpacity style={{ position: 'absolute', inset: 0 } as any} activeOpacity={1} onPress={onCancel} />

                {/* Action group */}
                <View style={{ backgroundColor: '#1C1C1E', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
                    {/* Title block */}
                    <View style={{
                        padding: 16, alignItems: 'center',
                        borderBottomWidth: 0.5, borderBottomColor: C.separator,
                    }}>
                        <Text style={{ color: C.label, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                            Cerrar sesión
                        </Text>
                        <Text style={{ color: C.labelSecond, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                            Se cerrará la sesión en este dispositivo.
                        </Text>
                    </View>

                    {/* Destructive action */}
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.7}
                        style={{ paddingVertical: 17, alignItems: 'center' }}
                    >
                        <Text style={{ color: C.red, fontSize: 20 }}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>

                {/* Cancel button — separate pill (iOS style) */}
                <TouchableOpacity
                    onPress={onCancel}
                    activeOpacity={0.7}
                    style={{
                        backgroundColor: '#1C1C1E', borderRadius: 14,
                        paddingVertical: 17, alignItems: 'center',
                        marginBottom: Platform.OS === 'ios' ? 0 : 8,
                    }}
                >
                    <Text style={{ color: C.blue, fontSize: 20, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const logout = useAuthStore((s) => s.logout);

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    const load = () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        getMe(accessToken)
            .then(setProfile)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, [accessToken]);

    const handleLogout = () => {
        setShowLogout(false);
        logout();
        router.replace('/(auth)/login' as any);
    };

    const handlePasswordChanged = () => {
        setShowChangePwd(false);
        logout();
        router.replace('/(auth)/login' as any);
    };

    const fullName = profile
        ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
        : (user?.name ?? '');

    const pc = planColor(user?.plan ?? '');

    const avatarOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0], extrapolate: 'clamp' });
    const titleOpacity  = scrollY.interpolate({ inputRange: [60, 110], outputRange: [0, 1], extrapolate: 'clamp' });

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />

            {/* ── Navigation bar ── */}
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                backgroundColor: C.bg,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
                zIndex: 10,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                    >
                        <Ionicons name="chevron-back" size={22} color={C.blue} />
                        <Text style={{ color: C.blue, fontSize: 17 }}>Inicio</Text>
                    </TouchableOpacity>

                    <Animated.Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        opacity: titleOpacity,
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        {fullName || 'Mi Perfil'}
                    </Animated.Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={C.blue} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
                    <Ionicons name="wifi-outline" size={52} color={C.labelThird} />
                    <Text style={{ color: C.labelSecond, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>{error}</Text>
                    <TouchableOpacity onPress={load} style={{ paddingHorizontal: 24, paddingVertical: 11, backgroundColor: C.blue, borderRadius: 22 }}>
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 56 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                    scrollEventThrottle={16}
                >
                    {/* ── Avatar hero ── */}
                    <Animated.View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 36, opacity: avatarOpacity }}>
                        <View style={{
                            width: 92, height: 92, borderRadius: 46,
                            backgroundColor: pc, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                        }}>
                            <Text style={{ color: '#000', fontSize: 36, fontWeight: '700', letterSpacing: -1 }}>
                                {initials(fullName || (user?.name ?? 'U'))}
                            </Text>
                        </View>

                        <Text style={{ color: C.label, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 }}>
                            {fullName || '—'}
                        </Text>
                        <Text style={{ color: C.labelSecond, fontSize: 15, marginBottom: 10 }}>
                            {profile?.email ?? user?.email ?? ''}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surfaceHigh, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pc }} />
                            <Text style={{ color: C.label, fontSize: 13, fontWeight: '500' }}>
                                {user?.plan?.toUpperCase() ?? 'LUKI PLAY'}
                            </Text>
                        </View>

                        {profile && !profile.canAccessOtt && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(255,69,58,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                                <Ionicons name="warning-outline" size={13} color={C.red} />
                                <Text style={{ color: C.red, fontSize: 13, fontWeight: '500' }}>Acceso restringido</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Información personal ── */}
                    <Section label="Información personal">
                        <Row iconName="person-fill" iconBg={C.blue} label="Nombre" value={fullName || '—'} />
                        <Row iconName="at" iconBg={C.blue} label="Email" value={profile?.email ?? user?.email ?? '—'} />
                        <Row
                            iconName="card" iconBg={C.green}
                            label="Cédula"
                            value={profile?.idNumber ?? '—'}
                            isLast
                        />
                    </Section>

                    {/* ── Contrato y servicio ── */}
                    {profile && (profile.contractNumber || profile.contractType || profile.serviceStatus) && (
                        <Section label="Contrato y servicio">
                            {profile.contractNumber && (
                                <Row iconName="document-text" iconBg={C.orange} label="N° Contrato" value={profile.contractNumber} />
                            )}
                            {profile.contractType && (
                                <Row iconName="wifi" iconBg={C.teal} label="Tipo" value={CONTRACT_TYPE_LABEL[profile.contractType] ?? profile.contractType} />
                            )}
                            {profile.serviceStatus && (() => {
                                const cfg = SERVICE_STATUS_CFG[profile.serviceStatus!];
                                return (
                                    <Row
                                        iconName="checkmark-circle" iconBg={cfg?.color ?? C.surfaceHigh}
                                        label="Estado" value={cfg?.label ?? profile.serviceStatus!}
                                        valueColor={cfg?.color} isLast
                                    />
                                );
                            })()}
                        </Section>
                    )}

                    {/* ── Sesión ── */}
                    {profile?.lastLoginAt && (
                        <Section label="Sesión">
                            <Row iconName="time" iconBg={C.surfaceHigh} label="Último acceso" value={formatDateTime(profile.lastLoginAt)} isLast />
                        </Section>
                    )}

                    {/* ── Cuenta ── */}
                    <Section
                        label="Cuenta"
                        footer="Al cambiar tu contraseña, todas tus sesiones activas serán cerradas."
                    >
                        <Row
                            iconName="phone-portrait" iconBg={C.teal}
                            label="Mis Dispositivos"
                            chevron
                            onPress={() => router.push('/(app)/devices' as any)}
                        />
                        <Row
                            iconName="shield-checkmark" iconBg={C.green}
                            label="Control Parental"
                            chevron
                            onPress={() => router.push('/(app)/parental-control' as any)}
                        />
                        <Row
                            iconName="lock-closed" iconBg={C.purple}
                            label="Cambiar contraseña"
                            chevron isLast
                            onPress={() => setShowChangePwd(true)}
                        />
                    </Section>

                    {/* ── Cerrar sesión ── */}
                    <Section>
                        <Row
                            iconName="arrow-forward-circle" iconBg={C.red}
                            label="Cerrar sesión"
                            isLast destructive
                            onPress={() => setShowLogout(true)}
                        />
                    </Section>

                    <Text style={{ color: C.labelThird, fontSize: 13, textAlign: 'center', paddingTop: 8, paddingHorizontal: 32, lineHeight: 18 }}>
                        Luki Play · {profile?.id ? `ID ${profile.id.slice(0, 8).toUpperCase()}` : ''}
                    </Text>
                </Animated.ScrollView>
            )}

            {/* ── Sheets ── */}
            <ChangePasswordSheet
                visible={showChangePwd}
                onClose={() => setShowChangePwd(false)}
                onSuccess={handlePasswordChanged}
            />
            <LogoutSheet
                visible={showLogout}
                onConfirm={handleLogout}
                onCancel={() => setShowLogout(false)}
            />
        </View>
    );
}
