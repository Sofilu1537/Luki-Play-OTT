import {
    View, Text, ScrollView, TouchableOpacity, StatusBar,
    ActivityIndicator, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { getMe } from '../../services/api/authApi';
import type { UserProfileResponse } from '../../services/api/authApi';

// ─── Apple-dark palette ───────────────────────────────────────────────────────

const C = {
    bg:           '#000000',
    surface:      '#1C1C1E',
    surfaceHigh:  '#2C2C2E',
    separator:    'rgba(84,84,88,0.65)',
    separatorInset: 'rgba(84,84,88,0.45)',
    label:        '#FFFFFF',
    labelSecond:  'rgba(235,235,245,0.6)',
    labelThird:   'rgba(235,235,245,0.3)',
    blue:         '#0A84FF',
    green:        '#30D158',
    red:          '#FF453A',
    orange:       '#FF9F0A',
    purple:       '#BF5AF2',
    yellow:       '#FFD60A',
    teal:         '#5AC8FA',
    pink:         '#FF375F',
} as const;

const PLAN_COLORS: Record<string, string> = {
    lukiplay:    '#FFD60A',
    basic:       '#0A84FF',
    premium:     '#BF5AF2',
    pro:         '#30D158',
    familiar:    '#FF375F',
    empresarial: '#FF9F0A',
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
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('');
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
    iconName, iconBg, label, value, valueColor, isLast, chevron, onPress,
}: {
    iconName: string;
    iconBg: string;
    label: string;
    value?: string;
    valueColor?: string;
    isLast?: boolean;
    chevron?: boolean;
    onPress?: () => void;
}) {
    const Inner = (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 11, paddingHorizontal: 16, gap: 12,
        }}>
            {/* Icon well */}
            <View style={{
                width: 30, height: 30, borderRadius: 7,
                backgroundColor: iconBg,
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Ionicons name={iconName as any} size={16} color="#fff" />
            </View>

            {/* Label */}
            <Text style={{ color: C.label, fontSize: 17, flex: 1 }} numberOfLines={1}>
                {label}
            </Text>

            {/* Value */}
            {value !== undefined && (
                <Text style={{
                    color: valueColor ?? C.labelSecond,
                    fontSize: 17, maxWidth: 180, textAlign: 'right',
                }} numberOfLines={1}>
                    {value}
                </Text>
            )}

            {/* Chevron */}
            {chevron && (
                <Ionicons name="chevron-forward" size={14} color={C.labelThird} style={{ marginLeft: 2 }} />
            )}
        </View>
    );

    return (
        <View>
            {onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
                    {Inner}
                </TouchableOpacity>
            ) : Inner}
            {!isLast && (
                <View style={{
                    height: 0.5,
                    backgroundColor: C.separatorInset,
                    marginLeft: 58,
                }} />
            )}
        </View>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
    label, children, footer,
}: {
    label?: string;
    children: React.ReactNode;
    footer?: string;
}) {
    return (
        <View style={{ marginBottom: 10 }}>
            {label && (
                <Text style={{
                    color: C.labelSecond,
                    fontSize: 13,
                    paddingHorizontal: 20,
                    marginBottom: 6,
                    letterSpacing: 0.1,
                }}>
                    {label}
                </Text>
            )}
            <View style={{
                backgroundColor: C.surface,
                marginHorizontal: 16,
                borderRadius: 12,
                overflow: 'hidden',
            }}>
                {children}
            </View>
            {footer && (
                <Text style={{
                    color: C.labelThird,
                    fontSize: 13,
                    paddingHorizontal: 20,
                    marginTop: 6,
                    lineHeight: 18,
                }}>
                    {footer}
                </Text>
            )}
        </View>
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

    const fullName = profile
        ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
        : (user?.name ?? '');

    const pc = planColor(user?.plan ?? '');

    // Collapse avatar opacity as user scrolls down
    const avatarOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // Inline title fades in as avatar fades out
    const titleOpacity = scrollY.interpolate({
        inputRange: [60, 110],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />

            {/* ── Navigation bar ── */}
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                backgroundColor: C.bg,
                borderBottomWidth: 0.5,
                borderBottomColor: C.separator,
                zIndex: 10,
            }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 8, paddingBottom: 10, height: 44,
                }}>
                    {/* Back */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                    >
                        <Ionicons name="chevron-back" size={22} color={C.blue} />
                        <Text style={{ color: C.blue, fontSize: 17 }}>Inicio</Text>
                    </TouchableOpacity>

                    {/* Inline title — fades in on scroll */}
                    <Animated.Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        opacity: titleOpacity, pointerEvents: 'none',
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
                    <Text style={{ color: C.labelSecond, textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={load}
                        style={{
                            paddingHorizontal: 24, paddingVertical: 11,
                            backgroundColor: C.blue, borderRadius: 22,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 56 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true },
                    )}
                    scrollEventThrottle={16}
                >
                    {/* ── Large title + avatar hero ── */}
                    <Animated.View style={{
                        alignItems: 'center',
                        paddingTop: 28, paddingBottom: 36,
                        opacity: avatarOpacity,
                    }}>
                        {/* Avatar */}
                        <View style={{
                            width: 92, height: 92, borderRadius: 46,
                            backgroundColor: pc,
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: 14,
                        }}>
                            <Text style={{ color: '#000', fontSize: 36, fontWeight: '700', letterSpacing: -1 }}>
                                {initials(fullName || (user?.name ?? 'U'))}
                            </Text>
                        </View>

                        {/* Name */}
                        <Text style={{ color: C.label, fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 }}>
                            {fullName || '—'}
                        </Text>

                        {/* Email */}
                        <Text style={{ color: C.labelSecond, fontSize: 15, marginBottom: 10 }}>
                            {profile?.email ?? user?.email ?? ''}
                        </Text>

                        {/* Plan pill */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                            backgroundColor: C.surfaceHigh,
                            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
                        }}>
                            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pc }} />
                            <Text style={{ color: C.label, fontSize: 13, fontWeight: '500' }}>
                                {user?.plan?.toUpperCase() ?? 'LUKI PLAY'}
                            </Text>
                        </View>

                        {/* OTT access badge */}
                        {profile && !profile.canAccessOtt && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                marginTop: 10,
                                backgroundColor: 'rgba(255,69,58,0.12)',
                                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
                            }}>
                                <Ionicons name="warning-outline" size={13} color={C.red} />
                                <Text style={{ color: C.red, fontSize: 13, fontWeight: '500' }}>
                                    Acceso restringido
                                </Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* ── Información personal ── */}
                    <Section label="Información personal">
                        <Row
                            iconName="person-fill" iconBg={C.blue}
                            label="Nombre"
                            value={fullName || '—'}
                        />
                        <Row
                            iconName="at" iconBg={C.blue}
                            label="Email"
                            value={profile?.email ?? user?.email ?? '—'}
                        />
                        {profile?.idNumber ? (
                            <Row
                                iconName="card" iconBg={C.green}
                                label="Cédula"
                                value={profile.idNumber}
                                isLast
                            />
                        ) : (
                            <Row
                                iconName="card" iconBg={C.green}
                                label="Cédula"
                                value="—"
                                isLast
                            />
                        )}
                    </Section>

                    {/* ── Contrato y servicio ── */}
                    {profile && (profile.contractNumber || profile.contractType || profile.serviceStatus) && (
                        <Section label="Contrato y servicio">
                            {profile.contractNumber && (
                                <Row
                                    iconName="document-text" iconBg={C.orange}
                                    label="N° Contrato"
                                    value={profile.contractNumber}
                                />
                            )}
                            {profile.contractType && (
                                <Row
                                    iconName="wifi" iconBg={C.teal}
                                    label="Tipo"
                                    value={CONTRACT_TYPE_LABEL[profile.contractType] ?? profile.contractType}
                                />
                            )}
                            {profile.serviceStatus && (() => {
                                const cfg = SERVICE_STATUS_CFG[profile.serviceStatus!];
                                return (
                                    <Row
                                        iconName="checkmark-circle" iconBg={cfg?.color ?? C.surfaceHigh}
                                        label="Estado"
                                        value={cfg?.label ?? profile.serviceStatus!}
                                        valueColor={cfg?.color}
                                        isLast
                                    />
                                );
                            })()}
                        </Section>
                    )}

                    {/* ── Sesión ── */}
                    {profile?.lastLoginAt && (
                        <Section label="Sesión">
                            <Row
                                iconName="time" iconBg={C.surfaceHigh}
                                label="Último acceso"
                                value={formatDateTime(profile.lastLoginAt)}
                                isLast
                            />
                        </Section>
                    )}

                    {/* ── Cuenta ── */}
                    <Section label="Cuenta">
                        <Row
                            iconName="lock-closed" iconBg={C.purple}
                            label="Cambiar contraseña"
                            chevron
                            onPress={() => router.push('/(auth)/reset-password' as any)}
                            isLast
                        />
                    </Section>

                    {/* ── Cerrar sesión (destructive) ── */}
                    <Section>
                        <Row
                            iconName="arrow-forward-circle" iconBg={C.red}
                            label="Cerrar sesión"
                            chevron
                            onPress={() => { logout(); router.replace('/(auth)/login' as any); }}
                            isLast
                        />
                    </Section>

                    {/* Footer */}
                    <Text style={{
                        color: C.labelThird, fontSize: 13,
                        textAlign: 'center', paddingTop: 8,
                        paddingHorizontal: 32, lineHeight: 18,
                    }}>
                        Luki Play · {profile?.id ? `ID ${profile.id.slice(0, 8).toUpperCase()}` : ''}
                    </Text>
                </Animated.ScrollView>
            )}
        </View>
    );
}
