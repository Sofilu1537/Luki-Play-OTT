import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useAuthStore } from '../../services/authStore';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import LukiPlayLogo from '../../components/LukiPlayLogo';

/**
 * Login screen for end users.
 *
 * Collects contract number and password, validates them client-side, and
 * delegates phase-1 authentication to {@link useAuthStore}. On success,
 * navigates to `/(auth)/verify-otp` for OTP verification.
 * Displays inline error messages on validation or auth failure.
 *
 * State:
 * - `contractNumber` — controlled contract number input.
 * - `password`       — controlled password input.
 * - `error`          — inline error message string.
 *
 * Dependencies:
 * - `useAuthStore.login` — phase-1 login against the real backend.
 * - `expo-linear-gradient` — renders the purple gradient background.
 */
export default function Login() {
    const [contractNumber, setContractNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const { login, isLoading } = useAuthStore();

    const handleLogin = async () => {
        try {
            setError('');

            if (!contractNumber.trim()) {
                setError('El número de contrato es requerido');
                return;
            }

            if (!password) {
                setError('La contraseña es requerida');
                return;
            }

            await login(contractNumber.trim(), password);
            router.replace('/(auth)/verify-otp');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Credenciales inválidas';
            setError(message);
        }
    };

    const Content = (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center">

            <View className="items-center mb-12">
                <LukiPlayLogo variant="full" size={140} />
                <Text className="text-gray-300 text-lg tracking-widest uppercase mt-4">tu hogar digital</Text>
            </View>

            <View className="bg-black/20 p-6 rounded-2xl backdrop-blur-lg">
                <Text className="text-2xl font-bold text-white mb-6 text-center">Bienvenido de nuevo</Text>

                {error ? <Text className="text-red-500 mb-4 text-center bg-red-500/10 p-2 rounded">{error}</Text> : null}

                <Input
                    placeholder="Número de contrato"
                    value={contractNumber}
                    onChangeText={setContractNumber}
                    label="Número de contrato"
                />
                <Input
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    label="Contraseña"
                />

                <Button title="Entrar" onPress={handleLogin} isLoading={isLoading} />

                <View className="mt-6 items-center">
                    <Text className="text-gray-400">¿Olvidaste tu contraseña?</Text>
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