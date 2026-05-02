import { Stack, useRouter } from 'expo-router';
import { useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../../services/authStore';
import { useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';

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
 *
 * Includes a 4-hour inactivity timeout with a 60-second warning modal.
 */
export default function AppLayout() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const logout = useAuthStore((state) => state.logout);
    const router = useRouter();
    const rootNavState = useRootNavigationState();

    const handleTimeout = useCallback(() => {
        logout();
        router.replace('/(auth)/login');
    }, [logout, router]);

    const { warningVisible, secondsLeft, resetTimer } = useInactivityTimeout(
        handleTimeout,
        !!accessToken,
    );

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
        <>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="player" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="subscription" />
                <Stack.Screen name="devices" />
            </Stack>

            <Modal
                visible={warningVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.overlay}>
                    <View style={styles.dialog}>
                        <Text style={styles.emoji}>📺</Text>
                        <Text style={styles.title}>¿Sigues ahí?</Text>
                        <Text style={styles.body}>
                            Tu sesión cerrará en{' '}
                            <Text style={styles.countdown}>{secondsLeft}s</Text>
                            {' '}por inactividad.
                        </Text>
                        <TouchableOpacity style={styles.btn} onPress={resetTimer}>
                            <Text style={styles.btnText}>Continuar viendo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialog: {
        backgroundColor: '#1a0a2e',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        gap: 12,
        maxWidth: 320,
        width: '90%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    emoji: { fontSize: 40 },
    title: { color: '#fff', fontSize: 20, fontWeight: '800' },
    body: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    countdown: { color: '#FFB800', fontWeight: '800', fontSize: 18 },
    btn: {
        marginTop: 8,
        backgroundColor: '#17D1C6',
        borderRadius: 12,
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    btnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
