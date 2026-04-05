import { Redirect, Stack, usePathname, useRootNavigationState } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import { useCmsStore } from '../../services/cmsStore';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens.
 * Navigation order and visibility are controlled from the shared CMS shell.
 */
export default function CmsLayout() {
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const profile = useCmsStore((state) => state.profile);
  const hasRestored = useCmsStore((state) => state.hasRestored);
  const isRestoring = useCmsStore((state) => state.isRestoring);
  const bootstrapSession = useCmsStore((state) => state.bootstrapSession);

  useEffect(() => {
    if (!hasRestored && !isRestoring) {
      bootstrapSession();
    }
  }, [bootstrapSession, hasRestored, isRestoring]);

  if (!rootNavigationState?.key || !hasRestored || isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#7B5EF8" />
      </View>
    );
  }

  if (!profile && pathname !== '/cms/login') {
    return <Redirect href="/cms/login" />;
  }

  if (profile && (pathname === '/cms/login' || pathname === '/cms')) {
    return <Redirect href="/cms/dashboard" />;
  }

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
