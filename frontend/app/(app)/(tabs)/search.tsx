import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Search screen (placeholder).
 *
 * Currently renders a centred label. Full search functionality is
 * pending implementation.
 *
 * @remarks [PENDIENTE — completar cuando se implemente la búsqueda]
 */
export default function Search() {
    return (
        <View className="flex-1 bg-luki-background items-center justify-center">
            <StatusBar style="light" />
            <Text className="text-white text-xl">Búsqueda</Text>
        </View>
    );
}