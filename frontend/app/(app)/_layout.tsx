import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
 * Tab bar styling follows modern OTT design system.
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
                    backgroundColor: '#140026',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(96, 38, 158, 0.4)',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#FFB800', 
                tabBarInactiveTintColor: '#B07CC6',
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Buscar',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Mi Lista',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}