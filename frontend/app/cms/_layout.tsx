/**
 * CMS Layout — Persistent sidebar + route protection for all CMS screens.
 *
 * - Redirects to /cms/login if no valid session is found.
 * - Renders a left sidebar with navigation links.
 * - The sidebar is always visible across all authenticated CMS screens.
 * - Does NOT interfere with the client-facing (auth)/(app) navigation.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';

// ─── Sidebar nav items ────────────────────────────────────────────────────────

interface NavItem {
  icon: string;
  label: string;
  route: string;
  superadminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📊', label: 'Dashboard', route: '/cms/dashboard' },
  { icon: '🧑‍💻', label: 'Usuarios', route: '/cms/users' },
  { icon: '📋', label: 'Contratos', route: '/cms/accounts' },
  { icon: '🔐', label: 'Sesiones', route: '/cms/sessions' },
  { icon: '⚙️', label: 'Configuración', route: '/cms/settings', superadminOnly: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CmsLayout() {
  const { isAuthenticated, cmsUser, cmsRestoreSession, cmsLogout } = useCmsStore();
  const router = useRouter();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const [activeRoute, setActiveRoute] = useState('');

  const isMobile = width < 768;
  const isLoginScreen = segments[segments.length - 1] === 'login';

  // Restore persisted session on mount
  useEffect(() => {
    cmsRestoreSession();
  }, []);

  // Route protection: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoginScreen) {
      router.replace('/cms/login' as any);
    }
  }, [isAuthenticated, isLoginScreen]);

  // Track active route for sidebar highlight
  useEffect(() => {
    const current = '/' + segments.join('/');
    setActiveRoute(current);
  }, [segments]);

  const handleLogout = async () => {
    await cmsLogout();
    router.replace('/cms/login' as any);
  };

  const handleNavPress = (route: string) => {
    router.push(route as any);
  };

  // On login screen: render plain stack without sidebar
  if (isLoginScreen) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superadminOnly || cmsUser?.role === 'SUPERADMIN',
  );

  return (
    <View style={styles.container}>
      {/* ── Sidebar ── */}
      {!isMobile && (
        <View style={styles.sidebar}>
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <Text style={styles.brandText}>🎬 Luki Play</Text>
            <Text style={styles.brandSub}>Panel CMS</Text>
          </View>

          {/* Navigation links */}
          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {visibleItems.map((item) => {
              const isActive = activeRoute === item.route || activeRoute.startsWith(item.route + '/');
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavPress(item.route)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User info + logout */}
          <View style={styles.sidebarFooter}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {cmsUser?.email?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {cmsUser?.email ?? '—'}
                </Text>
                <View style={[styles.roleBadge, cmsUser?.role === 'SUPERADMIN' ? styles.badgeSuperadmin : styles.badgeSupport]}>
                  <Text style={styles.roleBadgeText}>{cmsUser?.role ?? '—'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Main content ── */}
      <View style={styles.main}>
        {/* Mobile top bar */}
        {isMobile && (
          <View style={styles.mobileTopBar}>
            <Text style={styles.mobileTitle}>🎬 Luki Play CMS</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.mobileLogout}>Salir</Text>
            </TouchableOpacity>
          </View>
        )}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="users" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
          <Stack.Screen name="sessions" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 240;
const SIDEBAR_BG = '#1E2A3B';
const SIDEBAR_ACTIVE = '#2D4A6B';
const ACCENT = '#3B82F6';
const TEXT_PRIMARY = '#F1F5F9';
const TEXT_MUTED = '#94A3B8';
const MAIN_BG = '#F8FAFC';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: MAIN_BG,
  },
  // ── Sidebar ──
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    flexDirection: 'column',
    paddingTop: 0,
  },
  brand: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3F52',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  brandSub: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nav: {
    flex: 1,
    paddingTop: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: SIDEBAR_ACTIVE,
  },
  navIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  navLabel: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  navLabelActive: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  // ── Sidebar footer ──
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#2D3F52',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '500',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  badgeSuperadmin: {
    backgroundColor: '#7C3AED',
  },
  badgeSupport: {
    backgroundColor: '#0891B2',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '500',
  },
  // ── Main content ──
  main: {
    flex: 1,
    backgroundColor: MAIN_BG,
  },
  // ── Mobile top bar ──
  mobileTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SIDEBAR_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mobileTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  mobileLogout: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
});
