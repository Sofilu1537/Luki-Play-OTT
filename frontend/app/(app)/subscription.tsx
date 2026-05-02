import {
    View, Text, ScrollView, TouchableOpacity, StatusBar,
    ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { getMePlan } from '../../services/api/subscriptionApi';
import type { MePlanResponse, SubscriptionStatus } from '../../services/api/subscriptionApi';

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

const VIDEO_QUALITY_LABEL: Record<string, string> = {
    SD:     'Estándar (SD)',
    HD:     'Alta definición (HD)',
    FHD:    'Full HD (1080p)',
    UHD:    'Ultra HD (4K)',
    '4K':   'Ultra HD (4K)',
};

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
    ACTIVE:       { label: 'Activo',         color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    GRACE_PERIOD: { label: 'Período de gracia', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)' },
    SUSPENDED:    { label: 'Suspendido',      color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
    CANCELLED:    { label: 'Cancelado',       color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanColor(nombre: string) {
    return PLAN_COLORS[nombre?.toLowerCase()] ?? ACCENT;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-EC', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
}

function daysUntil(iso: string): number {
    return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureRow({
    icon, label, value, accent,
}: {
    icon: string;
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        }}>
            <View style={{
                width: 32, height: 32, borderRadius: 9,
                backgroundColor: accent ? 'rgba(255,193,7,0.12)' : 'rgba(255,255,255,0.05)',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Ionicons name={icon as any} size={15} color={accent ? ACCENT : 'rgba(255,255,255,0.5)'} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, flex: 1 }}>{label}</Text>
            <Text style={{ color: accent ? ACCENT : '#fff', fontSize: 13, fontWeight: '700' }}>{value}</Text>
        </View>
    );
}

function SectionCard({ children }: { children: React.ReactNode }) {
    return (
        <View style={{
            backgroundColor: CARD_BG, borderRadius: 16,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
            paddingHorizontal: 18, overflow: 'hidden',
        }}>
            {children}
        </View>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <Text style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 11,
            fontWeight: '700', letterSpacing: 0.8,
            paddingLeft: 4, marginBottom: 6,
        }}>
            {children}
        </Text>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);

    const [data, setData] = useState<MePlanResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        getMePlan(accessToken)
            .then(setData)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, [accessToken]);

    const plan = data?.plan;
    const sub = data?.subscription;
    const planColor = getPlanColor(plan?.nombre ?? user?.plan ?? '');
    const statusCfg = sub ? STATUS_CONFIG[sub.status] : null;
    const remaining = sub ? daysUntil(sub.expirationDate) : null;

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingTop: Platform.OS === 'web' ? 16 : 48,
                paddingBottom: 12, paddingHorizontal: 20, gap: 12,
                borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
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
                    Mi Suscripción
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
                    <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 }}>{error}</Text>
                    <TouchableOpacity
                        onPress={load}
                        style={{
                            paddingHorizontal: 20, paddingVertical: 10,
                            backgroundColor: `${ACCENT}22`, borderRadius: 10,
                            borderWidth: 1, borderColor: `${ACCENT}55`,
                        }}
                    >
                        <Text style={{ color: ACCENT, fontWeight: '700' }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : plan ? (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Plan hero card */}
                    <View style={{
                        backgroundColor: CARD_BG,
                        borderRadius: 20,
                        borderWidth: 1, borderColor: `${planColor}30`,
                        padding: 24, gap: 14,
                        shadowColor: planColor, shadowOpacity: 0.15,
                        shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                    }}>
                        {/* Top row: plan name + status badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                            <View style={{
                                width: 52, height: 52, borderRadius: 14,
                                backgroundColor: `${planColor}20`,
                                alignItems: 'center', justifyContent: 'center',
                                borderWidth: 1, borderColor: `${planColor}40`,
                            }}>
                                <Ionicons name="star" size={24} color={planColor} />
                            </View>
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>
                                    {plan.nombre}
                                </Text>
                                {plan.descripcion ? (
                                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18 }}>
                                        {plan.descripcion}
                                    </Text>
                                ) : null}
                            </View>
                            {statusCfg && (
                                <View style={{
                                    backgroundColor: statusCfg.bg, borderRadius: 20,
                                    paddingHorizontal: 10, paddingVertical: 4,
                                }}>
                                    <Text style={{ color: statusCfg.color, fontSize: 11, fontWeight: '800' }}>
                                        {statusCfg.label}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Price */}
                        {plan.precio != null && (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                <Text style={{ color: planColor, fontSize: 32, fontWeight: '900' }}>
                                    {plan.moneda === 'USD' ? '$' : plan.moneda}{plan.precio.toFixed(2)}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                                    / mes
                                </Text>
                            </View>
                        )}

                        {/* Expiration countdown */}
                        {sub && remaining !== null && (
                            <View style={{
                                backgroundColor: remaining <= 7
                                    ? 'rgba(248,113,113,0.12)'
                                    : 'rgba(255,255,255,0.05)',
                                borderRadius: 12, padding: 14,
                                borderWidth: 1,
                                borderColor: remaining <= 7
                                    ? 'rgba(248,113,113,0.25)'
                                    : 'rgba(255,255,255,0.07)',
                                gap: 2,
                            }}>
                                <Text style={{
                                    color: remaining <= 7 ? '#F87171' : 'rgba(255,255,255,0.4)',
                                    fontSize: 11, fontWeight: '700',
                                }}>
                                    {remaining > 0 ? 'VENCE EN' : 'VENCIÓ HACE'}
                                </Text>
                                <Text style={{
                                    color: remaining <= 7 ? '#F87171' : '#fff',
                                    fontSize: 22, fontWeight: '900',
                                }}>
                                    {Math.abs(remaining)} {Math.abs(remaining) === 1 ? 'día' : 'días'}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                                    Vence el {formatDate(sub.expirationDate)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Subscription dates */}
                    {sub && (
                        <View style={{ gap: 6 }}>
                            <SectionLabel>VIGENCIA</SectionLabel>
                            <SectionCard>
                                <FeatureRow
                                    icon="calendar-outline"
                                    label="Fecha de inicio"
                                    value={formatDate(sub.startDate)}
                                />
                                <FeatureRow
                                    icon="calendar-clear-outline"
                                    label="Fecha de vencimiento"
                                    value={formatDate(sub.expirationDate)}
                                    accent={remaining !== null && remaining <= 7}
                                />
                                {sub.gracePeriodEnd && (
                                    <FeatureRow
                                        icon="hourglass-outline"
                                        label="Fin período de gracia"
                                        value={formatDate(sub.gracePeriodEnd)}
                                    />
                                )}
                            </SectionCard>
                        </View>
                    )}

                    {/* Plan features */}
                    <View style={{ gap: 6 }}>
                        <SectionLabel>CARACTERÍSTICAS DEL PLAN</SectionLabel>
                        <SectionCard>
                            <FeatureRow
                                icon="tv-outline"
                                label="Calidad de video"
                                value={VIDEO_QUALITY_LABEL[plan.videoQuality] ?? plan.videoQuality}
                                accent
                            />
                            <FeatureRow
                                icon="phone-portrait-outline"
                                label="Dispositivos simultáneos"
                                value={`${plan.maxDevices} dispositivo${plan.maxDevices !== 1 ? 's' : ''}`}
                            />
                            <FeatureRow
                                icon="play-circle-outline"
                                label="Streams simultáneos"
                                value={`${plan.maxConcurrentStreams} stream${plan.maxConcurrentStreams !== 1 ? 's' : ''}`}
                            />
                            <FeatureRow
                                icon="people-outline"
                                label="Perfiles"
                                value={`${plan.maxProfiles} perfil${plan.maxProfiles !== 1 ? 'es' : ''}`}
                            />
                        </SectionCard>
                    </View>

                    {/* Perks */}
                    <View style={{ gap: 6 }}>
                        <SectionLabel>FUNCIONES INCLUIDAS</SectionLabel>
                        <SectionCard>
                            <FeatureRow
                                icon={plan.allowDownloads ? 'cloud-download-outline' : 'cloud-offline-outline'}
                                label="Descargas offline"
                                value={plan.allowDownloads ? 'Incluido' : 'No incluido'}
                                accent={plan.allowDownloads}
                            />
                            <FeatureRow
                                icon={plan.allowCasting ? 'cast-outline' : 'cast-outline'}
                                label="Casting / TV"
                                value={plan.allowCasting ? 'Incluido' : 'No incluido'}
                                accent={plan.allowCasting}
                            />
                            <FeatureRow
                                icon={plan.hasAds ? 'megaphone-outline' : 'shield-checkmark-outline'}
                                label="Publicidad"
                                value={plan.hasAds ? 'Con anuncios' : 'Sin anuncios'}
                                accent={!plan.hasAds}
                            />
                        </SectionCard>
                    </View>

                    {/* Entitlements */}
                    {plan.entitlements && plan.entitlements.length > 0 && (
                        <View style={{ gap: 6 }}>
                            <SectionLabel>CONTENIDO DESBLOQUEADO</SectionLabel>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {plan.entitlements.map((e) => (
                                    <View
                                        key={e}
                                        style={{
                                            backgroundColor: `${planColor}15`,
                                            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
                                            borderWidth: 1, borderColor: `${planColor}30`,
                                        }}
                                    >
                                        <Text style={{ color: planColor, fontSize: 11, fontWeight: '700' }}>
                                            {e}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            ) : null}
        </View>
    );
}
