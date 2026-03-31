import { Stack } from 'expo-router';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens:
 * - `login`     — email + password login
 * - `dashboard` — main dashboard
 * - `users`     — user list
 * - `accounts`  — contracts / accounts list
 * - `sessions`  — active sessions
 */
export default function CmsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    />
  );
}
