import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../../services/adminStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

/**
 * Admin login screen.
 *
 * Renders a password-only form that validates credentials via
 * {@link useAdminStore.adminLogin}. On success, redirects to the Admin Panel.
 * The password field supports a show/hide toggle.
 *
 * State:
 * - `password` — controlled password input.
 * - `showPass`  — toggles password visibility.
 * - `error`     — inline error message.
 * - `loading`   — whether the login action is in progress.
 *
 * Side effect: Watches `isAdminAuth` to redirect immediately when auth state
 * changes externally (e.g. after page reload with persisted session).
 */
export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { adminLogin, isAdminAuth } = useAdminStore();
    const router = useRouter();

    useEffect(() => {
        if (isAdminAuth) router.replace('/admin/panel' as any);
    }, [isAdminAuth]);

    const handleLogin = async () => {
        if (!password) { setError('Ingresa la contraseña'); return; }
        setLoading(true);
        setError('');
        await new Promise((r) => setTimeout(r, 350));
        const ok = adminLogin(password);
        if (!ok) setError('Contraseña incorrecta');
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#1A052E', justifyContent: 'center', alignItems: 'center', padding: 32 }}
        >
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
                <View style={{
                    width: 80, height: 80, backgroundColor: '#FFC107', borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                    shadowColor: '#FFC107', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
                }}>
                    <FontAwesome name="play" size={34} color="#1A052E" />
                </View>
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                    Luki Admin
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
                    Panel de Administración
                </Text>
            </View>

            {/* Card */}
            <View style={{
                width: '100%', maxWidth: 400,
                backgroundColor: '#2A0E47', borderRadius: 20, padding: 24,
                borderWidth: 1, borderColor: '#3D1A6E',
            }}>
                <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 1 }}>
                    CONTRASEÑA
                </Text>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#1A052E', borderRadius: 12,
                    borderWidth: 1, borderColor: error ? '#f87171' : '#4A148C',
                    marginBottom: 6,
                }}>
                    <TextInput
                        style={{
                            flex: 1, color: 'white', paddingHorizontal: 16, paddingVertical: 14,
                            fontSize: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
                        }}
                        placeholder="••••••••"
                        placeholderTextColor="#4b5563"
                        secureTextEntry={!showPass}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setError(''); }}
                        onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity style={{ paddingHorizontal: 16 }} onPress={() => setShowPass(!showPass)}>
                        <FontAwesome name={showPass ? 'eye-slash' : 'eye'} size={18} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {error ? (
                    <Text style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</Text>
                ) : (
                    <View style={{ marginBottom: 12 }} />
                )}

                <TouchableOpacity
                    style={{
                        backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 16,
                        alignItems: 'center', opacity: loading ? 0.75 : 1,
                        shadowColor: '#FFC107', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                    }}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="#1A052E" />
                        : <Text style={{ color: '#1A052E', fontWeight: '800', fontSize: 16 }}>Ingresar</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}