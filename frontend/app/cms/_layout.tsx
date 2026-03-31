import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const BG = '#0F172A';
const SURFACE = '#1E293B';
const ACCENT = '#6D28D9';
const TEXT = '#F1F5F9';
const MUTED = '#94A3B8';
const BORDER = '#334155';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'bar-chart', path: '/cms/dashboard' },
  { label: 'Usuarios', icon: 'users', path: '/cms/users' },
  { label: 'Contratos', icon: 'file-text', path: '/cms/accounts' },
  { label: 'Sesiones', icon: 'lock', path: '/cms/sessions' },
];

function Sidebar({ onNavigate }: { onNavigate: (path: string) => void }) {
  const pathname = usePathname();
  const { admin, logout } = useCmsStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/cms/login');
  };

  return (
    <View
      style={{
        width: 220,
        backgroundColor: SURFACE,
        borderRightWidth: 1,
        borderRightColor: BORDER,
        paddingTop: 24,
        paddingBottom: 16,
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <View>
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ color: TEXT, fontSize: 22, fontWeight: '800' }}>
            🎬 Luki{' '}
            <Text style={{ color: ACCENT }}>CMS</Text>
          </Text>
          {admin && (
            <Text style={{ color: MUTED, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
              {admin.email}
            </Text>
          )}
        </View>

        {/* Nav items */}
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => onNavigate(item.path)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: active ? ACCENT + '33' : 'transparent',
                borderLeftWidth: 3,
                borderLeftColor: active ? ACCENT : 'transparent',
                marginBottom: 2,
              }}
            >
              <FontAwesome
                name={item.icon as any}
                size={16}
                color={active ? ACCENT : MUTED}
                style={{ width: 22 }}
              />
              <Text
                style={{
                  color: active ? TEXT : MUTED,
                  fontSize: 14,
                  fontWeight: active ? '700' : '400',
                  marginLeft: 10,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          marginTop: 8,
        }}
      >
        <FontAwesome name="sign-out" size={16} color="#F87171" style={{ width: 22 }} />
        <Text style={{ color: '#F87171', fontSize: 14, marginLeft: 10 }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * CMS layout — provides the sidebar navigation and route protection.
 * On screens narrower than 768 px the sidebar is hidden and a top bar is shown.
 */
export default function CmsLayout() {
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;
  const router = useRouter();
  const { admin } = useCmsStore();

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  // If not authenticated, show nothing (the individual screens handle redirection)
  if (!admin) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG, flexDirection: 'row' }}>
      {showSidebar && <Sidebar onNavigate={handleNavigate} />}

      <View style={{ flex: 1 }}>
        {/* Mobile top bar */}
        {!showSidebar && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: SURFACE,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: BORDER,
            }}
          >
            <Text style={{ color: TEXT, fontWeight: '800', fontSize: 18 }}>
              🎬 Luki CMS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.path}
                  onPress={() => handleNavigate(item.path)}
                  style={{ marginLeft: 12 }}
                >
                  <Text style={{ color: MUTED, fontSize: 13 }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}
