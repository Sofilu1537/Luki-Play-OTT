import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Favorites / My List screen (placeholder).
 *
 * Displays a centred label. Persisting and listing user-saved content
 * is pending implementation.
 *
 * @remarks [PENDIENTE — completar cuando se implemente la lista personal]
 */
export default function Favorites() {
    return (
        <View className="flex-1 bg-luki-background items-center justify-center">
            <StatusBar style="light" />
            <Text className="text-white text-xl">Mi Lista</Text>
        </View>
    );
}