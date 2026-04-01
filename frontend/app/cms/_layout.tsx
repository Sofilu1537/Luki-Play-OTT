import { Stack } from 'expo-router';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens:
 * - `login`     — CMS login (email + password, no OTP)
 * - `dashboard` — summary cards + sidebar navigation
 * - `users`     — users table with role filter
 * - `accounts`  — contracts/accounts table with status badges
 * - `sessions`  — active sessions table
 */
export default function CmsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F172A' },
      }}
    />
  );
}
