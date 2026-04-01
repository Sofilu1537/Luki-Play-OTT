import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIDEBAR_WIDTH = 220;
const BG = '#0F172A';
const SURFACE = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#6D28D9';
const TEXT_MUTED = '#64748B';

// ---------------------------------------------------------------------------
// Sidebar nav items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'th-large' as const, path: '/cms/dashboard' },
  { label: 'Usuarios', icon: 'users' as const, path: '/cms/users' },
  { label: 'Contratos', icon: 'file-text' as const, path: '/cms/accounts' },
  { label: 'Sesiones', icon: 'lock' as const, path: '/cms/sessions' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Sidebar navigation shared across all CMS screens. */
function Sidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        backgroundColor: SURFACE,
        borderRightWidth: 1,
        borderRightColor: BORDER,
        paddingTop: 24,
        paddingBottom: 16,
      }}
    >
      {/* Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 32 }}>
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: ACCENT,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <FontAwesome name="play" size={14} color="white" />
        </View>
        <View>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Luki CMS</Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>Panel interno</Text>
        </View>
      </View>

      {/* Nav links */}
      <ScrollView style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                marginHorizontal: 8,
                borderRadius: 10,
                backgroundColor: active ? ACCENT : 'transparent',
                marginBottom: 2,
              }}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome
                name={item.icon}
                size={16}
                color={active ? 'white' : TEXT_MUTED}
                style={{ width: 22 }}
              />
              <Text
                style={{
                  color: active ? 'white' : '#CBD5E1',
                  fontWeight: active ? '700' : '500',
                  fontSize: 14,
                  marginLeft: 10,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          marginHorizontal: 8,
          borderRadius: 10,
        }}
        onPress={onLogout}
      >
        <FontAwesome name="sign-out" size={16} color="#F87171" style={{ width: 22 }} />
        <Text style={{ color: '#F87171', fontWeight: '600', fontSize: 14, marginLeft: 10 }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/** Summary metric card. */
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: SURFACE,
        borderRadius: 16,
        padding: 20,
        margin: 6,
        borderWidth: 1,
        borderColor: BORDER,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: `${color}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * CMS Dashboard screen.
 *
 * Displays a sidebar navigation and summary metric cards.
 * Redirects unauthenticated users to /cms/login.
 */
export default function CmsDashboard() {
  const { profile, logout } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  // Guard — redirect if not authenticated
  useEffect(() => {
    if (!profile) {
      router.replace('/cms/login' as never);
    }
  }, [profile, router]);

  if (!profile) return null;

  const handleLogout = () => {
    logout();
    router.replace('/cms/login' as never);
  };

  const roleLabel =
    profile.role === 'SUPERADMIN'
      ? 'Super Admin'
      : profile.role === 'SOPORTE'
      ? 'Soporte Técnico'
      : profile.role;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: BG }}>
      {/* Sidebar — visible on wide screens */}
      {showSidebar && <Sidebar onLogout={handleLogout} />}

      {/* Main content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Dashboard</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>
              Bienvenido, {profile.email}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: SURFACE,
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#22C55E',
              }}
            />
            <Text style={{ color: '#CBD5E1', fontSize: 13, fontWeight: '600' }}>{roleLabel}</Text>

            {/* Mobile logout button */}
            {!showSidebar && (
              <TouchableOpacity
                onPress={handleLogout}
                style={{ marginLeft: 8 }}
              >
                <FontAwesome name="sign-out" size={16} color="#F87171" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 32 }}>
          <StatCard label="Usuarios registrados" value="7" icon="users" color="#6D28D9" />
          <StatCard label="Contratos activos" value="5" icon="file-text" color="#0EA5E9" />
          <StatCard label="Sesiones activas" value="—" icon="lock" color="#F59E0B" />
          <StatCard label="Usuarios ISP" value="4" icon="wifi" color="#10B981" />
        </View>

        {/* Quick links */}
        <Text style={{ color: '#CBD5E1', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
          Accesos rápidos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {NAV_ITEMS.filter((i) => i.path !== '/cms/dashboard').map((item) => (
            <TouchableOpacity
              key={item.path}
              style={{
                backgroundColor: SURFACE,
                borderRadius: 14,
                padding: 20,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: 'center',
                minWidth: 130,
              }}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome name={item.icon} size={24} color={ACCENT} style={{ marginBottom: 10 }} />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role badge */}
        {profile.role === 'SUPERADMIN' && (
          <View
            style={{
              marginTop: 32,
              backgroundColor: '#1E1035',
              borderRadius: 14,
              padding: 18,
              borderWidth: 1,
              borderColor: ACCENT,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <FontAwesome name="shield" size={20} color={ACCENT} />
            <Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '600' }}>
              Tienes acceso de Super Administrador con todos los permisos del sistema.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
