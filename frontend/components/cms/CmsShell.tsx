import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import LukiPlayLogo from '../LukiPlayLogo';

// ---------------------------------------------------------------------------
// Theme — Luki Play Brand (purple + gold)
// ---------------------------------------------------------------------------

export const C = {
  // Background hierarchy (deep purple)
  bg:          '#160035',
  panel:       'rgba(26, 6, 62, 0.96)',
  sidebar:     'rgba(26, 6, 62, 0.97)',
  surface:     'rgba(42, 14, 90, 0.88)',
  surfaceAlt:  'rgba(55, 20, 110, 0.85)',
  surfaceSoft: 'transparent',
  lift:        'rgba(70, 28, 130, 0.92)',
  tableHead:   'rgba(70, 28, 130, 0.92)',

  // Borders
  border:       'rgba(255,255,255,0.10)',
  borderMid:    'rgba(255,184,0,0.28)',

  // Primary accent: GOLD
  accent:       '#FFB800',
  accentLight:  '#FFDA6B',
  accentSoft:   'rgba(255,184,0,0.14)',
  accentBorder: 'rgba(255,184,0,0.36)',
  accentGlow:   'rgba(255,184,0,0.26)',
  accentFaint:  'rgba(255,184,0,0.14)',

  // Secondary: light violet
  cyan:        '#B490FF',
  cyanSoft:    'rgba(180,144,255,0.16)',

  // Semantic
  green:       '#10B981',
  greenSoft:   'rgba(16,185,129,0.16)',
  amber:       '#FFB800',
  rose:        '#F43F5E',
  roseSoft:    'rgba(244,63,94,0.16)',
  success:     '#10B981',
  danger:      '#F43F5E',

  // Typography
  muted:       '#8B72B2',
  text:        '#FFFFFF',
  textSec:     '#D0C4E8',
  textDim:     '#D0C4E8',

  // Extra
  void:        '#160035',
  dimmed:      '#0D0020',
};

// ---------------------------------------------------------------------------
// Sidebar nav definition
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    icon: 'th-large',    path: '/cms/dashboard' },
  { label: 'Usuarios',     icon: 'users',       path: '/cms/users' },
  { label: 'Componentes',  icon: 'puzzle-piece', path: '/cms/componentes' },
  { label: 'Planes',       icon: 'star',        path: '/cms/planes' },
  { label: 'Canales',      icon: 'tv',          path: '/cms/canales' },
  { label: 'Categorías',   icon: 'tags',        path: '/cms/categorias' },
  { label: 'Sliders',      icon: 'image',       path: '/cms/sliders' },
  { label: 'Monitor',      icon: 'bar-chart',   path: '/cms/monitor' },
  { label: 'Notificaciones al administrador', icon: 'bell', path: '/cms/notificaciones-admin' },
  { label: 'Analítica',    icon: 'line-chart',  path: '/cms/analitica' },
  { label: 'Propaganda',   icon: 'bullhorn',    path: '/cms/propaganda' },
  { label: 'Notificaciones al abonado', icon: 'commenting', path: '/cms/notificaciones-abonado' },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <LinearGradient
      colors={['rgba(26,6,62,0.97)', 'rgba(16,2,42,0.99)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        width: 260,
        borderRightWidth: 1,
        borderRightColor: C.border,
        paddingTop: 18,
        paddingBottom: 18,
        paddingHorizontal: 14,
        height: '100%',
      }}
    >
      <View
        style={{
          borderRadius: 24,
          borderWidth: 1,
          borderColor: C.border,
          padding: 16,
          marginBottom: 18,
          backgroundColor: C.surface,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LukiPlayLogo variant="icon" size={42} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: C.text, fontWeight: '900', fontSize: 17 }}>LUKI PLAY</Text>
              <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1.5 }}>CONTROL CENTER</Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: C.accentFaint,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.accentBorder,
              paddingHorizontal: 10,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: C.accent, fontWeight: '900', fontSize: 14 }}>24</Text>
            <Text style={{ color: C.muted, fontSize: 8, letterSpacing: 1.2 }}>LIVE</Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.lift,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: C.success,
              marginRight: 10,
              shadowColor: C.success,
              shadowOpacity: 0.5,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          <View>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 12 }}>Operación estable</Text>
            <Text style={{ color: C.textDim, fontSize: 11 }}>CMS activo para revisión local</Text>
          </View>
        </View>
      </View>

      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginHorizontal: 12, marginBottom: 12 }}>
        NAVEGACIÓN
      </Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || pathname?.startsWith(`${item.path}/`);
          return (
            <Pressable
              key={item.path}
              style={({ hovered }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 15,
                marginHorizontal: 4,
                borderRadius: 18,
                backgroundColor: active ? C.lift : hovered ? 'rgba(70,28,130,0.5)' : 'transparent',
                borderWidth: 1,
                borderColor: active ? C.accentBorder : 'transparent',
                borderLeftWidth: active ? 3 : 1,
                borderLeftColor: active ? C.accent : 'transparent',
                marginBottom: 8,
                ...(active ? {
                  shadowColor: '#FFB800',
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                } : {}),
              })}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome
                name={item.icon}
                size={15}
                color={active ? C.accent : C.textDim}
                style={{ width: 22 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: active ? C.text : C.textDim,
                  fontWeight: active ? '800' : '600',
                  fontSize: 13,
                  marginLeft: 10,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </LinearGradient>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = profile?.email?.split('@')[0].toUpperCase() ?? 'ADMIN';
  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Panel';

  return (
    <View
      style={{
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: C.panel,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        zIndex: 50,
        elevation: 50,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>
          {currentTitle}
        </Text>
        <View style={{
          backgroundColor: C.accentFaint,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.accentBorder,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}>
          <Text style={{ color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
            LUKI PLAY CMS
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor: C.lift,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name="bell-o" size={16} color={C.textDim} />
        </View>

        <View
          style={{
            position: 'relative',
          }}
        >
          <TouchableOpacity
            onPress={() => setMenuOpen((current) => !current)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: C.lift,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 8,
              paddingVertical: 7,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: C.accentSoft,
                borderWidth: 1,
                borderColor: C.accentBorder,
              }}
            >
              <Text style={{ color: C.accentLight, fontSize: 11, fontWeight: '900' }}>
                {firstName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>ADMIN</Text>
              <Text style={{ color: C.muted, fontSize: 10 }}>{firstName}</Text>
            </View>
            <FontAwesome name={menuOpen ? 'chevron-up' : 'chevron-down'} size={12} color={C.textDim} />
          </TouchableOpacity>

          {menuOpen && (
            <View
              style={{
                position: 'absolute',
                top: 56,
                right: 0,
                minWidth: 170,
                backgroundColor: C.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.border,
                overflow: 'hidden',
                zIndex: 60,
                elevation: 60,
                shadowColor: '#0D0020',
                shadowOpacity: 0.5,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 10 },
              }}
            >
              <TouchableOpacity
                onPress={() => setMenuOpen(false)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: C.surface,
                }}
              >
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: C.lift,
                  borderTopWidth: 1,
                  borderTopColor: C.border,
                }}
              >
                <Text style={{ color: C.danger, fontSize: 13, fontWeight: '700' }}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    <LinearGradient
      colors={['#1a0040', '#2e0a6e', '#4a18a0', '#2e0a6e']}
      locations={[0, 0.4, 0.7, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1, flexDirection: 'row', overflow: 'hidden' }}
    >
      {/* Bokeh orb 1 — purple, top-right */}
      <View style={{
        position: 'absolute', top: -120, right: -80,
        width: 500, height: 500, borderRadius: 250,
        backgroundColor: 'rgba(123,47,190,0.25)',
      }} />
      {/* Bokeh orb 2 — purple, bottom-left */}
      <View style={{
        position: 'absolute', bottom: -60, left: -100,
        width: 400, height: 400, borderRadius: 200,
        backgroundColor: 'rgba(90,30,158,0.20)',
      }} />
      {/* Bokeh orb 3 — faint gold, center-right */}
      <View style={{
        position: 'absolute', top: '30%', right: '20%',
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(255,184,0,0.06)',
      }} />

      {showSidebar && <Sidebar />}

      <View style={{ flex: 1, overflow: 'hidden', zIndex: 1 }}>
        <TopBar breadcrumbs={breadcrumbs} onLogout={handleLogout} />
        <View style={{ flex: 1, zIndex: 1 }}>
          {children}
        </View>
      </View>
    </LinearGradient>
  );
}
