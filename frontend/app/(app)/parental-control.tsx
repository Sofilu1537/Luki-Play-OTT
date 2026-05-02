import {
    View, Text, TouchableOpacity, StatusBar, Platform,
    ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../../services/authStore';

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://localhost:3000';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    });
    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.message ?? `Error ${res.status}`), { status: res.status });
    return data as T;
}

const pcApi = {
    getStatus: (t: string) =>
        apiFetch<{ enabled: boolean; level: string }>('/public/parental-control', t),
    enable: (t: string, pin: string, level: string) =>
        apiFetch<void>('/public/parental-control/enable', t, { method: 'POST', body: JSON.stringify({ pin, level }) }),
    disable: (t: string, pin: string) =>
        apiFetch<void>('/public/parental-control/disable', t, { method: 'POST', body: JSON.stringify({ pin }) }),
    verify: (t: string, pin: string) =>
        apiFetch<{ valid: boolean }>('/public/parental-control/verify', t, { method: 'POST', body: JSON.stringify({ pin }) }),
    updateLevel: (t: string, level: string) =>
        apiFetch<void>('/public/parental-control/level', t, { method: 'PATCH', body: JSON.stringify({ level }) }),
    changePin: (t: string, currentPin: string, newPin: string) =>
        apiFetch<void>('/public/parental-control/pin', t, { method: 'PATCH', body: JSON.stringify({ currentPin, newPin }) }),
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
    bg:          '#000000',
    surface:     '#1C1C1E',
    surfaceHigh: '#2C2C2E',
    separator:   'rgba(84,84,88,0.65)',
    label:       '#FFFFFF',
    labelSecond: 'rgba(235,235,245,0.6)',
    labelThird:  'rgba(235,235,245,0.3)',
    blue:        '#0A84FF',
    green:       '#30D158',
    red:         '#FF453A',
    orange:      '#FF9F0A',
    yellow:      '#FFD60A',
} as const;

// ─── Restriction Levels (Disney+/Netflix style) ───────────────────────────────

type Level = 'KIDS' | 'FAMILY' | 'TEEN' | 'ALL';

const LEVELS: {
    id: Level;
    icon: string;
    label: string;
    sublabel: string;
    desc: string;
    color: string;
}[] = [
    {
        id: 'KIDS',
        icon: 'happy',
        label: 'Infantil',
        sublabel: 'Hasta G / TV-Y',
        desc: 'Solo contenido apto para niños menores de 7 años.',
        color: '#30D158',
    },
    {
        id: 'FAMILY',
        icon: 'people',
        label: 'Familiar',
        sublabel: 'Hasta PG / TV-PG',
        desc: 'Contenido para toda la familia. Excluye violencia y adultos.',
        color: '#0A84FF',
    },
    {
        id: 'TEEN',
        icon: 'person',
        label: 'Adolescente',
        sublabel: 'Hasta PG-13 / TV-14',
        desc: 'Apto para mayores de 13. Excluye contenido adulto explícito.',
        color: '#FF9F0A',
    },
    {
        id: 'ALL',
        icon: 'film',
        label: 'Todo',
        sublabel: 'Sin restricción',
        desc: 'Acceso completo. El PIN sigue activo para canales adultos.',
        color: '#636366',
    },
];

// ─── PIN Dots ─────────────────────────────────────────────────────────────────

function PinDots({
    value, error, shakeAnim,
}: {
    value: string;
    error: boolean;
    shakeAnim: Animated.Value;
}) {
    return (
        <Animated.View style={{
            flexDirection: 'row', gap: 20, justifyContent: 'center',
            marginVertical: 28,
            transform: [{ translateX: shakeAnim }],
        }}>
            {[0, 1, 2, 3].map((i) => {
                const filled = value.length > i;
                return (
                    <View key={i} style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: filled
                            ? (error ? C.red : C.green)
                            : 'transparent',
                        borderWidth: 2,
                        borderColor: filled
                            ? (error ? C.red : C.green)
                            : C.surfaceHigh,
                        ...(filled && !error ? {
                            shadowColor: C.green,
                            shadowOpacity: 0.6,
                            shadowRadius: 6,
                        } : {}),
                    }} />
                );
            })}
        </Animated.View>
    );
}

// ─── PIN Keypad ───────────────────────────────────────────────────────────────

function PinKeypad({
    value, onChange, disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    const keys: (string | null)[] = ['1','2','3','4','5','6','7','8','9', null,'0','⌫'];

    return (
        <View style={{
            flexDirection: 'row', flexWrap: 'wrap',
            width: 252, alignSelf: 'center', gap: 10,
        }}>
            {keys.map((k, i) => (
                <TouchableOpacity
                    key={i}
                    disabled={k === null || disabled}
                    onPress={() => {
                        if (k === '⌫') onChange(value.slice(0, -1));
                        else if (value.length < 4 && k) onChange(value + k);
                    }}
                    activeOpacity={k === null ? 1 : 0.55}
                    style={{
                        width: 74, height: 62, borderRadius: 16,
                        backgroundColor: k === null ? 'transparent' : C.surface,
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    {k === '⌫' ? (
                        <Ionicons name="backspace-outline" size={22} color={C.labelSecond} />
                    ) : k ? (
                        <Text style={{ color: C.label, fontSize: 24, fontWeight: '400' }}>{k}</Text>
                    ) : null}
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── PIN Gate (full-screen PIN entry) ────────────────────────────────────────

function PinGate({
    title, subtitle, onSuccess, onBack, token,
}: {
    title: string;
    subtitle: string;
    onSuccess: () => void;
    onBack: () => void;
    token: string;
}) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
        ]).start(() => {
            setTimeout(() => { setPin(''); setError(false); }, 400);
        });
    };

    const handleChange = (v: string) => {
        setError(false);
        setPin(v);
        if (v.length === 4) {
            setTimeout(() => verify(v), 120);
        }
    };

    const verify = async (value: string) => {
        setLoading(true);
        try {
            const { valid } = await pcApi.verify(token, value);
            if (valid) { onSuccess(); }
            else shake();
        } catch {
            shake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                    >
                        <Ionicons name="chevron-back" size={22} color={C.blue} />
                        <Text style={{ color: C.blue, fontSize: 17 }}>Volver</Text>
                    </TouchableOpacity>
                    <Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        Control Parental
                    </Text>
                </View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', paddingTop: 52 }}>
                {/* Lock icon */}
                <View style={{
                    width: 72, height: 72, borderRadius: 20,
                    backgroundColor: 'rgba(10,132,255,0.15)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                }}>
                    <Ionicons name="lock-closed" size={32} color={C.blue} />
                </View>

                <Text style={{ color: C.label, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
                    {title}
                </Text>
                <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', paddingHorizontal: 48, lineHeight: 20 }}>
                    {subtitle}
                </Text>

                {loading ? (
                    <View style={{ marginTop: 52 }}>
                        <ActivityIndicator size="large" color={C.blue} />
                    </View>
                ) : (
                    <>
                        <PinDots value={pin} error={error} shakeAnim={shakeAnim} />
                        {error && (
                            <Text style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>PIN incorrecto</Text>
                        )}
                        <PinKeypad value={pin} onChange={handleChange} disabled={loading} />
                    </>
                )}
            </View>
        </View>
    );
}

// ─── Enable Flow (step 1: choose level → step 2: set PIN → step 3: confirm) ──

function EnableFlow({
    onDone, onCancel, token,
}: {
    onDone: () => void;
    onCancel: () => void;
    token: string;
}) {
    const [step, setStep] = useState<'level' | 'pin' | 'confirm'>('level');
    const [selectedLevel, setSelectedLevel] = useState<Level>('FAMILY');
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
        ]).start(() => setTimeout(() => { setConfirm(''); setError(false); }, 400));
    };

    const handlePinChange = (v: string) => {
        setPin(v);
        if (v.length === 4) setTimeout(() => setStep('confirm'), 120);
    };

    const handleConfirmChange = (v: string) => {
        setError(false);
        setConfirm(v);
        if (v.length === 4) {
            setTimeout(async () => {
                if (v !== pin) { shake(); return; }
                setLoading(true);
                try {
                    await pcApi.enable(token, pin, selectedLevel);
                    onDone();
                } catch {
                    shake();
                } finally { setLoading(false); }
            }, 120);
        }
    };

    if (step === 'level') {
        return (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
                <StatusBar barStyle="light-content" />
                <View style={{
                    paddingTop: Platform.OS === 'web' ? 12 : 52,
                    borderBottomWidth: 0.5, borderBottomColor: C.separator,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                        <TouchableOpacity onPress={onCancel} style={{ paddingHorizontal: 8 }}>
                            <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={{
                            color: C.label, fontSize: 17, fontWeight: '600',
                            position: 'absolute', left: 0, right: 0, textAlign: 'center',
                            ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                        }}>
                            Nivel de restricción
                        </Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
                    <Text style={{ color: C.labelSecond, fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
                        Elige qué tipo de contenido podrá verse sin ingresar el PIN.
                    </Text>

                    {LEVELS.map((lvl) => {
                        const selected = selectedLevel === lvl.id;
                        return (
                            <TouchableOpacity
                                key={lvl.id}
                                onPress={() => setSelectedLevel(lvl.id)}
                                activeOpacity={0.75}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 14,
                                    backgroundColor: selected ? `${lvl.color}18` : C.surface,
                                    borderRadius: 16, padding: 16,
                                    borderWidth: 2,
                                    borderColor: selected ? lvl.color : 'transparent',
                                }}
                            >
                                <View style={{
                                    width: 46, height: 46, borderRadius: 13,
                                    backgroundColor: selected ? `${lvl.color}25` : C.surfaceHigh,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Ionicons name={lvl.icon as any} size={22} color={selected ? lvl.color : C.labelSecond} />
                                </View>
                                <View style={{ flex: 1, gap: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ color: selected ? lvl.color : C.label, fontSize: 16, fontWeight: '700' }}>
                                            {lvl.label}
                                        </Text>
                                        <Text style={{
                                            color: selected ? lvl.color : C.labelThird,
                                            fontSize: 11, fontWeight: '600',
                                            backgroundColor: selected ? `${lvl.color}18` : C.surfaceHigh,
                                            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                                        }}>
                                            {lvl.sublabel}
                                        </Text>
                                    </View>
                                    <Text style={{ color: C.labelSecond, fontSize: 13, lineHeight: 18 }}>{lvl.desc}</Text>
                                </View>
                                <View style={{
                                    width: 22, height: 22, borderRadius: 11,
                                    borderWidth: 2,
                                    borderColor: selected ? lvl.color : C.surfaceHigh,
                                    backgroundColor: selected ? lvl.color : 'transparent',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {selected && <Ionicons name="checkmark" size={12} color="#000" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        onPress={() => setStep('pin')}
                        style={{
                            backgroundColor: C.green, borderRadius: 14,
                            paddingVertical: 16, alignItems: 'center', marginTop: 8,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Continuar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    const isPinStep = step === 'pin';
    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity
                        onPress={() => isPinStep ? setStep('level') : (setConfirm(''), setStep('pin'))}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 2 }}
                    >
                        <Ionicons name="chevron-back" size={22} color={C.blue} />
                        <Text style={{ color: C.blue, fontSize: 17 }}>Atrás</Text>
                    </TouchableOpacity>
                    <Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        {isPinStep ? 'Crear PIN' : 'Confirmar PIN'}
                    </Text>
                </View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
                <View style={{
                    width: 64, height: 64, borderRadius: 18,
                    backgroundColor: 'rgba(48,209,88,0.15)',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                    <Ionicons name={isPinStep ? 'keypad' : 'shield-checkmark'} size={28} color={C.green} />
                </View>
                <Text style={{ color: C.label, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
                    {isPinStep ? 'Elige tu PIN' : 'Confirma tu PIN'}
                </Text>
                <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', paddingHorizontal: 48 }}>
                    {isPinStep
                        ? 'Ingresa un PIN de 4 dígitos para proteger el contenido restringido.'
                        : 'Repite el PIN para confirmar.'}
                </Text>

                {loading ? (
                    <View style={{ marginTop: 52 }}>
                        <ActivityIndicator size="large" color={C.green} />
                    </View>
                ) : (
                    <>
                        <PinDots
                            value={isPinStep ? pin : confirm}
                            error={error}
                            shakeAnim={shakeAnim}
                        />
                        {error && (
                            <Text style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>
                                Los PINs no coinciden
                            </Text>
                        )}
                        <PinKeypad
                            value={isPinStep ? pin : confirm}
                            onChange={isPinStep ? handlePinChange : handleConfirmChange}
                            disabled={loading}
                        />
                    </>
                )}
            </View>
        </View>
    );
}

// ─── Settings View ────────────────────────────────────────────────────────────

function SettingsView({
    enabled, level: initialLevel, onEnableRequest, onDisableRequest, onChangePinRequest, onBack, token,
}: {
    enabled: boolean;
    level: string;
    onEnableRequest: () => void;
    onDisableRequest: () => void;
    onChangePinRequest: () => void;
    onBack: () => void;
    token: string;
}) {
    const [level, setLevel] = useState<Level>((initialLevel as Level) ?? 'ALL');
    const [saving, setSaving] = useState(false);

    const currentLevelCfg = LEVELS.find((l) => l.id === level) ?? LEVELS[3];

    const handleLevelChange = async (newLevel: Level) => {
        if (newLevel === level || !enabled) return;
        setLevel(newLevel);
        setSaving(true);
        try { await pcApi.updateLevel(token, newLevel); }
        catch { setLevel(level); }
        finally { setSaving(false); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity
                        onPress={onBack}
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
                        Control Parental
                    </Text>
                    {saving && <ActivityIndicator size="small" color={C.labelThird} style={{ position: 'absolute', right: 16 }} />}
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

                {/* Status hero */}
                <View style={{
                    backgroundColor: enabled ? 'rgba(48,209,88,0.1)' : C.surface,
                    borderRadius: 20, padding: 20,
                    borderWidth: 1,
                    borderColor: enabled ? 'rgba(48,209,88,0.3)' : 'rgba(255,255,255,0.06)',
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                }}>
                    <View style={{
                        width: 56, height: 56, borderRadius: 16,
                        backgroundColor: enabled ? 'rgba(48,209,88,0.2)' : C.surfaceHigh,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Ionicons
                            name={enabled ? 'shield-checkmark' : 'shield-outline'}
                            size={26}
                            color={enabled ? C.green : C.labelThird}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ color: C.label, fontSize: 17, fontWeight: '700' }}>
                                Control Parental
                            </Text>
                            <View style={{
                                backgroundColor: enabled ? 'rgba(48,209,88,0.2)' : C.surfaceHigh,
                                borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
                            }}>
                                <Text style={{
                                    color: enabled ? C.green : C.labelSecond,
                                    fontSize: 11, fontWeight: '800',
                                }}>
                                    {enabled ? 'ACTIVO' : 'INACTIVO'}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ color: C.labelSecond, fontSize: 13, lineHeight: 18 }}>
                            {enabled
                                ? `Nivel: ${currentLevelCfg.label} · ${currentLevelCfg.sublabel}`
                                : 'Todo el contenido es accesible sin restricciones.'}
                        </Text>
                    </View>
                </View>

                {/* Level selector — only when enabled */}
                {enabled && (
                    <View style={{ gap: 10 }}>
                        <Text style={{ color: C.labelSecond, fontSize: 13, paddingLeft: 4 }}>
                            NIVEL DE RESTRICCIÓN
                        </Text>
                        {LEVELS.map((lvl) => {
                            const selected = level === lvl.id;
                            return (
                                <TouchableOpacity
                                    key={lvl.id}
                                    onPress={() => handleLevelChange(lvl.id)}
                                    activeOpacity={0.75}
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 14,
                                        backgroundColor: selected ? `${lvl.color}14` : C.surface,
                                        borderRadius: 16, padding: 14,
                                        borderWidth: 1.5,
                                        borderColor: selected ? lvl.color : 'rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <View style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        backgroundColor: selected ? `${lvl.color}22` : C.surfaceHigh,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Ionicons name={lvl.icon as any} size={20} color={selected ? lvl.color : C.labelSecond} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{
                                            color: selected ? lvl.color : C.label,
                                            fontSize: 15, fontWeight: '600', marginBottom: 2,
                                        }}>
                                            {lvl.label}
                                            <Text style={{ color: C.labelThird, fontWeight: '400', fontSize: 12 }}>
                                                {'  '}{lvl.sublabel}
                                            </Text>
                                        </Text>
                                        <Text style={{ color: C.labelSecond, fontSize: 12, lineHeight: 17 }}>
                                            {lvl.desc}
                                        </Text>
                                    </View>
                                    <View style={{
                                        width: 20, height: 20, borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: selected ? lvl.color : C.surfaceHigh,
                                        backgroundColor: selected ? lvl.color : 'transparent',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {selected && <Ionicons name="checkmark" size={11} color="#000" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Actions */}
                <View style={{ gap: 10 }}>
                    {!enabled ? (
                        <TouchableOpacity
                            onPress={onEnableRequest}
                            style={{
                                backgroundColor: C.green, borderRadius: 14,
                                paddingVertical: 16, alignItems: 'center',
                                flexDirection: 'row', justifyContent: 'center', gap: 8,
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="shield-checkmark" size={18} color="#000" />
                            <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>
                                Activar control parental
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={onChangePinRequest}
                                style={{
                                    backgroundColor: C.surface, borderRadius: 14,
                                    paddingVertical: 15, alignItems: 'center',
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                                    flexDirection: 'row', justifyContent: 'center', gap: 8,
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="key-outline" size={17} color={C.label} />
                                <Text style={{ color: C.label, fontSize: 15, fontWeight: '600' }}>Cambiar PIN</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onDisableRequest}
                                style={{
                                    backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: 14,
                                    paddingVertical: 15, alignItems: 'center',
                                    borderWidth: 1, borderColor: 'rgba(255,69,58,0.18)',
                                    flexDirection: 'row', justifyContent: 'center', gap: 8,
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="lock-open-outline" size={17} color={C.red} />
                                <Text style={{ color: C.red, fontSize: 15, fontWeight: '600' }}>
                                    Desactivar control parental
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <Text style={{
                    color: C.labelThird, fontSize: 12, textAlign: 'center',
                    paddingHorizontal: 24, lineHeight: 18,
                }}>
                    El PIN de 4 dígitos protege el acceso a contenido restringido en todos tus dispositivos.
                    {'\n'}Si olvidaste tu PIN, contacta a soporte.
                </Text>
            </ScrollView>
        </View>
    );
}

// ─── Change PIN flow ──────────────────────────────────────────────────────────

function ChangePinFlow({
    onDone, onCancel, token,
}: {
    onDone: () => void;
    onCancel: () => void;
    token: string;
}) {
    const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = (cb?: () => void) => {
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
        ]).start(() => setTimeout(() => { setError(false); cb?.(); }, 400));
    };

    const titles = { current: 'PIN actual', new: 'Nuevo PIN', confirm: 'Confirmar nuevo PIN' };
    const subtitles = {
        current: 'Ingresa tu PIN actual para continuar.',
        new: 'Elige un nuevo PIN de 4 dígitos.',
        confirm: 'Repite el nuevo PIN para confirmar.',
    };
    const activeValue = step === 'current' ? currentPin : step === 'new' ? newPin : confirm;

    const handleChange = (v: string) => {
        setError(false);
        if (step === 'current') {
            setCurrentPin(v);
            if (v.length === 4) {
                setTimeout(async () => {
                    setLoading(true);
                    try {
                        const { valid } = await pcApi.verify(token, v);
                        if (valid) { setStep('new'); setNewPin(''); }
                        else shake(() => setCurrentPin(''));
                    } catch { shake(() => setCurrentPin('')); }
                    finally { setLoading(false); }
                }, 120);
            }
        } else if (step === 'new') {
            setNewPin(v);
            if (v.length === 4) setTimeout(() => { setStep('confirm'); setConfirm(''); }, 120);
        } else {
            setConfirm(v);
            if (v.length === 4) {
                setTimeout(async () => {
                    if (v !== newPin) { shake(() => setConfirm('')); return; }
                    setLoading(true);
                    try { await pcApi.changePin(token, currentPin, newPin); onDone(); }
                    catch { shake(() => setConfirm('')); }
                    finally { setLoading(false); }
                }, 120);
            }
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity onPress={onCancel} style={{ paddingHorizontal: 8 }}>
                        <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        Cambiar PIN
                    </Text>
                </View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
                <View style={{
                    width: 64, height: 64, borderRadius: 18,
                    backgroundColor: 'rgba(10,132,255,0.15)',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                    <Ionicons name="key" size={28} color={C.blue} />
                </View>
                <Text style={{ color: C.label, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
                    {titles[step]}
                </Text>
                <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', paddingHorizontal: 48 }}>
                    {subtitles[step]}
                </Text>

                {loading ? (
                    <View style={{ marginTop: 52 }}>
                        <ActivityIndicator size="large" color={C.blue} />
                    </View>
                ) : (
                    <>
                        <PinDots value={activeValue} error={error} shakeAnim={shakeAnim} />
                        {error && (
                            <Text style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>
                                {step === 'confirm' ? 'Los PINs no coinciden' : 'PIN incorrecto'}
                            </Text>
                        )}
                        <PinKeypad value={activeValue} onChange={handleChange} disabled={loading} />
                    </>
                )}
            </View>
        </View>
    );
}

// ─── Disable Flow ─────────────────────────────────────────────────────────────

function DisableFlow({ onDone, onCancel, token }: { onDone: () => void; onCancel: () => void; token: string }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
        ]).start(() => setTimeout(() => { setPin(''); setError(false); }, 400));
    };

    const handleChange = (v: string) => {
        setError(false);
        setPin(v);
        if (v.length === 4) {
            setTimeout(async () => {
                setLoading(true);
                try { await pcApi.disable(token, v); onDone(); }
                catch { shake(); }
                finally { setLoading(false); }
            }, 120);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="light-content" />
            <View style={{
                paddingTop: Platform.OS === 'web' ? 12 : 52,
                borderBottomWidth: 0.5, borderBottomColor: C.separator,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, height: 44 }}>
                    <TouchableOpacity onPress={onCancel} style={{ paddingHorizontal: 8 }}>
                        <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={{
                        color: C.label, fontSize: 17, fontWeight: '600',
                        position: 'absolute', left: 0, right: 0, textAlign: 'center',
                        ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
                    }}>
                        Desactivar
                    </Text>
                </View>
            </View>

            <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
                <View style={{
                    width: 64, height: 64, borderRadius: 18,
                    backgroundColor: 'rgba(255,69,58,0.12)',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                    <Ionicons name="lock-open-outline" size={28} color={C.red} />
                </View>
                <Text style={{ color: C.label, fontSize: 20, fontWeight: '700', marginBottom: 6 }}>
                    Confirma tu PIN
                </Text>
                <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', paddingHorizontal: 48 }}>
                    Ingresa tu PIN para desactivar el control parental.
                </Text>

                {loading ? (
                    <View style={{ marginTop: 52 }}>
                        <ActivityIndicator size="large" color={C.red} />
                    </View>
                ) : (
                    <>
                        <PinDots value={pin} error={error} shakeAnim={shakeAnim} />
                        {error && <Text style={{ color: C.red, fontSize: 13, marginBottom: 8 }}>PIN incorrecto</Text>}
                        <PinKeypad value={pin} onChange={handleChange} disabled={loading} />
                    </>
                )}
            </View>
        </View>
    );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

type ScreenView = 'loading' | 'gate' | 'settings' | 'enable' | 'change-pin' | 'disable';

export default function ParentalControlScreen() {
    const router = useRouter();
    const accessToken = useAuthStore((s: any) => s.accessToken);

    const [view, setView] = useState<ScreenView>('loading');
    const [enabled, setEnabled] = useState(false);
    const [level, setLevel] = useState('ALL');
    const [feedback, setFeedback] = useState<string | null>(null);
    const feedbackOpacity = useRef(new Animated.Value(0)).current;

    const showFeedback = useCallback((msg: string) => {
        setFeedback(msg);
        Animated.sequence([
            Animated.timing(feedbackOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(2200),
            Animated.timing(feedbackOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(() => setFeedback(null));
    }, [feedbackOpacity]);

    const load = useCallback(async () => {
        if (!accessToken) return;
        try {
            const status = await pcApi.getStatus(accessToken);
            setEnabled(status.enabled);
            setLevel(status.level);
            setView(status.enabled ? 'gate' : 'settings');
        } catch {
            setView('settings');
        }
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    if (view === 'loading') {
        return (
            <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color={C.blue} />
            </View>
        );
    }

    if (view === 'gate') {
        return (
            <PinGate
                title="Ingresa tu PIN"
                subtitle="El control parental está activo. Ingresa tu PIN para ver o modificar la configuración."
                token={accessToken!}
                onSuccess={() => setView('settings')}
                onBack={() => router.back()}
            />
        );
    }

    if (view === 'enable') {
        return (
            <EnableFlow
                token={accessToken!}
                onCancel={() => setView('settings')}
                onDone={() => {
                    setEnabled(true);
                    setView('settings');
                    showFeedback('Control parental activado');
                    load();
                }}
            />
        );
    }

    if (view === 'change-pin') {
        return (
            <ChangePinFlow
                token={accessToken!}
                onCancel={() => setView('settings')}
                onDone={() => {
                    setView('settings');
                    showFeedback('PIN actualizado correctamente');
                }}
            />
        );
    }

    if (view === 'disable') {
        return (
            <DisableFlow
                token={accessToken!}
                onCancel={() => setView('settings')}
                onDone={() => {
                    setEnabled(false);
                    setLevel('ALL');
                    setView('settings');
                    showFeedback('Control parental desactivado');
                    load();
                }}
            />
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <SettingsView
                enabled={enabled}
                level={level}
                token={accessToken!}
                onBack={() => router.back()}
                onEnableRequest={() => setView('enable')}
                onDisableRequest={() => setView('disable')}
                onChangePinRequest={() => setView('change-pin')}
            />

            {/* Feedback toast */}
            {feedback && (
                <Animated.View style={{
                    position: 'absolute', bottom: 40, left: 24, right: 24,
                    backgroundColor: '#1C1C1E', borderRadius: 14,
                    paddingVertical: 14, paddingHorizontal: 20,
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20,
                    opacity: feedbackOpacity,
                }}>
                    <Ionicons name="checkmark-circle" size={20} color={C.green} />
                    <Text style={{ color: C.label, fontSize: 14, fontWeight: '600' }}>{feedback}</Text>
                </Animated.View>
            )}
        </View>
    );
}
