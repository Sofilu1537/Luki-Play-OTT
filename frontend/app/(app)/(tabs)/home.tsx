import {
    View, ScrollView, RefreshControl, StatusBar, Text,
    TouchableOpacity, FlatList, Image, Linking, Animated,
    useWindowDimensions, Platform,
} from 'react-native';
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
import { MediaRow } from '../../../components/MediaRow';
import { API_BASE_URL } from '../../../services/api/config';
import LukiPlayLogo from '../../../components/LukiPlayLogo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveLogoUri(logo: string): string | null {
    if (!logo || logo === '📺') return null;
    if (logo.startsWith('http')) return logo;
    if (logo.startsWith('/')) return `${API_BASE_URL}${logo}`;
    return null;
}

function resolveImage(src: string): string {
    if (!src) return '';
    return src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
}

const ACTION_LABEL: Record<string, string> = {
    PLAY_CHANNEL:      'Ver ahora',
    SHOW_PLAN:         'Ver planes',
    NAVIGATE_CATEGORY: 'Explorar',
    OPEN_URL:          'Abrir',
};

const TAG_ORDER = [
    'Tendencias Globales',
    'Acción', 'Aventura', 'Deportes', 'Noticias', 'Entretenimiento',
    'Películas', 'Series', 'Música', 'Infantil', 'Documentales',
    'Comedia', 'Terror', 'Drama', 'Sci-Fi', 'Anime',
];

const NAV_ITEMS = ['Inicio', 'Series', 'Películas', 'Novedades', 'Populares', 'Mi Lista'];
const HEADER_H = 64;

// ─── Header ───────────────────────────────────────────────────────────────────

function HomeHeader({ scrollY, onLogout }: { scrollY: Animated.Value; onLogout: () => void }) {
    const [activeNav, setActiveNav] = useState('Inicio');

    const bgOpacity = scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View style={{
            position: 'fixed' as any,
            top: 0, left: 0, right: 0,
            height: HEADER_H,
            zIndex: 100,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
        }}>
            {/* Background: always gradient, opacity 0 → 1 on scroll */}
            <LinearGradient
                colors={['rgba(5,2,20,0.95)', 'rgba(5,2,20,0.85)']}
                style={{
                    position: 'absolute', inset: 0,
                    opacity: 1,
                } as any}
            />
            {/* Top gradient when at top */}
            <Animated.View style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H * 2,
                opacity: bgOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }),
                pointerEvents: 'none' as any,
            }}>
                <LinearGradient
                    colors={['rgba(5,2,20,0.9)', 'transparent']}
                    style={{ flex: 1 }}
                />
            </Animated.View>

            {/* Logo */}
            <LukiPlayLogo variant="compact" size={80} />

            {/* Nav */}
            {Platform.OS === 'web' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 32 }}>
                    {NAV_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setActiveNav(item)}
                            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                        >
                            <Text style={{
                                color: activeNav === item ? '#fff' : 'rgba(255,255,255,0.65)',
                                fontSize: 14,
                                fontWeight: activeNav === item ? '700' : '500',
                                letterSpacing: 0.2,
                            }}>
                                {item}
                            </Text>
                            {activeNav === item && (
                                <View style={{ height: 2, backgroundColor: '#FFB800', borderRadius: 1, marginTop: 2 }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Right actions */}
            <View style={{ marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity>
                    <Ionicons name="search-outline" size={22} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onLogout}>
                    <View style={{
                        width: 32, height: 32, borderRadius: 16,
                        backgroundColor: '#FFB800',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Ionicons name="person" size={16} color="#140026" />
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────

function HeroSlider({
    sliders,
    onWatchLive,
    onBannerTap,
    firstChannel,
}: {
    sliders: PublicSlider[];
    onWatchLive: () => void;
    onBannerTap: (slider: PublicSlider) => void;
    firstChannel?: Channel;
}) {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const flatRef = useRef<FlatList>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const AUTOPLAY_MS = 5500;

    // hero height: full viewport on mobile, capped on desktop
    const heroH = Math.min(width * (9 / 16), 600);

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: AUTOPLAY_MS,
            useNativeDriver: false,
        }).start();
    }, [progressAnim]);

    const goTo = useCallback((index: number) => {
        flatRef.current?.scrollToIndex({ index, animated: true });
        setActiveIndex(index);
    }, []);

    const startAutoPlay = useCallback(() => {
        if (sliders.length <= 1 || hovered) return;
        if (timerRef.current) clearInterval(timerRef.current);
        startProgress();
        timerRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % sliders.length;
                flatRef.current?.scrollToIndex({ index: next, animated: true });
                startProgress();
                return next;
            });
        }, AUTOPLAY_MS);
    }, [sliders.length, hovered, startProgress]);

    useEffect(() => {
        startAutoPlay();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startAutoPlay]);

    // Pause on hover
    useEffect(() => {
        if (hovered && timerRef.current) {
            clearInterval(timerRef.current);
            progressAnim.stopAnimation();
        } else if (!hovered) {
            startAutoPlay();
        }
    }, [hovered, startAutoPlay]);

    // Fallback when no sliders
    if (!sliders.length) {
        return (
            <View style={{ width, height: heroH, backgroundColor: '#050012' }}>
                <LinearGradient
                    colors={['#1a0040', '#050012']}
                    style={{ position: 'absolute', inset: 0 } as any}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(5,0,18,0.95)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' } as any}
                />
                <View style={{ position: 'absolute', bottom: 48, left: 48 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.18)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(229,57,53,0.35)' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
                        <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 11, letterSpacing: 1.2 }}>EN VIVO</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: width > 600 ? 42 : 28, fontWeight: '900', letterSpacing: -1, marginBottom: 10 }}>
                        TV en Vivo
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 24, lineHeight: 22 }}>
                        Canales de Ecuador en alta calidad — sin interrupciones
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={{ backgroundColor: '#FFB800', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }}
                            onPress={onWatchLive}
                        >
                            <Ionicons name="play" size={18} color="#140026" />
                            <Text style={{ color: '#140026', fontWeight: '900', fontSize: 15 }}>Ver ahora</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                            <Ionicons name="information-circle-outline" size={18} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Más info</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View
            style={{ width, height: heroH }}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setHovered(true),
                onMouseLeave: () => setHovered(false),
            } : {})}
        >
            <FlatList
                ref={flatRef}
                data={sliders}
                keyExtractor={(s) => s.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(idx);
                    if (!hovered) startAutoPlay();
                }}
                renderItem={({ item }) => {
                    const imageUri = resolveImage(item.imagen);
                    const hasAction = item.actionType !== 'NONE';
                    const textX = width > 768 ? 60 : 24;

                    return (
                        <View style={{ width, height: heroH }}>
                            {/* Full image — contain preserves proportions */}
                            <Image
                                source={{ uri: imageUri }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />

                            {/* Bottom gradient */}
                            <LinearGradient
                                colors={['transparent', 'rgba(5,0,18,0.6)', 'rgba(5,0,18,0.97)']}
                                locations={[0.3, 0.65, 1]}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '75%' } as any}
                            />
                            {/* Left vignette */}
                            <LinearGradient
                                colors={['rgba(5,0,18,0.55)', 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 0.55, y: 0.5 }}
                                style={{ position: 'absolute', inset: 0 } as any}
                            />

                            {/* Content overlay */}
                            <View style={{ position: 'absolute', bottom: 52, left: textX, right: textX * 2 }}>
                                {/* Badge */}
                                {hasAction && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,184,0,0.35)' }}>
                                        <Ionicons
                                            name={item.actionType === 'PLAY_CHANNEL' ? 'tv-outline' : 'star-outline'}
                                            size={11} color="#FFB800"
                                        />
                                        <Text style={{ color: '#FFB800', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                                            {ACTION_LABEL[item.actionType]?.toUpperCase() ?? 'VER MÁS'}
                                        </Text>
                                    </View>
                                )}

                                {/* Title */}
                                <Text
                                    style={{
                                        color: '#fff',
                                        fontSize: width > 768 ? 46 : 28,
                                        fontWeight: '900',
                                        letterSpacing: -1,
                                        lineHeight: width > 768 ? 54 : 34,
                                        marginBottom: 10,
                                        textShadowColor: 'rgba(0,0,0,0.6)',
                                        textShadowOffset: { width: 0, height: 2 },
                                        textShadowRadius: 12,
                                    }}
                                    numberOfLines={2}
                                >
                                    {item.titulo}
                                </Text>

                                {/* Subtitle */}
                                {!!item.subtitulo && (
                                    <Text
                                        style={{ color: 'rgba(255,255,255,0.68)', fontSize: width > 768 ? 16 : 13, lineHeight: 22, marginBottom: 22, maxWidth: 520 }}
                                        numberOfLines={3}
                                    >
                                        {item.subtitulo}
                                    </Text>
                                )}

                                {/* Buttons */}
                                <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                                    {hasAction && (
                                        <TouchableOpacity
                                            onPress={() => onBannerTap(item)}
                                            style={{ backgroundColor: '#FFB800', borderRadius: 12, paddingHorizontal: width > 768 ? 32 : 22, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }}
                                        >
                                            <Ionicons name="play" size={16} color="#140026" />
                                            <Text style={{ color: '#140026', fontWeight: '900', fontSize: width > 768 ? 15 : 14 }}>
                                                {ACTION_LABEL[item.actionType] ?? 'Ver ahora'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: width > 768 ? 28 : 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
                                    >
                                        <Ionicons name="information-circle-outline" size={16} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: width > 768 ? 15 : 14 }}>Más info</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                }}
            />

            {/* Dots navigation */}
            {sliders.length > 1 && (
                <View style={{ position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {sliders.map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => { goTo(i); startAutoPlay(); }}
                                style={{ overflow: 'hidden', borderRadius: 2 }}
                            >
                                <View style={{
                                    width: i === activeIndex ? 28 : 6,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: i === activeIndex ? '#FFB800' : 'rgba(255,255,255,0.28)',
                                }}>
                                    {i === activeIndex && (
                                        <Animated.View style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0,
                                            backgroundColor: 'rgba(255,255,255,0.35)',
                                            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                                        }} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

// ─── Channel Card ─────────────────────────────────────────────────────────────

function ChannelCard({ channel, onPress, onFav }: { channel: Channel; onPress: () => void; onFav: () => void }) {
    const [hovered, setHovered] = useState(false);
    const prog = getCurrentProgram(channel);
    const logoUri = resolveLogoUri(channel.logo);

    return (
        <TouchableOpacity
            onPress={onPress}
            {...(Platform.OS === 'web' ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {})}
            style={{
                width: 160,
                backgroundColor: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: hovered ? 'rgba(255,184,0,0.30)' : 'rgba(255,255,255,0.07)',
            }}
        >
            {/* Thumbnail */}
            <View style={{ height: 90, backgroundColor: '#1a0040', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {logoUri
                    ? <Image source={{ uri: logoUri }} style={{ width: 72, height: 72 }} resizeMode="contain" />
                    : <Ionicons name="tv-outline" size={36} color="rgba(255,255,255,0.4)" />
                }
                {/* Play overlay on hover */}
                {hovered && (
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' } as any}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFB800', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="play" size={16} color="#140026" style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                )}
                {/* LIVE badge */}
                <View style={{ position: 'absolute', top: 7, right: 7, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(229,57,53,0.18)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(229,57,53,0.35)' }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#E53935' }} />
                    <Text style={{ color: '#E53935', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>EN VIVO</Text>
                </View>
            </View>

            {/* Info */}
            <View style={{ padding: 10, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#aaa', fontSize: 11, fontWeight: '700' }}>CH {channel.number}</Text>
                    <TouchableOpacity onPress={(e) => { (e.nativeEvent as any).stopPropagation?.(); onFav(); }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name={channel.isFavorite ? 'heart' : 'heart-outline'} size={14} color={channel.isFavorite ? '#E53935' : 'rgba(255,255,255,0.35)'} />
                    </TouchableOpacity>
                </View>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 }} numberOfLines={1}>
                    {channel.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 }} numberOfLines={1}>
                    {prog.title && prog.title !== channel.name ? prog.title : 'En vivo'}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon, onSeeAll }: { title: string; icon: string; onSeeAll?: () => void }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={icon as any} size={18} color="#FFB800" />
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
            </View>
            {onSeeAll && (
                <TouchableOpacity onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>Ver todos</Text>
                    <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Media Card (improved) ────────────────────────────────────────────────────

function MediaCard({ item, onPress }: { item: Movie; onPress: () => void }) {
    const [hovered, setHovered] = useState(false);
    return (
        <TouchableOpacity
            onPress={onPress}
            {...(Platform.OS === 'web' ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {})}
            style={{
                width: 150,
                transform: [{ scale: hovered ? 1.05 : 1 }],
            }}
        >
            <View style={{ width: 150, height: 220, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1a0040' }}>
                <Image source={{ uri: item.poster }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {hovered && (
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={{ position: 'absolute', inset: 0 } as any}
                    >
                        <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFB800', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="play" size={18} color="#140026" style={{ marginLeft: 2 }} />
                            </View>
                        </View>
                    </LinearGradient>
                )}
            </View>
            <Text style={{ color: hovered ? '#fff' : 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 8, lineHeight: 16 }} numberOfLines={2}>
                {item.title}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Main Home ────────────────────────────────────────────────────────────────

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
    const scrollY = useRef(new Animated.Value(0)).current;

    const handleToggleFavorite = useCallback((ch: Channel) => {
        if (accessToken) toggleFavorite(ch.id, !ch.isFavorite, accessToken, DEV_DEVICE_ID);
    }, [accessToken]);

    useEffect(() => {
        useAdminStore.getState().init();
        fetchSliders();
    }, []);

    useFocusEffect(useCallback(() => { fetchContent(); }, []));

    const hasHydrated = useAdminStore((state) => state._hasHydrated);
    const effectiveAdminChannels = hasHydrated ? adminChannels : [];

    const adminMovies: Movie[] = useMemo(() => effectiveAdminChannels.map((ch) => ({
        id: ch.id, title: ch.title, poster: ch.imageUrl,
        backdrop: ch.imageUrl, description: ch.description || '',
        videoUrl: ch.videoUrl, tags: ch.tags || [],
    })), [effectiveAdminChannels]);

    const allMovies: Movie[] = useMemo(
        () => [...adminMovies, ...hardcodedTrending],
        [adminMovies, hardcodedTrending]
    );

    const tagRows: { title: string; items: Movie[] }[] = useMemo(() => {
        const rows: { title: string; items: Movie[] }[] = [];
        if (allMovies.length > 0) rows.push({ title: 'Tendencias Globales', items: allMovies });
        const seen = new Set<string>();
        for (const tag of TAG_ORDER.slice(1)) {
            if (seen.has(tag)) continue;
            const items = allMovies.filter((m) => m.tags?.includes(tag));
            if (items.length > 0) { seen.add(tag); rows.push({ title: tag, items }); }
        }
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

    const openPlayer = (ch: Channel) => router.push({ pathname: '/player/[id]', params: { id: ch.id } });

    const handleBannerTap = useCallback((slider: PublicSlider) => {
        switch (slider.actionType) {
            case 'PLAY_CHANNEL':
                if (slider.actionValue) router.push({ pathname: '/player/[id]', params: { id: slider.actionValue } });
                break;
            case 'SHOW_PLAN':
                router.push('/(app)/planes' as any);
                break;
            case 'OPEN_URL':
                if (slider.actionValue) Linking.openURL(slider.actionValue);
                break;
        }
    }, [router]);

    const handleLogout = async () => { await logout(); router.replace('/(auth)/login'); };

    return (
        <View style={{ flex: 1, backgroundColor: '#05020C' }}>
            <StatusBar barStyle="light-content" />

            {/* Sticky Header */}
            <HomeHeader scrollY={scrollY} onLogout={handleLogout} />

            {/* Restriction banner */}
            {!canAccessOtt && restrictionMessage && (
                <View style={{ backgroundColor: '#7f1d1d', padding: 12, paddingTop: HEADER_H + 12, zIndex: 50 }}>
                    <Text style={{ color: '#fca5a5', fontWeight: '600', textAlign: 'center', fontSize: 13 }}>
                        ⚠️ {restrictionMessage}
                    </Text>
                    <TouchableOpacity onPress={handleLogout} style={{ marginTop: 8, alignItems: 'center' }}>
                        <Text style={{ color: '#fca5a5', textDecorationLine: 'underline', fontSize: 12 }}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Animated.ScrollView
                style={{ flex: 1 }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor="#FFB800" />}
            >
                {/* Hero — takes full width, sits behind header */}
                <HeroSlider
                    sliders={sliders}
                    onWatchLive={() => liveChannels[0] && openPlayer(liveChannels[0])}
                    onBannerTap={handleBannerTap}
                    firstChannel={liveChannels[0]}
                />

                {/* Content below hero */}
                <View style={{ paddingTop: 32, paddingBottom: 60 }}>

                    {/* Live TV channels */}
                    {liveChannels.length > 0 && (
                        <View style={{ marginBottom: 36 }}>
                            <SectionHeader title="Canales en Vivo" icon="tv-outline" />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={liveChannels}
                                keyExtractor={(c) => c.id}
                                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                                renderItem={({ item }) => (
                                    <ChannelCard
                                        channel={item}
                                        onPress={() => openPlayer(item)}
                                        onFav={() => handleToggleFavorite(item)}
                                    />
                                )}
                            />
                        </View>
                    )}

                    {/* Favorites */}
                    {liveChannels.some((c) => c.isFavorite) && (
                        <View style={{ marginBottom: 36 }}>
                            <SectionHeader title="Mis Favoritos" icon="heart-outline" />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={liveChannels.filter((c) => c.isFavorite)}
                                keyExtractor={(c) => c.id}
                                contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                                renderItem={({ item }) => (
                                    <ChannelCard
                                        channel={item}
                                        onPress={() => openPlayer(item)}
                                        onFav={() => handleToggleFavorite(item)}
                                    />
                                )}
                            />
                        </View>
                    )}

                    {/* Content rows */}
                    {tagRows.map((row) => (
                        <View key={row.title} style={{ marginBottom: 36 }}>
                            <SectionHeader title={row.title} icon="film-outline" />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={row.items}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
                                renderItem={({ item }) => (
                                    <MediaCard
                                        item={item}
                                        onPress={() => router.push({ pathname: '/player/[id]', params: { id: item.id } })}
                                    />
                                )}
                            />
                        </View>
                    ))}
                </View>
            </Animated.ScrollView>
        </View>
    );
}
