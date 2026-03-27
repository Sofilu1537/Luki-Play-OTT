import { create } from 'zustand';
import { useAdminStore } from './adminStore';

/**
 * Represents a content item (movie, series episode, or live channel).
 *
 * @property id          - Unique content identifier.
 * @property title       - Display title.
 * @property poster      - Portrait image URL (used in MediaRow cards).
 * @property backdrop    - Wide/landscape image URL (used in Hero).
 * @property description - Short synopsis or description.
 * @property videoUrl    - HLS (.m3u8), MP4, or live stream URL.
 * @property rating      - Optional audience relevance score label.
 * @property tags        - Genre or category labels for display rows.
 */
export interface Movie {
    id: string;
    title: string;
    poster: string;
    backdrop: string;
    description: string;
    videoUrl: string; // HLS
    rating?: string;
    tags?: string[];
}

/**
 * Shape of the content Zustand store.
 *
 * @property featured     - Hero item displayed at the top of the home screen.
 * @property trending     - Ordered list of content for row display.
 * @property action       - Secondary content list used for category rows.
 * @property isLoading    - Whether content is being fetched.
 * @property fetchContent - Loads hardcoded content and merges admin channels.
 * @property getMovieById - Returns a Movie by id from any list, or undefined.
 */
interface ContentState {
    featured: Movie | null;
    trending: Movie[];
    action: Movie[];
    fetchContent: () => Promise<void>;
    isLoading: boolean;
    getMovieById: (id: string) => Movie | undefined;
}

/**
 * Global content store (Zustand).
 *
 * Manages the catalogue displayed across the app. On fetch, admin-managed
 * channels are merged and given priority over the hardcoded catalogue.
 *
 * External dependency: {@link useAdminStore} — reads channels persisted
 * via the admin API endpoint (/api/channels).
 */
export const useContentStore = create<ContentState>((set, get) => ({
    featured: null,
    trending: [],
    action: [],
    isLoading: false,
    getMovieById: (id: string) => {
        const { featured, trending, action } = get();
        if (featured?.id === id) return featured;
        return trending.find((m) => m.id === id) ?? action.find((m) => m.id === id);
    },
    fetchContent: async () => {
        set({ isLoading: true });
        // Simulate delay
        await new Promise(r => setTimeout(r, 100));

        const featured: Movie = {
            id: 'hero-1',
            title: 'Cyberpunk Edgerunners',
            poster: 'https://image.tmdb.org/t/p/w500/7WJjFviFBffEJvkAms4uWwbcVUk.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZxWBj8o.jpg', // Wide image
            description: 'In a dystopia riddled with corruption and cybernetic implants, a talented but reckless street kid strives to become a mercenary outlaw — an edgerunner.',
            videoUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
            rating: '98% Relevant',
            tags: ['Sci-Fi', 'Anime', 'Action']
        };

        const movieTemplate = (id: string, title: string, img: string): Movie => ({
            id,
            title,
            poster: img,
            backdrop: img,
            description: 'Movie description...',
            videoUrl: 'https://g2qd3e2ay7an-hls-live.5centscdn.com/channel35/d0dbe915091d400bd8ee7f27f0791303.sdp/playlist.m3u8',
        });

        const trending = [
            { ...movieTemplate('1', 'Dune', 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg'), tags: ['Sci-Fi', 'Aventura', 'Películas'] },
            { ...movieTemplate('2', 'Interstellar', 'https://image.tmdb.org/t/p/w500/gEU2QniL6C8zNFuKAIgDwyDz0cg.jpg'), tags: ['Sci-Fi', 'Drama', 'Películas'] },
            { ...movieTemplate('3', 'Inception', 'https://image.tmdb.org/t/p/w500/9gk7admal4zl248LOkowMIN7048.jpg'), tags: ['Acción', 'Sci-Fi', 'Películas'] },
            { ...movieTemplate('4', 'Blade Runner', 'https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axpq8lqbCN.jpg'), tags: ['Sci-Fi', 'Acción', 'Películas'] },
        ];

        // Merge admin channels — they take priority over hardcoded content
        const adminChannels = useAdminStore.getState().channels;
        const adminMovies: Movie[] = adminChannels.map((ch) => ({
            id: ch.id,
            title: ch.title,
            poster: ch.imageUrl,
            backdrop: ch.imageUrl,
            description: ch.description || '',
            videoUrl: ch.videoUrl,
            tags: ch.tags || [],
        }));

        const activeFeatured = adminMovies.length > 0 ? adminMovies[0] : featured;
        const activeTrending = [...adminMovies, ...trending];

        set({
            featured: activeFeatured,
            trending: activeTrending,
            action: activeTrending.slice().reverse(),
            isLoading: false
        });
    }
}));