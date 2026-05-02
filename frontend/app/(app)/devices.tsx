import {
    View, Text, ScrollView, TouchableOpacity, StatusBar,
    ActivityIndicator, Platform, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, DEV_DEVICE_ID } from '../../services/authStore';
import {
    getDevices, renameDevice, removeDevice,
    registerDevice,
} from '../../services/api/deviceApi';
import type { DeviceListItem, DeviceType } from '../../services/api/deviceApi';

// ─── Palette (matches profile.tsx Apple-dark) ─────────────────────────────────

const C = {
    bg:          '#000000',
    surface:     '#1C1C1E',
    surfaceHigh: '#2C2C2E',
    separator:   'rgba(84,84,88,0.65)',
    sepInset:    'rgba(84,84,88,0.45)',
    label:       '#FFFFFF',
    labelSecond: 'rgba(235,235,245,0.6)',
    labelThird:  'rgba(235,235,245,0.3)',
    blue:        '#0A84FF',
    green:       '#30D158',
    red:         '#FF453A',
    orange:      '#FF9F0A',
    teal:        '#5AC8FA',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<DeviceType, string> = {
    MOBILE:   'phone-portrait-outline',
    TABLET:   'tablet-portrait-outline',
    DESKTOP:  'desktop-outline',
    SMART_TV: 'tv-outline',
    UNKNOWN:  'hardware-chip-outline',
};

const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
    MOBILE:   'Celular',
    TABLET:   'Tablet',
    DESKTOP:  'Computadora',
    SMART_TV: 'Smart TV',
    UNKNOWN:  'Dispositivo',
};

function timeAgo(iso: string | null): string {
    if (!iso) return 'Nunca';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 2) return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `Hace ${days}d`;
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

function deviceDisplayName(d: DeviceListItem): string {
    if (d.nombre) return d.nombre;
    const parts: string[] = [];
    if (d.os) parts.push(d.os);
    if (d.browser) parts.push(d.browser);
    return parts.length ? parts.join(' · ') : DEVICE_TYPE_LABEL[d.tipo];
}

// ─── Rename Sheet ─────────────────────────────────────────────────────────────

function RenameSheet({
    visible, initialName, onClose, onSave,
}: {
    visible: boolean;
    initialName: string;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}) {
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (visible) setValue(initialName); }, [visible, initialName]);

    const handleSave = async () => {
        if (!value.trim()) return;
        setSaving(true);
        try { await onSave(value.trim()); onClose(); }
        catch { /* error handled upstream */ }
        finally { setSaving(false); }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} activeOpacity={1} onPress={onClose} />
                <View style={{
                    backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                }}>
                    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.surfaceHigh }} />
                    </View>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 20, paddingVertical: 12,
                        borderBottomWidth: 0.5, borderBottomColor: C.separator,
                    }}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={{ flex: 1, textAlign: 'center', color: C.label, fontSize: 17, fontWeight: '600' }}>
                            Renombrar
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving || !value.trim()}>
                            <Text style={{ color: value.trim() ? C.blue : C.labelThird, fontSize: 17, fontWeight: '600' }}>
                                {saving ? '...' : 'Guardar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 20 }}>
                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            placeholder="Nombre del dispositivo"
                            placeholderTextColor={C.labelThird}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                            style={{
                                backgroundColor: C.surfaceHigh, borderRadius: 10,
                                color: C.label, fontSize: 17,
                                paddingHorizontal: 14, paddingVertical: 12,
                                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
                            }}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Device Card ──────────────────────────────────────────────────────────────

function DeviceCard({
    device, isLast, onRename, onRemove,
}: {
    device: DeviceListItem;
    isLast: boolean;
    onRename: () => void;
    onRemove: () => void;
}) {
    const icon = DEVICE_ICONS[device.tipo];
    const name = deviceDisplayName(device);
    const sub = [device.os, device.browser].filter(Boolean).join(' · ') || DEVICE_TYPE_LABEL[device.tipo];
    const isCurrent = device.isCurrentDevice;

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 14 }}>
                {/* Icon */}
                <View style={{
                    width: 42, height: 42, borderRadius: 11,
                    backgroundColor: isCurrent ? 'rgba(10,132,255,0.18)' : C.surfaceHigh,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Ionicons name={icon as any} size={20} color={isCurrent ? C.blue : C.labelSecond} />
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: C.label, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
                            {name}
                        </Text>
                        {isCurrent && (
                            <View style={{
                                backgroundColor: 'rgba(10,132,255,0.18)',
                                borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                            }}>
                                <Text style={{ color: C.blue, fontSize: 11, fontWeight: '700' }}>Este</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ color: C.labelSecond, fontSize: 13 }} numberOfLines={1}>{sub}</Text>
                    <Text style={{ color: C.labelThird, fontSize: 12 }}>
                        Visto {timeAgo(device.lastSeenAt)} · {device.ipAddress ?? 'IP desconocida'}
                    </Text>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                        onPress={onRename}
                        style={{
                            width: 34, height: 34, borderRadius: 9,
                            backgroundColor: C.surfaceHigh, alignItems: 'center', justifyContent: 'center',
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="pencil" size={15} color={C.labelSecond} />
                    </TouchableOpacity>
                    {!isCurrent && (
                        <TouchableOpacity
                            onPress={onRemove}
                            style={{
                                width: 34, height: 34, borderRadius: 9,
                                backgroundColor: 'rgba(255,69,58,0.12)', alignItems: 'center', justifyContent: 'center',
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={15} color={C.red} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {!isLast && (
                <View style={{ height: 0.5, backgroundColor: C.sepInset, marginLeft: 72 }} />
            )}
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DevicesScreen() {
    const router = useRouter();
    const accessToken = useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.accessToken);

    const [devices, setDevices] = useState<DeviceListItem[]>([]);
    const [limit, setLimit] = useState(3);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [renameTarget, setRenameTarget] = useState<DeviceListItem | null>(null);

    const load = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError(null);
        try {
            // Ensure this device is registered before fetching
            await registerDevice(accessToken, DEV_DEVICE_ID).catch(() => { /* best-effort */ });
            const data = await getDevices(accessToken, DEV_DEVICE_ID);
            setDevices(data.devices);
            setLimit(data.limit);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cargar dispositivos');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    const handleRename = async (nombre: string) => {
        if (!accessToken || !renameTarget) return;
        await renameDevice(accessToken, renameTarget.deviceFingerprint, nombre);
        setDevices((prev) => prev.map((d) =>
            d.deviceFingerprint === renameTarget.deviceFingerprint ? { ...d, nombre } : d,
        ));
    };

    const handleRemove = (device: DeviceListItem) => {
        if (Platform.OS === 'web') {
            if (!confirm(`¿Eliminar "${deviceDisplayName(device)}"? Su sesión en este dispositivo será cerrada.`)) return;
            doRemove(device);
        } else {
            Alert.alert(
                'Eliminar dispositivo',
                `¿Eliminar "${deviceDisplayName(device)}"?\n\nSu sesión en este dispositivo será cerrada.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => doRemove(device) },
                ],
            );
        }
    };

    const doRemove = async (device: DeviceListItem) => {
        if (!accessToken) return;
        try {
            await removeDevice(accessToken, device.deviceFingerprint, DEV_DEVICE_ID);
            setDevices((prev) => prev.filter((d) => d.deviceFingerprint !== device.deviceFingerprint));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error al eliminar';
            if (Platform.OS === 'web') alert(msg);
            else Alert.alert('Error', msg);
        }
    };

    const usedSlots = devices.length;
    const slotsColor = usedSlots >= limit ? C.red : usedSlots >= limit - 1 ? C.orange : C.green;

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
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
                        <Text style={{ color: C.blue, fontSize: 17 }}>Perfil</Text>
                    </TouchableOpacity>

                    <Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        Mis Dispositivos
                    </Text>
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
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingVertical: 24, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Slot indicator */}
                    <View style={{
                        marginHorizontal: 16, marginBottom: 20,
                        backgroundColor: C.surface, borderRadius: 14,
                        padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
                    }}>
                        <View style={{
                            width: 44, height: 44, borderRadius: 11,
                            backgroundColor: `${slotsColor}20`,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Ionicons name="phone-portrait" size={22} color={slotsColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: C.label, fontSize: 15, fontWeight: '600' }}>
                                {usedSlots} de {limit} dispositivos
                            </Text>
                            <Text style={{ color: C.labelSecond, fontSize: 13, marginTop: 2 }}>
                                {usedSlots >= limit
                                    ? 'Límite alcanzado. Elimina uno para registrar otro.'
                                    : `Puedes agregar ${limit - usedSlots} dispositivo${limit - usedSlots !== 1 ? 's' : ''} más.`}
                            </Text>
                        </View>
                        {/* Progress bar */}
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 1.5, overflow: 'hidden' }}>
                            <View style={{ flex: 1, backgroundColor: C.surfaceHigh }} />
                            <View style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: `${Math.min((usedSlots / limit) * 100, 100)}%` as any,
                                backgroundColor: slotsColor, borderRadius: 1.5,
                            }} />
                        </View>
                    </View>

                    {/* Device list */}
                    {devices.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingTop: 32, gap: 10 }}>
                            <Ionicons name="phone-portrait-outline" size={48} color={C.labelThird} />
                            <Text style={{ color: C.labelSecond, fontSize: 15 }}>No hay dispositivos registrados</Text>
                            <Text style={{ color: C.labelThird, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                                Inicia sesión desde un dispositivo para que aparezca aquí.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={{
                                color: C.labelSecond, fontSize: 13, paddingHorizontal: 20,
                                marginBottom: 6, letterSpacing: 0.1,
                            }}>
                                Dispositivos activos
                            </Text>
                            <View style={{
                                backgroundColor: C.surface, marginHorizontal: 16,
                                borderRadius: 14, overflow: 'hidden',
                            }}>
                                {devices.map((d, i) => (
                                    <DeviceCard
                                        key={d.id}
                                        device={d}
                                        isLast={i === devices.length - 1}
                                        onRename={() => setRenameTarget(d)}
                                        onRemove={() => handleRemove(d)}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    <Text style={{
                        color: C.labelThird, fontSize: 12, textAlign: 'center',
                        paddingHorizontal: 32, paddingTop: 20, lineHeight: 18,
                    }}>
                        Al eliminar un dispositivo, su sesión activa será cerrada automáticamente.
                    </Text>
                </ScrollView>
            )}

            <RenameSheet
                visible={!!renameTarget}
                initialName={renameTarget ? deviceDisplayName(renameTarget) : ''}
                onClose={() => setRenameTarget(null)}
                onSave={handleRename}
            />
        </View>
    );
}
