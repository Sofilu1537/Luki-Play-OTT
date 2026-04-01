import { Tabs, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '../../services/authStore';
import { useEffect } from 'react';

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

    useEffect(() => {
        if (!accessToken) {
            router.replace('/(auth)/login');
        }
    }, [accessToken, router]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0F041C', // Very dark purple
                    borderTopWidth: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#FFC107', // Luki Yellow
                tabBarInactiveTintColor: '#6b7280',
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