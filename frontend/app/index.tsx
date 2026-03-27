import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/authStore';
import { useEffect } from 'react';

/**
 * Application entry-point / auth-redirect gate.
 *
 * Reads the current auth state from {@link useAuthStore} and after a short
 * delay redirects to the appropriate route:
 * - Authenticated user (has accessToken) → `/(app)/home`
 * - Unauthenticated user → `/(auth)/login`
 *
 * Shows an activity indicator while the redirect is being prepared.
 */
export default function Index() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const router = useRouter();

    useEffect(() => {
        // Short timeout to ensure navigation is ready
        const timer = setTimeout(() => {
            if (accessToken) {
                router.replace('/(app)/home');
            } else {
                router.replace('/(auth)/login');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [accessToken]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD700' }}>
            <ActivityIndicator size="large" color="#000000" />
        </View>
    );
}