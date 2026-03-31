import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/authStore';
import { useEffect, useState } from 'react';

/**
 * Application entry-point / auth-redirect gate.
 *
 * On first render, attempts to restore a previously persisted session via
 * {@link useAuthStore.restoreSession}. After restoration completes, redirects:
 * - Authenticated user (has accessToken) → `/(app)/home`
 * - Unauthenticated user → `/(auth)/login`
 *
 * Shows an activity indicator while restoring and redirecting.
 */
export default function Index() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const restoreSession = useAuthStore((state) => state.restoreSession);
    const router = useRouter();
    const [restored, setRestored] = useState(false);

    useEffect(() => {
        restoreSession().finally(() => setRestored(true));
    }, []);

    useEffect(() => {
        if (!restored) return;
        const timer = setTimeout(() => {
            if (accessToken) {
                router.replace('/(app)/home');
            } else {
                router.replace('/(auth)/login');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [restored, accessToken]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
            <ActivityIndicator size="large" color="#6D28D9" />
        </View>
    );
}