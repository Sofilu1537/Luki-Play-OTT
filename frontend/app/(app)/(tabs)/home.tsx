import { View, ScrollView, RefreshControl, StatusBar, Text, TouchableOpacity, FlatList, Dimensions, Image, Linking, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useContentStore, Movie } from '../../../services/contentStore';
import { useAdminStore } from '../../../services/adminStore';
import { useAuthStore, DEV_DEVICE_ID } from '../../../services/authStore';
import { useChannels, getCurrentProgram, toggleFavorite } from '../../../services/useChannels';
import { useSliderStore } from '../../../services/sliderStore';
import type { Channel } from '../../../services/channelTypes';
import type { PublicSlider } from '../../../services/api/adminApi';
import { Hero } from '../../../components/Hero';
import { MediaRow } from '../../../components/MediaRow';
import { API_BASE_URL } from '../../../services/api/config';

function resolveLogoUri(logo: string): string | null {
    if (!logo || logo === '📺') return null;
    if (logo.startsWith('http')) return logo;
    if (logo.startsWith('/')) return `${API_BASE_URL}${logo}`;
    return null; // emoji u otro string no-URL
}

// Order in which tag rows appear when present
const TAG_ORDER = [
    'Tendencias Globales',
    'Acción', 'Aventura', 'Deportes', 'Noticias', 'Entretenimiento',
    'Películas', 'Series', 'Música', 'Infantil', 'Documentales',
    'Comedia', 'Terror', 'Drama', 'Sci-Fi', 'Anime',
];

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// CMS Slider Carousel
// ─────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
    PLAY_CHANNEL:      'Ver canal',
    SHOW_PLAN:         'Ver planes',
    NAVIGATE_CATEGORY: 'Explorar',
    OPEN_URL:          'Abrir',
};

function SliderCarousel({
    sliders,
    onWatchLive,
    onBannerTap,
}: {
    sliders: PublicSlider[];
    onWatchLive: () => void;
    onBannerTap: (slider: PublicSlider) => void;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatRef = useRef<FlatList>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const BANNER_HEIGHT = Math.min(width * 0.56, 340);
    const AUTOPLAY_MS = 5000;

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: AUTOPLAY_MS,
            useNativeDriver: false,
        }).start();
    }, [progressAnim]);

    const startAutoPlay = useCallback(() => {
        if (sliders.length <= 1) return;
        startProgress();
        timerRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % sliders.length;
                flatRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
            startProgress();
        }, AUTOPLAY_MS);
    }, [sliders.length, startProgress]);

    useEffect(() => {
        startAutoPlay();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startAutoPlay]);

    // Fallback estático cuando no hay sliders del CMS
    if (!sliders.length) {
        return (
            <View style={{ width: '100%', height: BANNER_HEIGHT, backgroundColor: '#140026', overflow: 'hidden' }}>
                <LinearGradient
                    colors={['#240046', '#0D001A']}
                    style={{ position: 'absolute', inset: 0 } as any}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' } as any}
                />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 28 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(229,57,53,0.35)' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
                        <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 10, letterSpacing: 1.2 }}>EN VIVO</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6, lineHeight: 34 }}>
                        TV en Vivo
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20, lineHeight: 20 }}>
                        Canales de Ecuador en alta calidad
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#FFB800', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}
                        onPress={onWatchLive}
                    >
                        <Ionicons name="play" size={16} color="#140026" />
                        <Text style={{ color: '#140026', fontWeight: '900', fontSize: 14 }}>Reproducir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ width: '100%', height: BANNER_HEIGHT }}>
            <FlatList
                ref={flatRef}
                data={sliders}
                keyExtractor={(s) => s.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(newIndex);
                    if (timerRef.current) clearInterval(timerRef.current);
                    startAutoPlay();
                }}
                renderItem={({ item }) => {
                    const imageUri = item.imagen.startsWith('/')
                        ? `${API_BASE_URL}${item.imagen}`
                        : item.imagen;
                    const hasAction = item.actionType !== 'NONE';
                    return (
                        <TouchableOpacity
                            activeOpacity={hasAction ? 0.9 : 1}
                            onPress={() => hasAction && onBannerTap(item)}
                            style={{ width, height: BANNER_HEIGHT }}
                        >
                            {/* Background image */}
                            <Image
                                source={{ uri: imageUri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />

                            {/* Cinematic gradient overlay — dark vignette bottom 65% */}
                            <LinearGradient
                                colors={['transparent', 'rgba(5,0,20,0.55)', 'rgba(5,0,20,0.92)']}
                                locations={[0.2, 0.55, 1]}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '80%' } as any}
                            />
                            {/* Left-side vignette for readability */}
                            <LinearGradient
                                colors={['rgba(5,0,20,0.45)', 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 0.6, y: 0.5 }}
                                style={{ position: 'absolute', inset: 0 } as any}
                            />

                            {/* Text content */}
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22, paddingBottom: 32 }}>
                                {/* Category / action tag */}
                                {hasAction && (
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 5,
                                        backgroundColor: 'rgba(255,184,0,0.15)',
                                        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
                                        alignSelf: 'flex-start', marginBottom: 10,
                                        borderWidth: 1, borderColor: 'rgba(255,184,0,0.35)',
                                    }}>
                                        <Ionicons
                                            name={item.actionType === 'PLAY_CHANNEL' ? 'tv-outline' : item.actionType === 'SHOW_PLAN' ? 'star-outline' : 'compass-outline'}
                                            size={10} color="#FFB800"
                                        />
                                        <Text style={{ color: '#FFB800', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                                            {ACTION_LABEL[item.actionType] ?? 'VER MÁS'}
                                        </Text>
                                    </View>
                                )}

                                {/* Title */}
                                <Text
                                    style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, lineHeight: 32, marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}
                                    numberOfLines={2}
                                >
                                    {item.titulo}
                                </Text>

                                {/* Subtitle */}
                                {!!item.subtitulo && (
                                    <Text
                                        style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, marginBottom: 16 }}
                                        numberOfLines={2}
                                    >
                                        {item.subtitulo}
                                    </Text>
                                )}

                                {/* CTA button */}
                                {hasAction && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 8,
                                            backgroundColor: '#FFB800', borderRadius: 12,
                                            paddingHorizontal: 18, paddingVertical: 9,
                                        }}>
                                            <Ionicons name="play" size={14} color="#140026" />
                                            <Text style={{ color: '#140026', fontWeight: '900', fontSize: 13 }}>
                                                {ACTION_LABEL[item.actionType]}
                                            </Text>
                                        </View>
                                        <View style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 7,
                                            backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
                                            paddingHorizontal: 14, paddingVertical: 9,
                                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
                                        }}>
                                            <Ionicons name="information-circle-outline" size={14} color="#fff" />
                                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Info</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Dots + progress indicator */}
            {sliders.length > 1 && (
                <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {sliders.map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    flatRef.current?.scrollToIndex({ index: i, animated: true });
                                    setActiveIndex(i);
                                    if (timerRef.current) clearInterval(timerRef.current);
                                    startAutoPlay();
                                }}
                                style={{
                                    width: i === activeIndex ? 24 : 6,
                                    height: 4, borderRadius: 2,
                                    backgroundColor: i === activeIndex ? '#FFB800' : 'rgba(255,255,255,0.30)',
                                    overflow: 'hidden',
                                }}
                            >
                                {i === activeIndex && (
                                    <Animated.View style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                        backgroundColor: '#FFB800',
                                        width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                    }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────
// Channel Grid Row
// ─────────────────────────────────────────────
function ChannelRow({ channels, onSelectChannel, onToggleFavorite }: { channels: Channel[]; onSelectChannel: (ch: Channel) => void; onToggleFavorite: (ch: Channel) => void }) {
    return (
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: 'transparent', borderRadius: 0, padding: 0 }}>
                        <Ionicons name="tv-outline" size={20} color="#fff" />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Canales en Vivo</Text>
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: '#aaa', fontSize: 13, fontWeight: '600' }}>Ver todos</Text>
                    <Ionicons name="chevron-forward" size={14} color="#aaa" />
                </TouchableOpacity>
            </View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={channels}
                keyExtractor={c => c.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                    const prog = getCurrentProgram(item);
                    const logoUri = resolveLogoUri(item.logo);
                    const progLabel = prog.title && prog.title !== item.name ? prog.title : 'En vivo';
                    return (
                        <TouchableOpacity
                            style={{ width: 150, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                            onPress={() => onSelectChannel(item)}
                        >
                            <View style={{ height: 84, backgroundColor: '#240046', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {logoUri ? (
                                    <Image source={{ uri: logoUri }} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
                                ) : (
                                    <Ionicons name="tv-outline" size={36} color="rgba(255,255,255,0.8)" />
                                )}
                                <View style={{ position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="play" size={14} color="#fff" style={{ marginLeft: 2 }} />
                                </View>
                                <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(229,57,53,0.15)', borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' }}>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#E53935' }} />
                                    <Text style={{ color: '#E53935', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>EN VIVO</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', width: 18 }}>{item.number}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }} numberOfLines={1}>{progLabel}</Text>
                                </View>
                                <TouchableOpacity onPress={(e) => { (e.nativeEvent as unknown as Event).stopPropagation?.(); onToggleFavorite(item); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons
                                        name={item.isFavorite ? 'heart' : 'heart-outline'}
                                        size={16}
                                        color={item.isFavorite ? '#E53935' : 'rgba(255,255,255,0.35)'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>                    );
                }}
            />
        </View>
    );
}

// ─────────────────────────────────────────────
// Favorites Row
// ─────────────────────────────────────────────
function FavoritesRow({ channels, onSelectChannel, onToggleFavorite }: { channels: Channel[]; onSelectChannel: (ch: Channel) => void; onToggleFavorite: (ch: Channel) => void }) {
    const favs = channels.filter(c => c.isFavorite);
    if (!favs.length) return null;
    return (
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 14 }}>♥ Mis Favoritos</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={favs}
                keyExtractor={c => c.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                    const prog = getCurrentProgram(item);
                    const logoUri = resolveLogoUri(item.logo);
                    const progLabel = prog.title && prog.title !== item.name ? prog.title : 'En vivo';
                    return (
                        <View style={{ width: 120, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.20)' }}>
                            <TouchableOpacity onPress={() => onSelectChannel(item)} style={{ alignItems: 'center', gap: 6 }}>
                                {logoUri ? (
                                    <Image source={{ uri: logoUri }} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
                                ) : (
                                    <Ionicons name="tv-outline" size={36} color="rgba(255,255,255,0.8)" />
                                )}
                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{item.name}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>{progLabel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onToggleFavorite(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Ionicons name="heart" size={14} color="#E53935" />
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
        </View>
    );
}

/**
 * Home screen — main catalogue view for authenticated users.
 *
 * Displays a {@link Hero} banner for the featured item and dynamically
 * generated {@link MediaRow} rows grouped by tag/genre.
 *
 * If the authenticated user's OTT access is restricted (`canAccessOtt === false`),
 * a visible banner with the `restrictionMessage` is shown at the top. The rest of
 * the UI is still rendered so the user understands they are logged in.
 *
 * Behaviour:
 * - Initialises admin channels from the API on mount.
 * - Refreshes catalogue content every time the screen comes into focus.
 * - Admin channels are merged with priority over hardcoded content.
 * - Rows are ordered according to `TAG_ORDER`; extra tags are appended.
 *
 * State dependencies:
 * - `useContentStore` — featured item and trending list.
 * - `useAdminStore`   — admin-managed channels.
 * - `useAuthStore`    — OTT access flags and logout action.
 */
export default function Home() {
    const { featured: hardcodedFeatured, trending: hardcodedTrending, fetchContent, isLoading } = useContentStore();
    const adminChannels = useAdminStore((state) => state.channels);
    const authState = useAuthStore((state) => state as unknown as {
        logout: () => Promise<void> | void;
        canAccessOtt?: boolean;
        restrictionMessage?: string;
    });
    const logout = authState.logout;
    const canAccessOtt = authState.canAccessOtt ?? true;
    const restrictionMessage = authState.restrictionMessage ?? null;
    const { channels: liveChannels, reload: reloadChannels } = useChannels();
    const accessToken = useAuthStore((s) => s.accessToken);
    const { sliders, fetchSliders } = useSliderStore();
    const router = useRouter();

    const handleToggleFavorite = useCallback((ch: Channel) => {
        if (accessToken) {
            toggleFavorite(ch.id, !ch.isFavorite, accessToken, DEV_DEVICE_ID);
        }
    }, [accessToken]);

    // Load channels from IndexedDB once on mount
    useEffect(() => {
        useAdminStore.getState().init();
        fetchSliders();
    }, []);

    // Re-fetch base content on focus (channels managed by _store singleton — no reload needed)
    useFocusEffect(
        useCallback(() => {
            fetchContent();
        }, [])
    );

    // Wait for Zustand to rehydrate from IndexedDB before merging admin channels
    const hasHydrated = useAdminStore((state) => state._hasHydrated);
    const effectiveAdminChannels = hasHydrated ? adminChannels : [];

    // Convert admin channels to Movie shape
    const adminMovies: Movie[] = useMemo(() => effectiveAdminChannels.map((ch) => ({
        id: ch.id,
        title: ch.title,
        poster: ch.imageUrl,
        backdrop: ch.imageUrl,
        description: ch.description || '',
        videoUrl: ch.videoUrl,
        tags: ch.tags || [],
    })), [effectiveAdminChannels]);

    const featured = adminMovies.length > 0 ? adminMovies[0] : hardcodedFeatured;

    // Merge all content — admin first (priority)
    const allMovies: Movie[] = useMemo(
        () => [...adminMovies, ...hardcodedTrending],
        [adminMovies, hardcodedTrending]
    );

    // Build tag → items map dynamically
    const tagRows: { title: string; items: Movie[] }[] = useMemo(() => {
        const rows: { title: string; items: Movie[] }[] = [];

        // "Tendencias Globales" always shows everything
        if (allMovies.length > 0) {
            rows.push({ title: 'Tendencias Globales', items: allMovies });
        }

        // One row per tag (only those that actually have content)
        const seen = new Set<string>();
        for (const tag of TAG_ORDER.slice(1)) {
            if (seen.has(tag)) continue;
            const items = allMovies.filter((m) => m.tags?.includes(tag));
            if (items.length > 0) {
                seen.add(tag);
                rows.push({ title: tag, items });
            }
        }

        // Catch-all for items with tags not in TAG_ORDER
        const extraTags = new Set<string>();
        for (const m of allMovies) {
            for (const t of m.tags ?? []) {
                if (!TAG_ORDER.includes(t) && !seen.has(t)) extraTags.add(t);
            }
        }
        for (const tag of extraTags) {
            const items = allMovies.filter((m) => m.tags?.includes(tag));
            if (items.length > 0) rows.push({ title: tag, items });
        }

        return rows;
    }, [allMovies]);

    const handlePlay = () => {
        if (featured) {
            router.push({ pathname: '/player/[id]', params: { id: featured.id } });
        }
    };

    const openPlayer = (ch: Channel) => {
        router.push({ pathname: '/player/[id]', params: { id: ch.id } });
    };

    const handleBannerTap = useCallback((slider: PublicSlider) => {
        switch (slider.actionType) {
            case 'PLAY_CHANNEL':
                if (slider.actionValue) router.push({ pathname: '/player/[id]', params: { id: slider.actionValue } });
                break;
            case 'NAVIGATE_CATEGORY':
                // TODO: filtrar home por categoría cuando se implemente navegación por categoría
                break;
            case 'SHOW_PLAN':
                router.push('/(app)/planes' as any);
                break;
            case 'OPEN_URL':
                if (slider.actionValue) Linking.openURL(slider.actionValue);
                break;
        }
    }, [router]);

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <View className="flex-1 bg-luki-background">
            <StatusBar barStyle="light-content" />

            {/* OTT restriction banner */}
            {!canAccessOtt && restrictionMessage && (
                <View style={{ backgroundColor: '#7f1d1d', padding: 12, paddingTop: 48 }}>
                    <Text style={{ color: '#fca5a5', fontWeight: '600', textAlign: 'center', fontSize: 13 }}>
                        ⚠️ {restrictionMessage}
                    </Text>
                    <TouchableOpacity onPress={handleLogout} style={{ marginTop: 8, alignItems: 'center' }}>
                        <Text style={{ color: '#fca5a5', textDecorationLine: 'underline', fontSize: 12 }}>
                            Cerrar sesión
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor="#fff" />
                }
            >
                {featured && <Hero movie={featured} onPlay={handlePlay} />}

                {/* Live TV section con carrusel de banners del CMS */}
                {liveChannels.length > 0 && (
                    <>
                        <SliderCarousel
                            sliders={sliders}
                            onWatchLive={() => openPlayer(liveChannels[0]!)}
                            onBannerTap={handleBannerTap}
                        />
                        <ChannelRow channels={liveChannels} onSelectChannel={openPlayer} onToggleFavorite={handleToggleFavorite} />
                        <FavoritesRow channels={liveChannels} onSelectChannel={openPlayer} onToggleFavorite={handleToggleFavorite} />
                    </>
                )}

                <View className="mt-6 pb-20">
                    {tagRows.map((row) => (
                        <MediaRow
                            key={row.title}
                            title={row.title}
                            items={row.items}
                            onItemPress={(item) => router.push({ pathname: '/player/[id]', params: { id: item.id } })}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}