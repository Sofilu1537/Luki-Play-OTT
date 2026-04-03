import React from 'react';
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
// Theme
// ---------------------------------------------------------------------------

export const C = {
  bg: '#0F172A',
  sidebar: '#1B2538',
  surface: '#1E293B',
  border: '#2D3F55',
  accent: '#5B5BD6',
  accentLight: '#6D6DE8',
  muted: '#64748B',
  text: '#E2E8F0',
  textDim: '#94A3B8',
};

// ---------------------------------------------------------------------------
// Sidebar nav definition
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  path: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    icon: 'th-large',    path: '/cms/dashboard' },
  { label: 'Usuarios',     icon: 'users',       path: '/cms/users' },
  { label: 'Contratos',    icon: 'file-text',   path: '/cms/accounts' },
  { label: 'Sesiones',     icon: 'lock',        path: '/cms/sessions' },
  { label: 'Componentes',  icon: 'puzzle-piece', path: '/cms/componentes' },
  { label: 'Planes',       icon: 'star',        path: '/cms/planes',     badge: 'new' },
  { label: 'Sliders',      icon: 'image',       path: '/cms/sliders' },
  { label: 'Canales',      icon: 'tv',          path: '/cms/canales' },
  { label: 'Categorías',   icon: 'tags',        path: '/cms/categorias', badge: 'new' },
  { label: 'Blog',         icon: 'pencil',      path: '/cms/blog' },
  { label: 'Monitor',      icon: 'bar-chart',   path: '/cms/monitor',    badge: 'new' },
  { label: 'Impuestos',    icon: 'percent',     path: '/cms/impuestos',  badge: 'new' },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        width: 220,
        backgroundColor: C.sidebar,
        borderRightWidth: 1,
        borderRightColor: C.border,
        paddingTop: 20,
        paddingBottom: 16,
        height: '100%',
      }}
    >
      {/* Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 24 }}>
        <View
          style={{
            width: 34,
            height: 34,
            backgroundColor: C.accent,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>LP</Text>
        </View>
        <View>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Luki Play</Text>
          <Text style={{ color: C.muted, fontSize: 10 }}>Admin Panel</Text>
        </View>
      </View>

      {/* Nav */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginHorizontal: 8,
                borderRadius: 8,
                backgroundColor: active ? C.accent : 'transparent',
                marginBottom: 1,
              }}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome
                name={item.icon}
                size={14}
                color={active ? 'white' : C.muted}
                style={{ width: 20 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: active ? 'white' : C.textDim,
                  fontWeight: active ? '700' : '400',
                  fontSize: 13,
                  marginLeft: 10,
                }}
              >
                {item.label}
              </Text>
              {item.badge && (
                <View
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#1E3A5F',
                    borderRadius: 4,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: active ? 'white' : '#60A5FA', fontSize: 9, fontWeight: '700' }}>
                    {item.badge.toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          marginHorizontal: 8,
          borderRadius: 8,
          marginTop: 8,
        }}
        onPress={onLogout}
      >
        <FontAwesome name="sign-out" size={14} color="#F87171" style={{ width: 20 }} />
        <Text style={{ color: '#F87171', fontWeight: '500', fontSize: 13, marginLeft: 10 }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  label: string;
  path?: string;
}

function TopBar({
  breadcrumbs,
  onLogout,
}: {
  breadcrumbs: BreadcrumbItem[];
  onLogout: () => void;
}) {
  const router = useRouter();
  const { profile } = useCmsStore();
  const firstName = profile?.email?.split('@')[0].toUpperCase() ?? 'ADMIN';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}
    >
      {/* Breadcrumb */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <FontAwesome name="home" size={13} color={C.muted} />
        {breadcrumbs.map((crumb, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FontAwesome name="chevron-right" size={9} color={C.muted} />
            <TouchableOpacity
              onPress={() => crumb.path && router.push(crumb.path as never)}
              disabled={!crumb.path}
            >
              <Text
                style={{
                  color: i === breadcrumbs.length - 1 ? C.text : C.muted,
                  fontSize: 13,
                  fontWeight: i === breadcrumbs.length - 1 ? '600' : '400',
                }}
              >
                {crumb.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Right actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: C.textDim, fontSize: 12 }}>🇪🇸</Text>
          <Text style={{ color: C.textDim, fontSize: 12 }}>Español</Text>
        </View>
        <FontAwesome name="search" size={14} color={C.muted} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#243044',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: C.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>
              {firstName.charAt(0)}
            </Text>
          </View>
          <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>{firstName}</Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <FontAwesome name="sign-out" size={15} color="#F87171" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CmsShell — main layout wrapper
// ---------------------------------------------------------------------------

interface CmsShellProps {
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
}

export default function CmsShell({ breadcrumbs, children }: CmsShellProps) {
  const { profile, logout } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  const handleLogout = () => {
    logout();
    router.replace('/cms/login' as never);
  };

  if (!profile) return null;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      {showSidebar && <Sidebar onLogout={handleLogout} />}

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <TopBar breadcrumbs={breadcrumbs} onLogout={handleLogout} />
        {children}
      </View>
    </View>
  );
}
