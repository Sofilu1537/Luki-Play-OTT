import { Stack, useRouter } from 'expo-router';
import { useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../../services/authStore';
import { useEffect } from 'react';

/**
 * Protected area layout.
 *
 * All routes under (app)/ — including the player — require a valid
 * session. Unauthenticated users are redirected to login.
 *
 * Structure:
 *   (app)/
 *     (tabs)/   — main tab navigation (home, search, favorites)
 *     player/   — full-screen player, renders over tabs
 */
export default function AppLayout() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const router = useRouter();
    const rootNavState = useRootNavigationState();

    useEffect(() => {
        useAuthStore.getState().restoreSession();
    }, []);

    useEffect(() => {
        if (!rootNavState?.key) return;
        if (!accessToken) {
            router.replace('/(auth)/login');
        }
    }, [rootNavState?.key, accessToken, router]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="player" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="subscription" />
        </Stack>
    );
}
