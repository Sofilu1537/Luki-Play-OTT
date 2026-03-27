import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

/**
 * OTP verification screen.
 *
 * Collects the 6-digit OTP code sent to the user's email and delegates
 * phase-2 verification to {@link useAuthStore}. On success, navigates to
 * `/(app)/home`. Displays inline error messages on invalid or expired codes.
 *
 * State:
 * - `code`  — controlled OTP code input.
 * - `error` — inline error message string.
 *
 * Dependencies:
 * - `useAuthStore.verifyOtp` — phase-2 OTP verification against the real backend.
 * - `expo-linear-gradient`   — renders the purple gradient background.
 */
export default function VerifyOtp() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const { verifyOtp, isLoading } = useAuthStore();

    const handleVerify = async () => {
        try {
            setError('');

            if (!code.trim() || code.trim().length !== 6) {
                setError('Ingresa el código de 6 dígitos');
                return;
            }

            await verifyOtp(code.trim());
            router.replace('/(app)/home');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Código OTP inválido o expirado';
            setError(message);
        }
    };

    const Content = (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center">

            <View className="items-center mb-12">
                <View className="flex-row items-center">
                    {/* Logo Placeholder Simulation */}
                    <View className="mr-2">
                        <View className="w-4 h-4 rounded-full bg-luki-accent mb-1 ml-4" />
                        <View className="w-4 h-4 rounded-full bg-luki-accent mb-1 text-right" />
                        <View className="w-4 h-4 rounded-full bg-luki-accent" />
                    </View>
                    <Text className="text-6xl font-extrabold text-white tracking-tighter">luki</Text>
                </View>
                <Text className="text-gray-300 text-lg tracking-widest uppercase mt-2">tu hogar digital</Text>
            </View>

            <View className="bg-black/20 p-6 rounded-2xl backdrop-blur-lg">
                <Text className="text-2xl font-bold text-white mb-2 text-center">Verificación OTP</Text>
                <Text className="text-gray-300 text-sm text-center mb-6">
                    Ingresa el código de 6 dígitos enviado a tu correo
                </Text>

                {error ? <Text className="text-red-500 mb-4 text-center bg-red-500/10 p-2 rounded">{error}</Text> : null}

                <Input
                    placeholder="Código de 6 dígitos"
                    value={code}
                    onChangeText={setCode}
                    label="Código OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <Button title="Verificar" onPress={handleVerify} isLoading={isLoading} />

                <View className="mt-6 items-center">
                    <Text
                        className="text-gray-400 underline"
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        Volver al login
                    </Text>
                    <Text className="text-gray-400 mt-4 text-xs">Versión v1.0.0</Text>
                </View>
            </View>

        </KeyboardAvoidingView>
    );

    return (
        <LinearGradient
            colors={['#4A148C', '#1A052E']}
            style={{ flex: 1, justifyContent: 'center', padding: 20 }}
        >
            <StatusBar style="light" />

            {Platform.OS === 'web' ? (
                Content
            ) : (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    {Content}
                </TouchableWithoutFeedback>
            )}
        </LinearGradient>
    );
}
