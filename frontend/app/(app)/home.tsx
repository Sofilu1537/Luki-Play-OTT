import { View, ScrollView, RefreshControl, StatusBar, Text, TouchableOpacity, FlatList, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useContentStore, Movie } from '../../services/contentStore';
import { useAdminStore } from '../../services/adminStore';
import { useAuthStore } from '../../services/authStore';
import { useChannels, getCurrentProgram } from '../../services/useChannels';
import type { Channel } from '../../services/channelTypes';
import { Hero } from '../../components/Hero';
import { MediaRow } from '../../components/MediaRow';
import { APP, COLORS } from '../../styles/theme';

// Order in which tag rows appear when present
const TAG_ORDER = [
    'Tendencias Globales',
    'Acción', 'Aventura', 'Deportes', 'Noticias', 'Entretenimiento',
    'Películas', 'Series', 'Música', 'Infantil', 'Documentales',
    'Comedia', 'Terror', 'Drama', 'Sci-Fi', 'Anime',
];

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Live TV Hero Banner
// ─────────────────────────────────────────────
function LiveHeroBanner({ onWatchLive }: { onWatchLive: () => void }) {
    return (
        <View style={{ width: '100%', height: width * 0.48, backgroundColor: APP.gradientEnd, overflow: 'hidden' }}>
            <View style={{ ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backgroundColor: APP.gradientStart }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24, paddingTop: 40, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.15)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E53935' }} />
                    <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>EN VIVO</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 }}>TV en Vivo</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
                    Canales de Ecuador en alta calidad — sin interrupciones
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                        style={{ backgroundColor: APP.accent, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                        onPress={onWatchLive}
                    >
                        <Ionicons name="play" size={18} color={APP.gradientEnd} />
                        <Text style={{ color: APP.gradientEnd, fontWeight: '800', fontSize: 13 }}>Reproducir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: 'rgba(96,38,158,0.5)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <Ionicons name="list" size={18} color="#FAF6E7" />
                        <Text style={{ color: '#FAF6E7', fontWeight: '700', fontSize: 13 }}>Guía EPG</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────
// Channel Grid Row
// ─────────────────────────────────────────────
function ChannelRow({ channels, onSelectChannel }: { channels: Channel[]; onSelectChannel: (ch: Channel) => void }) {
    return (
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="tv-outline" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Canales en Vivo</Text>
                </View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: APP.textMuted, fontSize: 13, fontWeight: '600' }}>Ver todos</Text>
                    <Ionicons name="chevron-forward" size={14} color={APP.textMuted} />
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
                    return (
                        <TouchableOpacity
                            style={{ width: 150, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                            onPress={() => onSelectChannel(item)}
                        >
                            <View style={{ height: 84, backgroundColor: APP.gradientStart, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {(!item.logo || item.logo === '📺') ? (
                                    <Ionicons name="tv-outline" size={36} color="rgba(255,255,255,0.8)" />
                                ) : item.logo.startsWith('http') ? (
                                    <Image source={{ uri: item.logo }} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
                                ) : (
                                    <Text style={{ fontSize: 32 }}>{item.logo}</Text>
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
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }} numberOfLines={1}>{prog.title}</Text>
                                </View>
                                {item.isFavorite && <Ionicons name="heart" size={14} color="#E53935" />}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

// ─────────────────────────────────────────────
// Favorites Row
// ─────────────────────────────────────────────
function FavoritesRow({ channels, onSelectChannel }: { channels: Channel[]; onSelectChannel: (ch: Channel) => void }) {
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
                    return (
                        <TouchableOpacity
                            style={{ width: 120, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: `${APP.accent}33` }}
                            onPress={() => onSelectChannel(item)}
                        >
                            {(!item.logo || item.logo === '📺') ? (
                                <Ionicons name="tv-outline" size={40} color="rgba(255,255,255,0.7)" />
                            ) : item.logo.startsWith('http') ? (
                                <Image source={{ uri: item.logo }} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
                            ) : (
                                <Text style={{ fontSize: 36 }}>{item.logo}</Text>
                            )}
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>{item.name}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, textAlign: 'center' }} numberOfLines={1}>{prog.title}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

/**
 * Home screen — main catalogue view for authenticated OTT users.
 *
 * Renders:
 * - A {@link Hero} banner for the featured content item.
 * - A live TV section ({@link LiveHeroBanner}, {@link ChannelRow}, {@link FavoritesRow})
 *   populated from /public/canales when channels are available.
 * - Dynamically generated {@link MediaRow} rows grouped by tag/genre.
 *
 * If OTT access is restricted, shows a top banner with the restriction message.
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
    const router = useRouter();

    // Load channels from IndexedDB once on mount
    useEffect(() => {
        useAdminStore.getState().init();
    }, []);

    // Re-fetch content and channels every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchContent();
            reloadChannels(true); // silent reload — no loading flash
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

        if (allMovies.length > 0) {
            rows.push({ title: 'Tendencias Globales', items: allMovies });
        }

        const seen = new Set<string>();
        for (const tag of TAG_ORDER.slice(1)) {
            if (seen.has(tag)) continue;
            const items = allMovies.filter((m) => m.tags?.includes(tag));
            if (items.length > 0) {
                seen.add(tag);
                rows.push({ title: tag, items });
            }
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

    const handlePlay = () => {
        if (featured) {
            router.push({ pathname: '/player/[id]', params: { id: featured.id } });
        }
    };

    const openPlayer = (ch: Channel) => {
        router.push({ pathname: '/player/[id]', params: { id: ch.id } });
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <View className="flex-1 bg-luki-background">
            <StatusBar barStyle="light-content" />

            {/* OTT restriction banner */}
            {!canAccessOtt && restrictionMessage && (
                <View style={{ backgroundColor: APP.dangerSurface, padding: 12, paddingTop: 48 }}>
                    <Text style={{ color: COLORS.melon, fontWeight: '600', textAlign: 'center', fontSize: 13 }}>
                        ⚠️ {restrictionMessage}
                    </Text>
                    <TouchableOpacity onPress={handleLogout} style={{ marginTop: 8, alignItems: 'center' }}>
                        <Text style={{ color: COLORS.melon, textDecorationLine: 'underline', fontSize: 12 }}>
                            Cerrar sesión
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor={APP.accent} />
                }
            >
                {featured && <Hero movie={featured} onPlay={handlePlay} />}

                {/* Live TV section — channels from /public/canales */}
                {liveChannels.length > 0 && (
                    <>
                        <LiveHeroBanner onWatchLive={() => openPlayer(liveChannels[0]!)} />
                        <ChannelRow channels={liveChannels} onSelectChannel={openPlayer} />
                        <FavoritesRow channels={liveChannels} onSelectChannel={openPlayer} />
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
