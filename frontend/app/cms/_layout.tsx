import { Stack } from 'expo-router';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens.
 * Navigation order and visibility are controlled from the shared CMS shell.
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
