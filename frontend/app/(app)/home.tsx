import { View, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useContentStore, Movie } from '../../services/contentStore';
import { useAdminStore } from '../../services/adminStore';
import { Hero } from '../../components/Hero';
import { MediaRow } from '../../components/MediaRow';
import { useRouter } from 'expo-router';

// Order in which tag rows appear when present
const TAG_ORDER = [
    'Tendencias Globales',
    'Acción', 'Aventura', 'Deportes', 'Noticias', 'Entretenimiento',
    'Películas', 'Series', 'Música', 'Infantil', 'Documentales',
    'Comedia', 'Terror', 'Drama', 'Sci-Fi', 'Anime',
];

/**
 * Home screen — main catalogue view for authenticated users.
 *
 * Displays a {@link Hero} banner for the featured item and dynamically
 * generated {@link MediaRow} rows grouped by tag/genre.
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
 */
export default function Home() {
    const { featured: hardcodedFeatured, trending: hardcodedTrending, fetchContent, isLoading } = useContentStore();
    const adminChannels = useAdminStore((state) => state.channels);
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

    return (
        <View className="flex-1 bg-luki-background">
            <StatusBar barStyle="light-content" />
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchContent} tintColor="#FFC107" />
                }
            >
                {featured && <Hero movie={featured} onPlay={handlePlay} />}

                <View className="mt-6 pb-20">
                    {tagRows.map((row) => (
                        <MediaRow key={row.title} title={row.title} items={row.items} />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}