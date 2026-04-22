import { View, ScrollView, RefreshControl, StatusBar, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useContentStore, Movie } from '../../services/contentStore';
import { useAdminStore } from '../../services/adminStore';
import { useAuthStore } from '../../services/authStore';
import { useChannels, getCurrentProgram } from '../../services/useChannels';
import type { Channel } from '../../services/channelTypes';
import { Hero } from '../../components/Hero';
import { MediaRow } from '../../components/MediaRow';

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
        <View style={{ width: '100%', height: width * 0.48, backgroundColor: '#0D001A', overflow: 'hidden' }}>
            <View style={{ ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backgroundColor: '#200040' }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24, paddingTop: 40, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(229,57,53,0.22)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(229,57,53,0.4)' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E53935' }} />
                    <Text style={{ color: '#E53935', fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>EN VIVO</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 }}>TV en Vivo</Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
                    Canales de Ecuador en alta calidad — sin interrupciones
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={{ backgroundColor: '#FFB800', borderRadius: 10, paddingHorizontal: 22, paddingVertical: 11 }} onPress={onWatchLive}>
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>▶  Ver ahora</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>ℹ  Guía EPG</Text>
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
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>📺 Canales en Vivo</Text>
                <Text style={{ color: '#FFB800', fontSize: 13, fontWeight: '700' }}>Ver todos →</Text>
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
                            <View style={{ height: 84, backgroundColor: '#200040', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                <Text style={{ fontSize: 32 }}>{item.logo}</Text>
                                <View style={{ position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 16 }}>▶</Text>
                                </View>
                                <View style={{ position: 'absolute', top: 7, right: 7, backgroundColor: '#E53935', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                                    <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}>LIVE</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', width: 18 }}>{item.number}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }} numberOfLines={1}>{prog.title}</Text>
                                </View>
                                {item.isFavorite && <Text style={{ color: '#E53935', fontSize: 14 }}>♥</Text>}
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
                            style={{ width: 120, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.20)' }}
                            onPress={() => onSelectChannel(item)}
                        >
                            <Text style={{ fontSize: 36 }}>{item.logo}</Text>
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
    const { channels: liveChannels } = useChannels();
    const router = useRouter();

    // Load channels from IndexedDB once on mount
    useEffect(() => {
        useAdminStore.getState().init();
    }, []);

    // Re-fetch base content on focus
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
                    <RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor="#FFC107" />
                }
            >
                {featured && <Hero movie={featured} onPlay={handlePlay} />}

                {/* Live TV section — player-style (from Luki-Play-Reproductor) */}
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