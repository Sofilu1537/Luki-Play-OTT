import { Stack } from 'expo-router';

/**
 * Layout for the admin route group.
 *
 * Provides a headerless Stack navigator with a slide-from-right animation
 * and the deep-purple LUKI background colour applied to all admin screens:
 * - `index` — admin login
 * - `panel` — channel list management
 * - `form`  — add/edit channel form
 */
export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#1A052E' },
            }}
        />
    );
}