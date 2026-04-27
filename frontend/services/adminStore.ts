import { create } from 'zustand';

/**
 * Represents a streaming channel managed through the Admin Panel.
 *
 * @property id          - Unique channel identifier (format: 'ch-<timestamp>').
 * @property title       - Channel display name.
 * @property imageUrl    - Cover/thumbnail image URL or base64 data URI.
 * @property videoUrl    - HLS (.m3u8), MP4, or live stream URL.
 * @property description - Optional channel description.
 * @property tags        - Genre/category labels for content rows.
 * @property createdAt   - Unix timestamp (ms) of creation.
 */
export interface Channel {
    id: string;
    title: string;
    imageUrl: string;
    videoUrl: string;
    description: string;
    tags: string[];
    createdAt: number;
}

/**
 * Shape of the admin Zustand store.
 *
 * @property channels      - List of channels loaded from the API.
 * @property isAdminAuth   - Whether the administrator is currently authenticated.
 * @property _hasHydrated  - Internal flag to prevent redundant API fetches.
 * @property init          - Loads channels from the remote API; no-op if already hydrated.
 * @property adminLogin    - Validates the admin password and sets isAdminAuth.
 * @property adminLogout   - Clears admin authentication state.
 * @property addChannel    - Adds a new channel and persists via API.
 * @property updateChannel - Updates an existing channel by id and persists via API.
 * @property deleteChannel - Removes a channel by id and persists via API.
 */
interface AdminState {
    channels: Channel[];
    isAdminAuth: boolean;
    _hasHydrated: boolean;
    init: () => Promise<void>;
    adminLogin: (password: string) => boolean;
    adminLogout: () => void;
    addChannel: (data: Omit<Channel, 'id' | 'createdAt'>) => void;
    updateChannel: (id: string, data: Partial<Omit<Channel, 'id' | 'createdAt'>>) => void;
    deleteChannel: (id: string) => void;
}

/**
 * Hardcoded admin password for local/prototype authentication.
 *
 * @remarks Replace with a server-side authentication mechanism before production.
 */
const ADMIN_PASS = 'luki2024';

/**
 * Base URL for the channel persistence REST endpoint.
 * Expected to respond to GET (load) and POST (save).
 */
const API_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}/api/channels`
    : 'http://localhost:3000/api/channels';

/**
 * Loads channels from the remote API.
 *
 * @returns Array of Channel objects, or empty array on error.
 */
async function apiLoad(): Promise<Channel[]> {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) return [];
        return await res.json();
    } catch { return []; }
}

/**
 * Persists the full channel list to the remote API.
 *
 * @param channels - Updated channel array to save.
 * @remarks Uses Bearer token equal to the admin password. Silently ignores network errors.
 */
async function apiSave(channels: Channel[]): Promise<void> {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_PASS}`,
            },
            body: JSON.stringify(channels),
        });
    } catch {}
}

/**
 * Global admin store (Zustand).
 *
 * Manages CRUD operations for streaming channels.
 * Channels are persisted to `/api/channels` on every mutation.
 *
 * External dependency: REST endpoint `/api/channels`.
 */
export const useAdminStore = create<AdminState>()((set, get) => ({
    channels: [],
    isAdminAuth: false,
    _hasHydrated: false,

    init: async () => {
        // No-op if already loaded in this session
        if (get()._hasHydrated) return;
        const channels = await apiLoad();
        set({ channels, _hasHydrated: true });
    },

    adminLogin: (password) => {
        if (password === ADMIN_PASS) {
            set({ isAdminAuth: true });
            return true;
        }
        return false;
    },

    adminLogout: () => set({ isAdminAuth: false }),

    addChannel: (data) => {
        set((state) => {
            const channels = [
                { ...data, id: `ch-${Date.now()}`, createdAt: Date.now() },
                ...state.channels,
            ];
            apiSave(channels);
            return { channels };
        });
    },

    updateChannel: (id, data) => {
        set((state) => {
            const channels = state.channels.map((ch) =>
                ch.id === id ? { ...ch, ...data } : ch
            );
            apiSave(channels);
            return { channels };
        });
    },

    deleteChannel: (id) => {
        set((state) => {
            const channels = state.channels.filter((ch) => ch.id !== id);
            apiSave(channels);
            return { channels };
        });
    },
}));