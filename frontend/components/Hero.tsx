import { View, Text, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Movie } from '../services/contentStore';
import { useState } from 'react';

const { width, height } = Dimensions.get('window');

/**
 * Props for the {@link Hero} component.
 *
 * @property movie   - The featured {@link Movie} to promote.
 * @property onPlay  - Callback fired when the user taps the Play button.
 */
interface HeroProps {
    movie: Movie;
    onPlay: () => void;
}

/**
 * Full-width hero banner displayed at the top of the Home screen.
 *
 * Renders the movie backdrop with a gradient overlay and overlaid metadata
 * (title, tags). Exposes a Play action that triggers navigation to the Player.
 *
 * @param props - {@link HeroProps}
 */
export const Hero = ({ movie, onPlay }: HeroProps) => {
    const [imgError, setImgError] = useState(false);

    return (
        <View className="w-full relative" style={{ height: height * 0.6 }}>
            <ImageBackground
                source={(!imgError && movie.backdrop) ? { uri: movie.backdrop } : undefined}
                style={{ backgroundColor: '#2A0E47' }}
                className="w-full h-full justify-end"
                resizeMode="cover"
                onError={() => setImgError(true)}
            >
                <LinearGradient
                    colors={['transparent', '#0F041C']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
                />

                <View className="items-center pb-12 px-4">
                    <Text className="text-white text-5xl font-extrabold text-center mb-4 tracking-tighter shadow-lg">{movie.title}</Text>

                    <View className="flex-row items-center mb-6 space-x-4">
                        {movie.tags?.map((tag, index) => (
                            <Text key={index} className="text-gray-300 text-sm mx-2">• {tag}</Text>
                        ))}
                    </View>

                    <View className="flex-row space-x-4 w-full justify-center">
                        <TouchableOpacity
                            className="bg-white flex-row items-center px-6 py-3 rounded-md w-36 justify-center"
                            onPress={onPlay}
                        >
                            <FontAwesome name="play" size={20} color="black" style={{ marginRight: 8 }} />
                            <Text className="text-black font-bold text-lg">Play</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="bg-gray-600/80 flex-row items-center px-6 py-3 rounded-md w-36 justify-center">
                            <FontAwesome name="info-circle" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-lg">Info</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};