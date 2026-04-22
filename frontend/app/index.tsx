import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../services/authStore';
import { useEffect, useState } from 'react';

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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#140026' }}>
            <ActivityIndicator size="large" color="#FFB800" />
        </View>
    );
}