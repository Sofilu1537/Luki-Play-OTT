import {
    View, Text, ScrollView, TouchableOpacity, StatusBar,
    ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { getMe } from '../../services/api/authApi';
import type { UserProfileResponse } from '../../services/api/authApi';

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = '#05020C';
const CARD_BG = '#12082A';
const ACCENT = '#FFC107';

const PLAN_COLORS: Record<string, string> = {
    lukiplay:    '#FFC107',
    basic:       '#60A5FA',
    premium:     '#A78BFA',
    pro:         '#34D399',
    familiar:    '#F472B6',
    empresarial: '#FB923C',
};

const CONTRACT_TYPE_LABEL: Record<string, string> = {
    INTERNET:   'Internet',
    TV:         'Televisión',
    COMBO:      'Combo Internet + TV',
    FIBER:      'Fibra óptica',
};

const SERVICE_STATUS_LABEL: Record<string, string> = {
    ACTIVE:     'Activo',
    SUSPENDED:  'Suspendido',
    CANCELLED:  'Cancelado',
    PENDING:    'Pendiente',
};

const SERVICE_STATUS_COLOR: Record<string, string> = {
    ACTIVE:     '#34D399',
    SUSPENDED:  '#FCD34D',
    CANCELLED:  '#F87171',
    PENDING:    '#94A3B8',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanColor(plan: string) {
    return PLAN_COLORS[plan?.toLowerCase()] ?? ACCENT;
}

function getInitial(name: string) {
    return (name || 'U').charAt(0).toUpperCase();
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-EC', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
    icon, label, value, valueColor,
}: {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 13, gap: 14,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        }}>
            <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: 'rgba(255,193,7,0.1)',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Ionicons name={icon as any} size={16} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>
                    {label}
                </Text>
                <Text style={{ color: valueColor ?? '#fff', fontSize: 14, fontWeight: '600' }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <View style={{
            backgroundColor: CARD_BG,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            paddingHorizontal: 18,
            overflow: 'hidden',
        }}>
            {children}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) return;
        setLoading(true);
        getMe(accessToken)
            .then(setProfile)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const planColor = getPlanColor(user?.plan ?? '');
    const fullName = profile
        ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
        : user?.name ?? '';

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="light-content" />

            {/* Header bar */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: Platform.OS === 'web' ? 16 : 48,
                paddingBottom: 12,
                paddingHorizontal: 20,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.06)',
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 }}>
                    Mi Perfil
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
                    <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (!accessToken) return;
                            setError(null); setLoading(true);
                            getMe(accessToken).then(setProfile).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
                        }}
                        style={{
                            paddingHorizontal: 20, paddingVertical: 10,
                            backgroundColor: `${ACCENT}22`, borderRadius: 10,
                            borderWidth: 1, borderColor: `${ACCENT}55`,
                        }}
                    >
                        <Text style={{ color: ACCENT, fontWeight: '700' }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar hero card */}
                    <View style={{
                        alignItems: 'center', paddingVertical: 32,
                        backgroundColor: CARD_BG,
                        borderRadius: 20,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                        gap: 12,
                    }}>
                        {/* Avatar ring */}
                        <View style={{
                            width: 86, height: 86, borderRadius: 43,
                            backgroundColor: planColor,
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 3, borderColor: `${planColor}60`,
                            shadowColor: planColor, shadowOpacity: 0.4,
                            shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
                        }}>
                            <Text style={{ color: '#140026', fontSize: 34, fontWeight: '900' }}>
                                {getInitial(fullName)}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
                                {fullName || '—'}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                                {profile?.email ?? user?.email ?? ''}
                            </Text>
                            {/* Plan badge */}
                            <View style={{
                                backgroundColor: `${planColor}22`,
                                borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
                                borderWidth: 1, borderColor: `${planColor}55`, marginTop: 4,
                            }}>
                                <Text style={{ color: planColor, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
                                    {user?.plan?.toUpperCase() ?? 'LUKI PLAY'}
                                </Text>
                            </View>
                        </View>

                        {/* OTT access indicator */}
                        {profile && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                paddingHorizontal: 14, paddingVertical: 5,
                                backgroundColor: profile.canAccessOtt
                                    ? 'rgba(52,211,153,0.1)'
                                    : 'rgba(248,113,113,0.1)',
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: profile.canAccessOtt
                                    ? 'rgba(52,211,153,0.25)'
                                    : 'rgba(248,113,113,0.25)',
                            }}>
                                <View style={{
                                    width: 6, height: 6, borderRadius: 3,
                                    backgroundColor: profile.canAccessOtt ? '#34D399' : '#F87171',
                                }} />
                                <Text style={{
                                    color: profile.canAccessOtt ? '#34D399' : '#F87171',
                                    fontSize: 11, fontWeight: '700',
                                }}>
                                    {profile.canAccessOtt ? 'Acceso OTT activo' : 'Acceso OTT restringido'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Personal info */}
                    <View style={{ gap: 6 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingLeft: 4, marginBottom: 4 }}>
                            INFORMACIÓN PERSONAL
                        </Text>
                        <SectionCard>
                            <InfoRow
                                icon="person-outline"
                                label="Nombre completo"
                                value={fullName || '—'}
                            />
                            <InfoRow
                                icon="mail-outline"
                                label="Correo electrónico"
                                value={profile?.email ?? user?.email ?? '—'}
                            />
                            {profile?.idNumber && (
                                <InfoRow
                                    icon="card-outline"
                                    label="Cédula de identidad"
                                    value={profile.idNumber}
                                />
                            )}
                        </SectionCard>
                    </View>

                    {/* Contract / service info */}
                    {profile && (profile.contractNumber || profile.contractType || profile.serviceStatus) && (
                        <View style={{ gap: 6 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingLeft: 4, marginBottom: 4 }}>
                                CONTRATO Y SERVICIO
                            </Text>
                            <SectionCard>
                                {profile.contractNumber && (
                                    <InfoRow
                                        icon="document-text-outline"
                                        label="N° de contrato"
                                        value={profile.contractNumber}
                                    />
                                )}
                                {profile.contractType && (
                                    <InfoRow
                                        icon="wifi-outline"
                                        label="Tipo de servicio"
                                        value={CONTRACT_TYPE_LABEL[profile.contractType] ?? profile.contractType}
                                    />
                                )}
                                {profile.serviceStatus && (
                                    <InfoRow
                                        icon="pulse-outline"
                                        label="Estado del servicio"
                                        value={SERVICE_STATUS_LABEL[profile.serviceStatus] ?? profile.serviceStatus}
                                        valueColor={SERVICE_STATUS_COLOR[profile.serviceStatus]}
                                    />
                                )}
                            </SectionCard>
                        </View>
                    )}

                    {/* Session info */}
                    {profile?.lastLoginAt && (
                        <View style={{ gap: 6 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingLeft: 4, marginBottom: 4 }}>
                                SESIÓN
                            </Text>
                            <SectionCard>
                                <InfoRow
                                    icon="time-outline"
                                    label="Último acceso"
                                    value={formatDate(profile.lastLoginAt)}
                                />
                            </SectionCard>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={{ gap: 10, marginTop: 4 }}>
                        <TouchableOpacity
                            onPress={() => router.push('/(auth)/reset-password' as any)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 12,
                                backgroundColor: CARD_BG,
                                borderRadius: 14, padding: 16,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                            }}
                        >
                            <View style={{
                                width: 36, height: 36, borderRadius: 10,
                                backgroundColor: 'rgba(167,139,250,0.12)',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Ionicons name="lock-closed-outline" size={17} color="#A78BFA" />
                            </View>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', flex: 1 }}>
                                Cambiar contraseña
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
