import { Tabs, useRouter, useRootNavigationState } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '../../services/authStore';
import { useEffect } from 'react';
import { APP } from '../../styles/theme';

/**
 * Layout for the authenticated (app) route group.
 *
 * Redirects to `/(auth)/login` if the user is not authenticated.
 * Renders a bottom tab navigator with three tabs:
 * - **Inicio** (`home`)    — main catalogue screen.
 * - **Buscar** (`search`)  — search screen (placeholder).
 * - **Mi Lista** (`favorites`) — saved content list (placeholder).
 *
 * Tab bar styling follows the LUKI dark-purple design system.
 */
export default function AppLayout() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const router = useRouter();
    const rootNavState = useRootNavigationState();

    useEffect(() => {
        // Wait until the Root Layout navigator is fully mounted before navigating.
        // Without this guard, router.replace fires before expo-router is ready
        // and throws "Attempted to navigate before mounting the Root Layout".
        if (!rootNavState?.key) return;
        if (!accessToken) {
            router.replace('/(auth)/login');
        }
    }, [accessToken, router, rootNavState?.key]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: APP.tabBar,
                    borderTopWidth: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: APP.accent,
                tabBarInactiveTintColor: APP.textMuted,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Buscar',
                    tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Mi Lista',
                    tabBarIcon: ({ color }) => <FontAwesome name="list" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}