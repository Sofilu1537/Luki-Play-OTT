import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ─── Design System: Nebula Dark ─────────────────────────────────────────────

export const C = {
  // Depth layers
  void:    '#050B17',
  panel:   '#070E1D',
  surface: '#0C1829',
  lift:    '#102236',

  // Borders
  border:     'rgba(255,255,255,0.06)',
  borderMid:  'rgba(255,255,255,0.11)',
  borderHigh: 'rgba(255,255,255,0.20)',

  // Brand accent — violet
  accent:       '#7B5EF8',
  accentGlow:   'rgba(123,94,248,0.22)',
  accentLight:  '#A78BFA',
  accentFaint:  'rgba(123,94,248,0.08)',
  accentBorder: 'rgba(123,94,248,0.30)',

  // Semantic palette
  cyan:   '#22D3EE',
  green:  '#10B981',
  amber:  '#FBBF24',
  rose:   '#F43F5E',

  // Text hierarchy
  text:    '#EFF6FF',
  textSec: '#94A3B8',
  muted:   '#3F5475',
  dimmed:  '#1C2E45',
};

// ─── Nav Definition ──────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  path: string;
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Usuarios',           icon: 'users',       path: '/cms/users' },
  { label: 'Componentes',        icon: 'th-large',    path: '/cms/componentes',             soon: true },
  { label: 'Planes',             icon: 'credit-card', path: '/cms/planes' },
  { label: 'Canales',            icon: 'tv',          path: '/cms/canales' },
  { label: 'Categorías',         icon: 'tags',        path: '/cms/categorias' },
  { label: 'Sliders',            icon: 'image',       path: '/cms/sliders' },
  { label: 'Monitor',            icon: 'bar-chart',   path: '/cms/monitor' },
  { label: 'Notific. Admin',     icon: 'bell',        path: '/cms/notificaciones-admin',    soon: true },
  { label: 'Analítica',          icon: 'line-chart',  path: '/cms/analitica',               soon: true },
  { label: 'Propaganda',         icon: 'bullhorn',    path: '/cms/propaganda',              soon: true },
  { label: 'Notific. Abonado',   icon: 'comment',     path: '/cms/notificaciones-abonado',  soon: true },
  { label: 'Abonado',            icon: 'user-circle', path: '/cms/abonado',                 soon: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayName(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getRoleLabel(role: string): string {
  if (role === 'SUPERADMIN') return 'Super Administrador';
  if (role === 'SOPORTE') return 'Soporte Técnico';
  return role;
}

function getRoleColor(role: string): string {
  if (role === 'SUPERADMIN') return C.accent;
  if (role === 'SOPORTE') return C.cyan;
  return C.muted;
}

// ─── Profile Modal ───────────────────────────────────────────────────────────

function ProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { profile } = useCmsStore();
  if (!profile) return null;

  const name = getDisplayName(profile.email);
  const roleLabel = getRoleLabel(profile.role);
  const roleColor = getRoleColor(profile.role);
  const initial = name.charAt(0).toUpperCase();

  const Field = ({ icon, label, value }: { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; value: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.accentFaint, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <FontAwesome name={icon} size={13} color={C.accentLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 2 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{ color: value === '—' ? C.muted : C.text, fontSize: 13, fontWeight: '500' }}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: 380,
            backgroundColor: C.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.borderMid,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 24 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
          }}
          onPress={() => {/* block close */}}
        >
          {/* Header with accent gradient simulation */}
          <View style={{
            backgroundColor: C.accentFaint,
            borderBottomWidth: 1,
            borderBottomColor: C.accentBorder,
            padding: 28,
            alignItems: 'center',
          }}>
            <View style={{
              width: 68, height: 68,
              borderRadius: 34,
              backgroundColor: C.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              shadowColor: C.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 20,
            }}>
              <Text style={{ color: 'white', fontSize: 26, fontWeight: '900' }}>{initial}</Text>
            </View>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>{name}</Text>
            <View style={{
              backgroundColor: `${roleColor}20`,
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: `${roleColor}40`,
            }}>
              <Text style={{ color: roleColor, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                {roleLabel.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Fields */}
          <View style={{ padding: 20 }}>
            <Field icon="envelope" label="Correo" value={profile.email} />
            <Field icon="phone" label="Teléfono" value="—" />
            <Field icon="id-card" label="ID de usuario" value={profile.id} />
            <Field icon="shield" label="Estado" value={profile.status ?? 'ACTIVE'} />
          </View>

          {/* Close button */}
          <View style={{ padding: 20, paddingTop: 4 }}>
            <TouchableOpacity
              style={{
                backgroundColor: C.lift,
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: C.border,
              }}
              onPress={onClose}
            >
              <Text style={{ color: C.textSec, fontWeight: '600', fontSize: 13 }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={{
      width: 230,
      backgroundColor: C.panel,
      borderRightWidth: 1,
      borderRightColor: C.border,
      height: '100%',
    }}>
      {/* Logo block */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 38, height: 38,
            backgroundColor: C.accent,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: C.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 14,
          }}>
            <FontAwesome name="play" size={13} color="white" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: C.text, fontWeight: '900', fontSize: 16, letterSpacing: -0.5 }}>LUKI</Text>
              <Text style={{ color: C.accent, fontWeight: '900', fontSize: 16, letterSpacing: -0.5 }}>PLAY</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 9, letterSpacing: 2.5, fontWeight: '700' }}>CMS PANEL</Text>
          </View>
        </View>

        {/* System status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: '500', letterSpacing: 0.3 }}>
            Sistema en línea
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <ScrollView style={{ flex: 1, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 20,
                paddingRight: 14,
                paddingVertical: 9,
                marginBottom: 1,
                backgroundColor: active ? C.accentFaint : 'transparent',
                overflow: 'hidden',
              }}
              activeOpacity={0.7}
            >
              {/* Active left bar */}
              {active && (
                <View style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  backgroundColor: C.accent,
                }} />
              )}
              <FontAwesome
                name={item.icon}
                size={13}
                color={active ? C.accentLight : C.muted}
                style={{ width: 20 }}
              />
              <Text
                style={{
                  flex: 1,
                  color: active ? C.text : C.textSec,
                  fontWeight: active ? '600' : '400',
                  fontSize: 13,
                  marginLeft: 11,
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.soon && (
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 4,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: C.border,
                }}>
                  <Text style={{ color: C.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 }}>
                    SOON
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sidebar footer */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: C.border,
      }}>
        <Text style={{ color: C.dimmed, fontSize: 10, letterSpacing: 0.5 }}>
          v1.5.0 · Luki Play OTT
        </Text>
      </View>
    </View>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────

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
  const [profileOpen, setProfileOpen] = useState(false);

  if (!profile) return null;

  const displayName = getDisplayName(profile.email);
  const initial = displayName.charAt(0).toUpperCase();
  const roleColor = getRoleColor(profile.role);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Panel';

  const MenuItem = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    label: string;
    color?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome name={icon} size={13} color={color ?? C.textSec} style={{ width: 18 }} />
      <Text style={{ color: color ?? C.textSec, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <ProfileModal visible={profileOpen} onClose={() => setProfileOpen(false)} />

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
        paddingVertical: 0,
        height: 58,
        backgroundColor: C.panel,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        {/* Page title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 3, height: 18, backgroundColor: C.accent, borderRadius: 2 }} />
          <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>
            {pageTitle}
          </Text>
          {breadcrumbs.length > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {breadcrumbs.slice(0, -1).map((crumb, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome name="chevron-right" size={8} color={C.muted} />
                  <TouchableOpacity onPress={() => crumb.path && router.push(crumb.path as never)} disabled={!crumb.path}>
                    <Text style={{ color: C.muted, fontSize: 12 }}>{crumb.label}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>

          {/* Notification bell */}
          <TouchableOpacity
            style={{
              width: 36, height: 36,
              borderRadius: 9,
              backgroundColor: C.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: C.border,
            }}
            activeOpacity={0.7}
          >
            <FontAwesome name="bell-o" size={14} color={C.textSec} />
          </TouchableOpacity>

          {/* User button + dropdown */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setMenuOpen(!menuOpen)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 9,
                backgroundColor: menuOpen ? C.lift : C.surface,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: menuOpen ? C.borderMid : C.border,
              }}
              activeOpacity={0.8}
            >
              {/* Avatar */}
              <View style={{
                width: 28, height: 28,
                borderRadius: 14,
                backgroundColor: C.accent,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: `${roleColor}60`,
              }}>
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{initial}</Text>
              </View>
              <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>
                {displayName.split(' ')[0]}
              </Text>
              <FontAwesome
                name={menuOpen ? 'chevron-up' : 'chevron-down'}
                size={9}
                color={C.muted}
              />
            </TouchableOpacity>

            {/* Dropdown menu */}
            {menuOpen && (
              <View style={{
                position: 'absolute',
                top: 46,
                right: 0,
                width: 220,
                backgroundColor: C.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.borderMid,
                zIndex: 9999,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.5,
                shadowRadius: 28,
              }}>
                {/* User header inside dropdown */}
                <View style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  backgroundColor: C.accentFaint,
                }}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>{displayName}</Text>
                  <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{profile.email}</Text>
                </View>

                <View style={{ padding: 6 }}>
                  <MenuItem
                    icon="user-o"
                    label="Mi perfil"
                    onPress={() => { setMenuOpen(false); setProfileOpen(true); }}
                  />
                  <MenuItem
                    icon="life-ring"
                    label="Soporte"
                    onPress={() => { setMenuOpen(false); }}
                  />
                  <View style={{ height: 1, backgroundColor: C.border, marginVertical: 4, marginHorizontal: 8 }} />
                  <MenuItem
                    icon="sign-out"
                    label="Cerrar sesión"
                    color={C.rose}
                    onPress={() => { setMenuOpen(false); onLogout(); }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
}

// ─── CmsShell — main layout wrapper ──────────────────────────────────────────

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
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.void }}>
      {showSidebar && <Sidebar />}

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <TopBar breadcrumbs={breadcrumbs} onLogout={handleLogout} />
        {children}
      </View>
    </View>
  );
}
