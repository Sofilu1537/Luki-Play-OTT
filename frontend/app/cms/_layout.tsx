import { Stack } from 'expo-router';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens:
 * - `login`     — email + password login (no OTP)
 * - `dashboard` — main panel with sidebar and summary cards
 * - `users`     — users management table
 * - `accounts`  — contracts/accounts table
 * - `sessions`  — active sessions with revoke
 */
export default function CmsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#0F172A' },
      }}
    />
  );
}
