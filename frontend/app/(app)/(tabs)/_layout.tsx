import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
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
