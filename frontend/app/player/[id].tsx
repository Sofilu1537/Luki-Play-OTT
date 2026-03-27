import { View, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ResizeMode, Video } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useContentStore } from '../../services/contentStore';
import { useAdminStore } from '../../services/adminStore';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';

/**
 * Web-only HLS video player wrapper using hls.js.
 *
 * Uses native HLS support (Safari) when available, otherwise loads hls.js
 * dynamically for Chrome/Firefox/Edge. Renders a native `<video>` element
 * with a back button overlay.
 *
 * @param url    - HLS or MP4 stream URL to play.
 * @param onBack - Callback for the back button press.
 */
function WebHLSPlayer({ url, onBack }: { url: string; onBack: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: any = null;

        const setup = async () => {
            // Check if browser supports HLS natively (Safari)
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.play().catch(() => {});
                return;
            }
            // Use hls.js for Chrome/Firefox/Edge
            const Hls = (await import('hls.js')).default;
            if (Hls.isSupported()) {
                hls = new Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {});
                });
            }
        };

        setup();
        return () => { if (hls) hls.destroy(); };
    }, [url]);

    return (
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            {/* @ts-ignore */}
            <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                controls
                autoPlay
                playsInline
            />
            <TouchableOpacity
                style={{ position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
                onPress={onBack}
            >
                <FontAwesome name="arrow-left" size={22} color="white" />
            </TouchableOpacity>
        </View>
    );
}

/**
 * Video player screen.
 *
 * Resolves the stream URL in priority order:
 *  1. Admin channel matching the `id` route param.
 *  2. Content store movie matching the `id` route param.
 *  3. Hardcoded featured item URL.
 *  4. Fallback HLS demo stream.
 *
 * On native (iOS/Android), locks screen orientation to landscape on mount
 * and restores portrait on unmount. Uses `expo-av` Video component.
 * On web, renders {@link WebHLSPlayer} using hls.js.
 *
 * Route param:
 * - `id` (string) — identifier of the channel or movie to play.
 *
 * Dependencies:
 * - `useContentStore` — resolves video URL from catalogue.
 * - `useAdminStore`   — resolves video URL from admin channels.
 * - `expo-screen-orientation` — native landscape lock.
 */
export default function Player() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const { getMovieById, featured: hardcodedFeatured } = useContentStore();
    const adminChannels = useAdminStore((state) => state.channels);

    // Lock to landscape on native
    useEffect(() => {
        if (Platform.OS === 'web') return;
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        };
    }, []);

    // Resolve video URL: check admin channels first, then content store
    const adminChannel = id ? adminChannels.find((ch) => ch.id === id) : null;
    const storeMovie = id ? getMovieById(id as string) : null;
    const fallbackUrl = 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8';
    const videoUrl = adminChannel?.videoUrl ?? storeMovie?.videoUrl ?? hardcodedFeatured?.videoUrl ?? fallbackUrl;

    const handleBack = () => router.back();

    // Use web HLS player on browser
    if (Platform.OS === 'web') {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <StatusBar hidden />
                <WebHLSPlayer url={videoUrl} onBack={handleBack} />
            </View>
        );
    }

    // Native player (iOS/Android)
    return (
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <StatusBar hidden />
            <Video
                ref={videoRef}
                style={{ width: '100%', height: '100%' }}
                source={{ uri: videoUrl }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                shouldPlay
                onPlaybackStatusUpdate={(s) => setStatus(() => s)}
            />
            <TouchableOpacity
                style={{ position: 'absolute', top: 40, left: 40, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 }}
                onPress={handleBack}
            >
                <FontAwesome name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}