import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Movie } from '../services/contentStore';

/**
 * Props for the {@link MediaRow} component.
 *
 * @property title - Section header displayed above the scroll list.
 * @property items - Array of {@link Movie} objects to render as thumbnail cards.
 */
interface MediaRowProps {
    title: string;
    items: Movie[];
}

/**
 * Horizontal scrolling row of movie/channel poster cards.
 *
 * Renders a section title followed by a horizontally scrollable `FlatList`
 * of 128×192 poster images. Tapping a card is currently a no-op (navigation
 * to the player is pending implementation).
 *
 * @param props - {@link MediaRowProps}
 */
export const MediaRow = ({ title, items }: MediaRowProps) => {
    return (
        <View className="mb-8">
            <Text className="text-white text-lg font-bold mb-3 px-4">{title}</Text>
            <FlatList
                horizontal
                data={items}
                renderItem={({ item }) => (
                    <TouchableOpacity className="mr-4 first:ml-4">
                        <Image
                            source={{ uri: item.poster }}
                            className="w-32 h-48 rounded-md"
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};