import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Movie } from '../services/contentStore';

interface MediaRowProps {
    title: string;
    items: Movie[];
    onItemPress?: (item: Movie) => void;
}

export const MediaRow = ({ title, items, onItemPress }: MediaRowProps) => {
    return (
        <View className="mb-8">
            <Text className="text-white text-lg font-bold mb-3 px-4">{title}</Text>
            <FlatList
                horizontal
                data={items}
                renderItem={({ item }) => (
                    <TouchableOpacity className="mr-4 first:ml-4" onPress={() => onItemPress?.(item)}>
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