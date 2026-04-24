import { Stack, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';
import { useCmsStore } from '../../services/cmsStore';
import { ThemeProvider } from '../../hooks/useTheme';

/**
 * Layout for the CMS route group.
 *
 * Provides a headerless Stack navigator for all CMS screens.
 * Navigation order and visibility are controlled from the shared CMS shell.
 *
 * Redirect guards are placed in a useEffect (not in the render body) to avoid
 * the "Maximum update depth exceeded" React error that can occur when
 * <Redirect> components trigger rapid re-renders during state transitions.
 */
export default function CmsLayout() {
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const router = useRouter();
  const profile = useCmsStore((state) => state.profile);
  const hasRestored = useCmsStore((state) => state.hasRestored);
  const isRestoring = useCmsStore((state) => state.isRestoring);

  // Bootstrap session once on mount (only if not yet restored)
  useEffect(() => {
    if (!hasRestored && !isRestoring) {
      useCmsStore.getState().bootstrapSession();
    }
  }, [hasRestored, isRestoring]);

  // Auth redirect guard — runs after render to avoid render-time update loops
  useEffect(() => {
    if (!rootNavigationState?.key || !hasRestored || isRestoring) return;

    if (!profile && pathname !== '/cms/login') {
      router.replace('/cms/login' as never);
      return;
    }

    // Force password change: if logged in but mustChangePassword, send back to login.
    // The login screen detects this and shows the change-password form.
    if (profile && profile.mustChangePassword && pathname !== '/cms/login') {
      router.replace('/cms/login' as never);
      return;
    }

    if (profile && !profile.mustChangePassword && (pathname === '/cms/login' || pathname === '/cms')) {
      router.replace('/cms/dashboard' as never);
    }
  }, [profile, hasRestored, isRestoring, pathname, rootNavigationState?.key, router]);

  if (!rootNavigationState?.key || !hasRestored || isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#24004D' }}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#24004D' },
        }}
      />
    </ThemeProvider>
  );
}
