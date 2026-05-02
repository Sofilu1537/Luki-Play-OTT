import {
    View, Text, TouchableOpacity, StatusBar, Platform,
    ActivityIndicator, Modal, TextInput,
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
    getStatus: (token: string) => apiFetch<{ enabled: boolean }>('/public/parental-control', token),
    enable: (token: string, pin: string) => apiFetch<void>('/public/parental-control/enable', token, { method: 'POST', body: JSON.stringify({ pin }) }),
    disable: (token: string, pin: string) => apiFetch<void>('/public/parental-control/disable', token, { method: 'POST', body: JSON.stringify({ pin }) }),
    changePin: (token: string, currentPin: string, newPin: string) =>
        apiFetch<void>('/public/parental-control/pin', token, { method: 'PATCH', body: JSON.stringify({ currentPin, newPin }) }),
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
} as const;

// ─── PIN Keypad ───────────────────────────────────────────────────────────────

function PinDots({ value, error }: { value: string; error: boolean }) {
    return (
        <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center', marginVertical: 24 }}>
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{
                    width: 16, height: 16, borderRadius: 8,
                    backgroundColor: value.length > i
                        ? (error ? C.red : C.green)
                        : C.surfaceHigh,
                    borderWidth: value.length === i ? 2 : 0,
                    borderColor: C.labelThird,
                }} />
            ))}
        </View>
    );
}

function PinKeypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 240, alignSelf: 'center', gap: 12 }}>
            {keys.map((k, i) => (
                <TouchableOpacity
                    key={i}
                    disabled={k === ''}
                    onPress={() => {
                        if (k === '⌫') onChange(value.slice(0, -1));
                        else if (value.length < 4) onChange(value + k);
                    }}
                    style={{
                        width: 68, height: 58, borderRadius: 14,
                        backgroundColor: k === '' ? 'transparent' : C.surface,
                        alignItems: 'center', justifyContent: 'center',
                    }}
                    activeOpacity={k === '' ? 1 : 0.6}
                >
                    <Text style={{
                        color: k === '⌫' ? C.labelSecond : C.label,
                        fontSize: k === '⌫' ? 20 : 22,
                        fontWeight: '500',
                    }}>
                        {k}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── PIN Flow Modal ───────────────────────────────────────────────────────────

type PinFlowMode = 'enable-enter' | 'enable-confirm' | 'disable' | 'change-current' | 'change-new' | 'change-confirm';

function PinFlowModal({
    visible, mode, onClose, onDone,
}: {
    visible: boolean;
    mode: 'enable' | 'disable' | 'change';
    onClose: () => void;
    onDone: (pins: { pin?: string; currentPin?: string; newPin?: string }) => Promise<void>;
}) {
    const [step, setStep] = useState<PinFlowMode>(
        mode === 'enable' ? 'enable-enter' : mode === 'disable' ? 'disable' : 'change-current',
    );
    const [pin, setPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [currentPin, setCurrentPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setStep(mode === 'enable' ? 'enable-enter' : mode === 'disable' ? 'disable' : 'change-current');
            setPin(''); setConfirm(''); setCurrentPin(''); setError(null);
        }
    }, [visible, mode]);

    const titles: Record<PinFlowMode, string> = {
        'enable-enter':    'Crear PIN',
        'enable-confirm':  'Confirmar PIN',
        'disable':         'Ingresa tu PIN',
        'change-current':  'PIN actual',
        'change-new':      'Nuevo PIN',
        'change-confirm':  'Confirmar nuevo PIN',
    };
    const subtitles: Record<PinFlowMode, string> = {
        'enable-enter':    'Elige un PIN de 4 dígitos para proteger contenido para adultos.',
        'enable-confirm':  'Ingresa el PIN nuevamente para confirmar.',
        'disable':         'Ingresa tu PIN para desactivar el control parental.',
        'change-current':  'Ingresa tu PIN actual para continuar.',
        'change-new':      'Elige tu nuevo PIN de 4 dígitos.',
        'change-confirm':  'Repite el nuevo PIN para confirmar.',
    };

    const activeValue = (['enable-enter', 'change-new', 'change-confirm', 'enable-confirm'].includes(step))
        ? (step === 'enable-confirm' || step === 'change-confirm' ? confirm : step === 'change-new' ? confirm : pin)
        : step === 'disable' ? pin : currentPin;

    const handleChange = (v: string) => {
        setError(null);
        if (step === 'enable-enter') setPin(v);
        else if (step === 'enable-confirm') setConfirm(v);
        else if (step === 'disable') setPin(v);
        else if (step === 'change-current') setCurrentPin(v);
        else if (step === 'change-new') setPin(v);
        else if (step === 'change-confirm') setConfirm(v);
    };

    const currentValue = () => {
        if (step === 'enable-enter' || step === 'change-new') return pin;
        if (step === 'enable-confirm' || step === 'change-confirm') return confirm;
        if (step === 'disable') return pin;
        if (step === 'change-current') return currentPin;
        return '';
    };

    useEffect(() => {
        const v = currentValue();
        if (v.length < 4) return;

        if (step === 'enable-enter') { setStep('enable-confirm'); setConfirm(''); return; }
        if (step === 'change-current') { setStep('change-new'); setPin(''); return; }
        if (step === 'change-new') { setStep('change-confirm'); setConfirm(''); return; }

        if (step === 'enable-confirm') {
            if (v !== pin) { setError('Los PINs no coinciden'); setConfirm(''); return; }
            submit();
        }
        if (step === 'disable') submit();
        if (step === 'change-confirm') {
            if (v !== pin) { setError('Los PINs no coinciden'); setConfirm(''); return; }
            submit();
        }
    }, [pin, confirm, currentPin]);

    const submit = async () => {
        setLoading(true);
        try {
            if (mode === 'enable') await onDone({ pin });
            else if (mode === 'disable') await onDone({ pin });
            else await onDone({ currentPin, newPin: pin });
            onClose();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error');
            setPin(''); setConfirm(''); setCurrentPin('');
            setStep(mode === 'enable' ? 'enable-enter' : mode === 'disable' ? 'disable' : 'change-current');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={onClose} />
                <View style={{
                    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 8,
                }}>
                    {/* Handle */}
                    <View style={{ alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.surfaceHigh }} />
                    </View>

                    {/* Header */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 20, paddingVertical: 10,
                        borderBottomWidth: 0.5, borderBottomColor: C.separator,
                    }}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: C.blue, fontSize: 17 }}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={{ flex: 1, textAlign: 'center', color: C.label, fontSize: 17, fontWeight: '600' }}>
                            {titles[step]}
                        </Text>
                        <View style={{ width: 60 }} />
                    </View>

                    <View style={{ paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' }}>
                        <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                            {subtitles[step]}
                        </Text>

                        <PinDots value={currentValue()} error={!!error} />

                        {error && (
                            <Text style={{ color: C.red, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                                {error}
                            </Text>
                        )}

                        {loading ? (
                            <ActivityIndicator color={C.green} style={{ marginVertical: 24 }} />
                        ) : (
                            <PinKeypad value={currentValue()} onChange={handleChange} />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ParentalControlScreen() {
    const router = useRouter();
    const accessToken = useAuthStore((s: any) => s.accessToken);

    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [flowMode, setFlowMode] = useState<'enable' | 'disable' | 'change' | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true); setError(null);
        try {
            const { enabled: e } = await pcApi.getStatus(accessToken);
            setEnabled(e);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cargar');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleDone = async (pins: { pin?: string; currentPin?: string; newPin?: string }) => {
        if (!accessToken) return;
        if (flowMode === 'enable') {
            await pcApi.enable(accessToken, pins.pin!);
            setEnabled(true);
            showFeedback('Control parental activado');
        } else if (flowMode === 'disable') {
            await pcApi.disable(accessToken, pins.pin!);
            setEnabled(false);
            showFeedback('Control parental desactivado');
        } else if (flowMode === 'change') {
            await pcApi.changePin(accessToken, pins.currentPin!, pins.newPin!);
            showFeedback('PIN actualizado correctamente');
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
                        Control Parental
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
                    <Text style={{ color: C.labelSecond, textAlign: 'center', fontSize: 15 }}>{error}</Text>
                    <TouchableOpacity onPress={load} style={{ paddingHorizontal: 24, paddingVertical: 11, backgroundColor: C.blue, borderRadius: 22 }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1, paddingTop: 32 }}>
                    {/* Status hero */}
                    <View style={{ alignItems: 'center', paddingHorizontal: 32, marginBottom: 40, gap: 14 }}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 22,
                            backgroundColor: enabled ? 'rgba(48,209,88,0.15)' : C.surface,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Ionicons
                                name={enabled ? 'shield-checkmark' : 'shield-outline'}
                                size={38}
                                color={enabled ? C.green : C.labelThird}
                            />
                        </View>
                        <Text style={{ color: C.label, fontSize: 22, fontWeight: '700' }}>
                            {enabled ? 'Activado' : 'Desactivado'}
                        </Text>
                        <Text style={{ color: C.labelSecond, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                            {enabled
                                ? 'El contenido para adultos requiere ingresar tu PIN para ser visto.'
                                : 'Activa el control parental para restringir el acceso a contenido para adultos con un PIN.'}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={{ marginHorizontal: 16, gap: 10 }}>
                        {!enabled ? (
                            <TouchableOpacity
                                onPress={() => setFlowMode('enable')}
                                style={{
                                    backgroundColor: C.green, borderRadius: 14,
                                    paddingVertical: 16, alignItems: 'center',
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Activar control parental</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => setFlowMode('change')}
                                    style={{
                                        backgroundColor: C.surface, borderRadius: 14,
                                        paddingVertical: 16, alignItems: 'center',
                                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ color: C.label, fontSize: 16, fontWeight: '600' }}>Cambiar PIN</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setFlowMode('disable')}
                                    style={{
                                        backgroundColor: 'rgba(255,69,58,0.12)', borderRadius: 14,
                                        paddingVertical: 16, alignItems: 'center',
                                        borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ color: C.red, fontSize: 16, fontWeight: '600' }}>Desactivar control parental</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    <Text style={{
                        color: C.labelThird, fontSize: 12, textAlign: 'center',
                        paddingHorizontal: 40, paddingTop: 24, lineHeight: 18,
                    }}>
                        El PIN es de 4 dígitos numéricos. Si lo olvidas, deberás contactar a soporte.
                    </Text>
                </View>
            )}

            {/* Feedback toast */}
            {feedback && (
                <View style={{
                    position: 'absolute', bottom: 40, left: 24, right: 24,
                    backgroundColor: C.surface, borderRadius: 14,
                    paddingVertical: 14, paddingHorizontal: 20,
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16,
                }}>
                    <Ionicons name="checkmark-circle" size={20} color={C.green} />
                    <Text style={{ color: C.label, fontSize: 14, fontWeight: '600' }}>{feedback}</Text>
                </View>
            )}

            {flowMode && (
                <PinFlowModal
                    visible={!!flowMode}
                    mode={flowMode}
                    onClose={() => setFlowMode(null)}
                    onDone={handleDone}
                />
            )}
        </View>
    );
}
