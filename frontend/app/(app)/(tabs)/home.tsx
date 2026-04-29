import {
    View, ScrollView, RefreshControl, StatusBar, Text,
    TouchableOpacity, FlatList, Image, Linking, Animated,
    useWindowDimensions, Platform, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useContentStore } from '../../../services/contentStore';
import { useAdminStore } from '../../../services/adminStore';
import { useAuthStore, DEV_DEVICE_ID } from '../../../services/authStore';
import { useChannels, getCurrentProgram, toggleFavorite } from '../../../services/useChannels';
import { useSliderStore } from '../../../services/sliderStore';
import type { Channel } from '../../../services/channelTypes';
import type { PublicSlider } from '../../../services/api/adminApi';
import { API_BASE_URL } from '../../../services/api/config';

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGO_HEADER = require('../../../assets/branding/logo_h.png');
const NAV_ITEMS = ['Inicio', 'Series', 'Películas', 'Novedades', 'Populares', 'Mi Lista'];
const HEADER_H = 64;
const ACCENT = '#FFC107';
const BG = '#05020C';

const ACTION_LABEL: Record<string, string> = {
    PLAY_CHANNEL: 'Ver ahora',
    SHOW_PLAN: 'Ver planes',
    NAVIGATE_CATEGORY: 'Explorar',
    OPEN_URL: 'Abrir',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveImg(src: string): string {
    if (!src) return '';
    return src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
}

function resolveLogoUri(logo: string): string | null {
    if (!logo || logo === '📺') return null;
    if (logo.startsWith('http')) return logo;
    if (logo.startsWith('/')) return `${API_BASE_URL}${logo}`;
    return null;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onLogout }: { onLogout: () => void }) {
    const [active, setActive] = useState('Inicio');

    return (
        <View style={{
            height: HEADER_H,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 32,
            backgroundColor: BG,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.06)',
            zIndex: 100,
            ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 0 } : {}),
        }}>
            {/* Logo */}
            <Image source={LOGO_HEADER} style={{ width: 140, height: 36 }} resizeMode="contain" />

            {/* Nav links */}
            {Platform.OS === 'web' && (
                <View style={{ flexDirection: 'row', marginLeft: 40, gap: 4 }}>
                    {NAV_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setActive(item)}
                            style={{ paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' }}
                        >
                            <Text style={{
                                color: active === item ? '#fff' : 'rgba(255,255,255,0.6)',
                                fontSize: 14,
                                fontWeight: active === item ? '700' : '500',
                            }}>
                                {item}
                            </Text>
                            {active === item && (
                                <View style={{ position: 'absolute', bottom: 0, height: 2, width: '60%', backgroundColor: ACCENT, borderRadius: 2 }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Right */}
            <View style={{ marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                <TouchableOpacity>
                    <Ionicons name="search-outline" size={22} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onLogout}>
                    <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: ACCENT,
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Ionicons name="person" size={17} color="#140026" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────

function HeroSlider({
    sliders,
    onWatchLive,
    onBannerTap,
}: {
    sliders: PublicSlider[];
    onWatchLive: () => void;
    onBannerTap: (s: PublicSlider) => void;
}) {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const AUTOPLAY_MS = 5500;

    const heroH = Math.min(width * (628 / 1200), 628);

    const startProgress = useCallback(() => {
        progressAnim.setValue(0);
        Animated.timing(progressAnim, { toValue: 1, duration: AUTOPLAY_MS, useNativeDriver: false }).start();
    }, [progressAnim]);

    const goTo = useCallback((idx: number) => {
        scrollRef.current?.scrollTo({ x: width * idx, animated: true });
        setActiveIndex(idx);
        startProgress();
    }, [width, startProgress]);

    const stopAutoPlay = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        progressAnim.stopAnimation();
    }, [progressAnim]);

    const startAutoPlay = useCallback(() => {
        if (sliders.length <= 1) return;
        stopAutoPlay();
        startProgress();
        timerRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % sliders.length;
                scrollRef.current?.scrollTo({ x: width * next, animated: true });
                startProgress();
                return next;
            });
        }, AUTOPLAY_MS);
    }, [sliders.length, width, stopAutoPlay, startProgress]);

    useEffect(() => { startAutoPlay(); return stopAutoPlay; }, [startAutoPlay]);
    useEffect(() => { hovered ? stopAutoPlay() : startAutoPlay(); }, [hovered]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        if (idx !== activeIndex) setActiveIndex(idx);
    }, [width, activeIndex]);

    // ── Fallback (no sliders) ──────────────────────────────────────────────────
    if (!sliders.length) {
        return (
            <View style={{ width, height: heroH }}>
                <LinearGradient colors={['#1a0040', '#05020C']} style={{ position: 'absolute', inset: 0 } as any} />
                <LinearGradient
                    colors={['transparent', 'rgba(5,0,18,0.95)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' } as any}
                />
                <View style={{ position: 'absolute', bottom: 48, left: width > 768 ? 64 : 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
                        <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 10, letterSpacing: 1.5 }}>EN VIVO</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: width > 768 ? 48 : 30, fontWeight: '900', letterSpacing: -1.5, marginBottom: 8 }}>TV en Vivo</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 28 }}>Canales en alta calidad, sin interrupciones</Text>
                    <TouchableOpacity
                        onPress={onWatchLive}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ACCENT, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, alignSelf: 'flex-start' }}
                    >
                        <Ionicons name="play" size={18} color="#140026" />
                        <Text style={{ color: '#140026', fontWeight: '900', fontSize: 15 }}>Ver ahora</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Slides ─────────────────────────────────────────────────────────────────
    return (
        <View
            style={{ width, height: heroH, overflow: 'hidden' }}
            {...(Platform.OS === 'web' ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {})}
        >
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScroll}
                onScrollEndDrag={handleScroll}
                style={{ width, height: heroH }}
                contentContainerStyle={{ width: width * sliders.length }}
            >
                {sliders.map((item) => {
                    const hasAction = item.actionType !== 'NONE';
                    return (
                        <View key={item.id} style={{ width, height: heroH }}>
                            {/* Banner image — full bleed */}
                            <Image
                                source={{ uri: resolveImg(item.imagen) }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                            {/* Bottom gradient */}
                            <LinearGradient
                                colors={['transparent', 'rgba(5,2,12,0.55)', 'rgba(5,2,12,0.92)']}
                                locations={[0.45, 0.75, 1]}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' } as any}
                            />
                            {/* CTA overlay — bottom left */}
                            {hasAction && (
                                <View style={{ position: 'absolute', bottom: 40, left: width > 768 ? 64 : 24 }}>
                                    <TouchableOpacity
                                        onPress={() => onBannerTap(item)}
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', gap: 10,
                                            backgroundColor: ACCENT,
                                            paddingHorizontal: 28, paddingVertical: 14,
                                            borderRadius: 50, alignSelf: 'flex-start',
                                            shadowColor: ACCENT, shadowOpacity: 0.4,
                                            shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
                                        }}
                                    >
                                        <Ionicons name="play" size={18} color="#140026" />
                                        <Text style={{ color: '#140026', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 }}>
                                            {ACTION_LABEL[item.actionType] ?? 'Ver ahora'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* ← Prev arrow */}
            {sliders.length > 1 && activeIndex > 0 && (
                <TouchableOpacity
                    onPress={() => goTo(activeIndex - 1)}
                    style={{
                        position: 'absolute', left: 16, top: '50%' as any,
                        transform: [{ translateY: -22 }],
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>
            )}

            {/* → Next arrow */}
            {sliders.length > 1 && activeIndex < sliders.length - 1 && (
                <TouchableOpacity
                    onPress={() => goTo(activeIndex + 1)}
                    style={{
                        position: 'absolute', right: 16, top: '50%' as any,
                        transform: [{ translateY: -22 }],
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Ionicons name="chevron-forward" size={22} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Dots */}
            {sliders.length > 1 && (
                <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' } as any}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {sliders.map((_, i) => (
                            <TouchableOpacity key={i} onPress={() => goTo(i)} style={{ padding: 4 }}>
                                <View style={{
                                    width: i === activeIndex ? 28 : 7,
                                    height: 4, borderRadius: 2,
                                    backgroundColor: i === activeIndex ? ACCENT : 'rgba(255,255,255,0.3)',
                                    overflow: 'hidden',
                                }}>
                                    {i === activeIndex && (
                                        <Animated.View style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0,
                                            backgroundColor: 'rgba(255,255,255,0.4)',
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 16, gap: 10 }}>
            <View style={{ width: 3, height: 20, backgroundColor: ACCENT, borderRadius: 2 }} />
            <Ionicons name={icon as any} size={17} color={ACCENT} />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
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
                width: 156,
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: hovered ? 'rgba(255,193,7,0.07)' : 'rgba(255,255,255,0.04)',
                borderWidth: 1,
                borderColor: hovered ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.07)',
                transform: [{ scale: hovered ? 1.03 : 1 }],
            }}
        >
            <View style={{ height: 88, backgroundColor: '#100820', alignItems: 'center', justifyContent: 'center' }}>
                {logoUri
                    ? <Image source={{ uri: logoUri }} style={{ width: 68, height: 68 }} resizeMode="contain" />
                    : <Ionicons name="tv-outline" size={34} color="rgba(255,255,255,0.3)" />
                }
                {hovered && (
                    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' } as any}>
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="play" size={16} color="#140026" style={{ marginLeft: 2 }} />
                        </View>
                    </View>
                )}
                {/* LIVE badge */}
                <View style={{ position: 'absolute', top: 7, left: 7, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' }} />
                    <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>EN VIVO</Text>
                </View>
                {/* Fav */}
                <TouchableOpacity
                    onPress={(e) => { (e.nativeEvent as any).stopPropagation?.(); onFav(); }}
                    style={{ position: 'absolute', top: 6, right: 7 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={channel.isFavorite ? 'heart' : 'heart-outline'}
                        size={14}
                        color={channel.isFavorite ? '#E53935' : 'rgba(255,255,255,0.4)'}
                    />
                </TouchableOpacity>
            </View>
            <View style={{ padding: 10 }}>
                <Text style={{ color: 'rgba(255,193,7,0.7)', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                    CH {channel.number}
                </Text>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                    {channel.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }} numberOfLines={1}>
                    {prog.title && prog.title !== channel.name ? prog.title : 'En vivo'}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
    const { fetchContent, isLoading } = useContentStore();
    const authState = useAuthStore((state) => state as unknown as {
        logout: () => Promise<void> | void;
        canAccessOtt?: boolean;
        restrictionMessage?: string;
    });
    const { channels: liveChannels } = useChannels();
    const accessToken = useAuthStore((s) => s.accessToken);
    const { sliders, fetchSliders } = useSliderStore();
    const router = useRouter();

    const handleToggleFavorite = useCallback((ch: Channel) => {
        if (accessToken) toggleFavorite(ch.id, !ch.isFavorite, accessToken, DEV_DEVICE_ID);
    }, [accessToken]);

    useEffect(() => {
        useAdminStore.getState().init();
        fetchSliders();
    }, []);

    useFocusEffect(useCallback(() => { fetchContent(); }, []));

    const openPlayer = useCallback((ch: Channel) =>
        router.push({ pathname: '/player/[id]', params: { id: ch.id } }),
        [router]
    );

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

    const handleLogout = async () => {
        await authState.logout();
        router.replace('/(auth)/login');
    };

    const canAccessOtt = authState.canAccessOtt ?? true;
    const restrictionMessage = authState.restrictionMessage ?? null;
    const favorites = liveChannels.filter((c) => c.isFavorite);

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="light-content" />

            {/* Sticky Navbar */}
            <Navbar onLogout={handleLogout} />

            {/* Restriction notice */}
            {!canAccessOtt && restrictionMessage && (
                <View style={{ backgroundColor: '#7f1d1d', padding: 12 }}>
                    <Text style={{ color: '#fca5a5', fontWeight: '600', textAlign: 'center', fontSize: 13 }}>
                        ⚠️ {restrictionMessage}
                    </Text>
                    <TouchableOpacity onPress={handleLogout} style={{ marginTop: 6, alignItems: 'center' }}>
                        <Text style={{ color: '#fca5a5', textDecorationLine: 'underline', fontSize: 12 }}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor={ACCENT} />}
            >
                {/* Hero */}
                <HeroSlider
                    sliders={sliders}
                    onWatchLive={() => liveChannels[0] && openPlayer(liveChannels[0])}
                    onBannerTap={handleBannerTap}
                />

                <View style={{ paddingTop: 40, paddingBottom: 60, gap: 40 }}>

                    {/* Canales en Vivo */}
                    {liveChannels.length > 0 && (
                        <View>
                            <SectionHeader title="Canales en Vivo" icon="tv-outline" />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={liveChannels}
                                keyExtractor={(c) => c.id}
                                contentContainerStyle={{ paddingHorizontal: 32, gap: 12 }}
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

                    {/* Mis Favoritos */}
                    {favorites.length > 0 && (
                        <View>
                            <SectionHeader title="Mis Favoritos" icon="heart-outline" />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={favorites}
                                keyExtractor={(c) => c.id}
                                contentContainerStyle={{ paddingHorizontal: 32, gap: 12 }}
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

                </View>
            </ScrollView>
        </View>
    );
}
