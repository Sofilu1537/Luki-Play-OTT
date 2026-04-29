import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import LukiPlayLogo from '../LukiPlayLogo';
import { useTheme } from '../../hooks/useTheme';
import { SIDEBAR } from '../../styles/theme';
import { FONT_FAMILY } from '../../styles/typography';

// ---------------------------------------------------------------------------
// Nav definition
// ---------------------------------------------------------------------------
export interface NavItem {
  label:     string;
  labelFull: string;
  icon:      React.ComponentProps<typeof FontAwesome>['name'];
  path:      string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     labelFull: 'Dashboard',                         icon: 'th-large',    path: '/cms/dashboard'              },
  { label: 'Usuarios',      labelFull: 'Usuarios',                          icon: 'users',       path: '/cms/users'                  },
  { label: 'Componentes',   labelFull: 'Componentes',                       icon: 'puzzle-piece',path: '/cms/componentes'            },
  { label: 'Planes',        labelFull: 'Planes',                            icon: 'star',        path: '/cms/planes'                 },
  { label: 'Canales',       labelFull: 'Canales',                           icon: 'tv',          path: '/cms/canales'                },
  { label: 'Categorías',    labelFull: 'Categorías',                        icon: 'tags',        path: '/cms/categorias'             },
  { label: 'Sliders',       labelFull: 'Sliders',                           icon: 'image',       path: '/cms/sliders'                },
  { label: 'Monitor',       labelFull: 'Monitor',                           icon: 'bar-chart',   path: '/cms/monitor'                },
  { label: 'Notif. Admin',  labelFull: 'Notificaciones al administrador',   icon: 'bell',        path: '/cms/notificaciones-admin'   },
  { label: 'Analítica',     labelFull: 'Analítica',                         icon: 'line-chart',  path: '/cms/analitica'              },
  { label: 'Propaganda',    labelFull: 'Propaganda',                        icon: 'bullhorn',    path: '/cms/propaganda'             },
  { label: 'Notif. Abon.',  labelFull: 'Notificaciones al abonado',         icon: 'commenting',  path: '/cms/notificaciones-abonado' },
  { label: 'Roles',         labelFull: 'Roles',                             icon: 'shield',      path: '/cms/roles'                  },
];

const NAV_PERMISSION_MAP: Record<string, string> = {
  '/cms/dashboard':              'cms:dashboard',
  '/cms/users':                  'cms:users',
  '/cms/componentes':            'cms:componentes',
  '/cms/planes':                 'cms:planes',
  '/cms/canales':                'cms:canales',
  '/cms/categorias':             'cms:categorias',
  '/cms/sliders':                'cms:sliders',
  '/cms/monitor':                'cms:monitor',
  '/cms/notificaciones-admin':   'cms:notif-admin',
  '/cms/analitica':              'cms:analitica',
  '/cms/propaganda':             'cms:propaganda',
  '/cms/notificaciones-abonado': 'cms:notif-abonado',
  '/cms/roles':                  'cms:roles',
};

function hasPermission(permissions: string[] | undefined, key: string): boolean {
  if (!permissions) return true;
  return (
    permissions.includes('cms:*') ||
    permissions.includes(key) ||
    permissions.some((p) => p.startsWith(key + ':'))
  );
}

function getActiveNavItem(pathname: string | null | undefined): NavItem | undefined {
  if (!pathname) return undefined;

  return NAV_ITEMS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

// ---------------------------------------------------------------------------
// Sidebar — always dark, collapsible
// ---------------------------------------------------------------------------
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const router  = useRouter();
  const pathname = usePathname();
  const profile  = useCmsStore((s) => s.profile);

  const visibleItems = NAV_ITEMS.filter((item) => {
    const key = NAV_PERMISSION_MAP[item.path];
    return !key || hasPermission(profile?.permissions, key);
  });

  return (
    <LinearGradient
      colors={[SIDEBAR.bg1, SIDEBAR.bg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        width: collapsed ? 68 : 230,
        borderRightWidth: 0,
        paddingTop: 0,
        paddingBottom: 16,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo area — click to toggle collapse */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: collapsed ? 0 : 16,
          paddingVertical: 16,
          borderBottomWidth: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
          marginBottom: 8,
        }}
      >
        <LukiPlayLogo variant="icon" size={44} />
        {!collapsed && (
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                color: SIDEBAR.text,
                fontFamily: FONT_FAMILY.heading,
                fontSize: 17,
                letterSpacing: 0.5,
              }}
            >
              LUKIPLAY
            </Text>
            <Text
              style={{
                color: SIDEBAR.textMuted,
                fontSize: 8,
                fontWeight: '800',
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                fontFamily: FONT_FAMILY.bodyBold,
              }}
            >
              CONTROL CENTER
            </Text>
          </View>
        )}
        {!collapsed && (
          <FontAwesome name="bars" size={11} color={SIDEBAR.textMuted} />
        )}
      </TouchableOpacity>

      {/* Section label */}
      {!collapsed && (
        <Text
          style={{
            color: SIDEBAR.sectionLabel,
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 2.2,
            marginHorizontal: 18,
            marginBottom: 6,
            textTransform: 'uppercase',
            fontFamily: FONT_FAMILY.bodySemiBold,
          }}
        >
          NAVEGACIÓN
        </Text>
      )}

      {/* Nav items */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: collapsed ? 6 : 8, paddingTop: 2 }}>
          {visibleItems.map((item) => {
            const active =
              pathname === item.path || pathname?.startsWith(`${item.path}/`);

            const innerContent = (
              <>
                <FontAwesome
                  name={item.icon}
                  size={13}
                  color={active ? SIDEBAR.activeText : SIDEBAR.iconDefault}
                />
                {!collapsed && (
                  <Text
                    style={{
                      color:      active ? SIDEBAR.activeText : SIDEBAR.text,
                      fontWeight: active ? '700' : '500',
                      fontSize:   13,
                      marginLeft: 11,
                      flex:       1,
                      fontFamily: FONT_FAMILY.bodySemiBold,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                )}
                {!collapsed && active && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: SIDEBAR.activeBorder }} />
                )}
              </>
            );

            const rowBase = {
              flexDirection:     'row'        as const,
              alignItems:        'center'     as const,
              paddingHorizontal: collapsed ? 0 : 12,
              paddingVertical:   11,
              marginBottom:      2,
              borderRadius:      11,
              justifyContent:    collapsed ? ('center' as const) : ('flex-start' as const),
              borderLeftWidth:   active && !collapsed ? 3 : 0,
              borderLeftColor:   SIDEBAR.activeBorder,
            };

            if (active) {
              return (
                <Pressable key={item.path} onPress={() => router.push(item.path as never)}>
                  <LinearGradient
                    colors={[SIDEBAR.activeBg1, SIDEBAR.activeBg2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={rowBase}
                  >
                    {innerContent}
                  </LinearGradient>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item.path}
                style={({ hovered }: { hovered?: boolean }) => ({
                  ...rowBase,
                  backgroundColor: hovered ? SIDEBAR.hoverBg : 'transparent',
                })}
                onPress={() => router.push(item.path as never)}
              >
                {innerContent}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------
interface BreadcrumbItem { label: string; path?: string }

function TopBar({
  breadcrumbs,
  pageIcon,
  onLogout,
  onShowProfile,
}: {
  breadcrumbs: BreadcrumbItem[];
  pageIcon?: string;
  onLogout: () => void;
  onShowProfile: () => void;
}) {
  const { profile } = useCmsStore();
  const { isDark, theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  const displayName = (fullName || profile?.email?.split('@')[0] || 'admin').toUpperCase();
  const initials  = displayName.slice(0, 2);
  const activeNavItem = getActiveNavItem(pathname);
  const pageTitle = activeNavItem?.labelFull ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Panel';
  const activePageIcon = activeNavItem?.icon ?? pageIcon;
  const isDashboard = pathname === '/cms/dashboard' || pathname?.startsWith('/cms/dashboard/');
  const topBarChipBackground = isDashboard ? 'rgba(96,38,158,0.12)' : 'rgba(96,38,158,0.25)';
  const topBarChipBorder     = isDashboard ? 'rgba(96,38,158,0.28)' : 'rgba(96,38,158,0.60)';

  return (
    <LinearGradient
      colors={[SIDEBAR.bg1, SIDEBAR.bg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical:   14,
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
        zIndex:    50,
        elevation: 50,
      }}
    >
      {/* Left: page title + date */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {activePageIcon ? (
            <FontAwesome name={activePageIcon as any} size={16} color="#FFFFFF" />
          ) : null}
          <Text
            style={{
              color:        '#FFFFFF',
              fontSize:     20,
              fontWeight:   '600',
              letterSpacing: -0.2,
              fontFamily:   FONT_FAMILY.bodySemiBold,
            }}
          >
            {pageTitle}
          </Text>
        </View>
      </View>

      {/* Right: theme toggle + avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            backgroundColor: 'rgba(96,38,158,0.25)',
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(96,38,158,0.60)',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '800',
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              fontFamily: FONT_FAMILY.bodyBold,
            }}
          >
            ⚡ FIFA WORLD CUP 2026
          </Text>
        </View>

        {/* Dark / Light toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.75}
          style={{
            width:           38,
            height:          38,
            borderRadius:    10,
            backgroundColor: topBarChipBackground,
            borderWidth:     1,
            borderColor:     topBarChipBorder,
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <FontAwesome
            name={isDark ? 'sun-o' : 'moon-o'}
            size={16}
            color={theme.accent}
          />
        </TouchableOpacity>

        {/* Avatar dropdown */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setMenuOpen((o) => !o)}
            activeOpacity={0.8}
            style={{
              flexDirection:   'row',
              alignItems:      'center',
              gap:             8,
              backgroundColor: topBarChipBackground,
              borderRadius:    12,
              borderWidth:     1,
              borderColor:     topBarChipBorder,
              paddingHorizontal: 8,
              paddingVertical:   6,
            }}
          >
            <View
              style={{
                width:  30,
                height: 30,
                borderRadius:    8,
                alignItems:      'center',
                justifyContent:  'center',
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderWidth:     1,
                borderColor:     'rgba(255,255,255,0.24)',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                {initials}
              </Text>
            </View>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
              {displayName}
            </Text>
            <FontAwesome
              name={menuOpen ? 'chevron-up' : 'chevron-down'}
              size={9}
              color='#FFFFFF'
            />
          </TouchableOpacity>

          {menuOpen && (
            <View
              style={{
                position:        'absolute',
                top:             46,
                right:           0,
                minWidth:        160,
                backgroundColor: '#FFFFFF',
                borderRadius:    12,
                borderWidth:     1,
                borderColor:     'rgba(36,0,70,0.12)',
                overflow:        'hidden',
                zIndex:    60,
                elevation: 60,
                shadowColor:   '#000',
                shadowOpacity: 0.16,
                shadowRadius:  18,
                shadowOffset:  { width: 0, height: 10 },
                ...({ boxShadow: '0px 14px 30px rgba(24,39,75,0.16)' } as any),
              }}
            >
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); onShowProfile(); }}
                style={{ paddingHorizontal: 14, paddingVertical: 12 }}
              >
                <Text style={{ color: '#240046', fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  Perfil
                </Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: 'rgba(36,0,70,0.10)' }} />
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); onLogout(); }}
                style={{ paddingHorizontal: 14, paddingVertical: 12 }}
              >
                <Text style={{ color: '#D1105A', fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
                  Cerrar sesión
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// ProfileModal
// ---------------------------------------------------------------------------
function ProfileModal({
  visible,
  onClose,
  onLogout,
  onEditProfile,
}: {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
}) {
  const { profile } = useCmsStore();
  if (!profile) return null;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  const displayName = (fullName || profile.email?.split('@')[0] || 'USUARIO').toUpperCase();
  const initials    = displayName.slice(0, 2);
  const lastLoginLabel = profile.lastLoginAt
    ? new Date(profile.lastLoginAt).toLocaleString('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Sin registros';

  const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
    superadmin: { label: 'SUPERADMIN', color: '#FFB800', bg: 'rgba(255,184,0,0.12)'     },
    admin:      { label: 'ADMIN',      color: '#B07CC6', bg: 'rgba(176,124,198,0.12)'   },
    soporte:    { label: 'SOPORTE',    color: '#17D1C6', bg: 'rgba(23,209,198,0.12)'    },
    cliente:    { label: 'CLIENTE',    color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  };
  const role = roleMeta[profile.role?.toLowerCase()] ?? roleMeta.cliente;

  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: 'Activo',     color: '#17D1C6', bg: 'rgba(23,209,198,0.12)'  },
    inactive:  { label: 'Inactivo',   color: '#D1105A', bg: 'rgba(209,16,90,0.12)'   },
    suspended: { label: 'Suspendido', color: '#FF7900', bg: 'rgba(255,121,0,0.12)'   },
  };
  const status = statusMeta[profile.status] ?? statusMeta.active;

  const infoRows: { label: string; value: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
    { label: 'Nombres completos',  value: fullName || 'No especificado',                  icon: 'user'         },
    { label: 'Cédula de identidad',value: profile.idNumber ?? 'No especificada',          icon: 'credit-card'  },
    { label: 'Correo electrónico', value: profile.email,                                  icon: 'envelope'     },
    { label: 'Rol',                value: role.label,                                     icon: 'shield'      },
    { label: 'Último inicio de sesión', value: lastLoginLabel,                            icon: 'clock-o'      },
    { label: 'Estado',             value: status.label,                                   icon: 'circle'       },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex:            1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent:  'center',
          alignItems:      'center',
          padding:         20,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width:           '100%',
            maxWidth:        440,
            backgroundColor: '#111111',
            borderRadius:    20,
            borderWidth:     1,
            borderColor:     'rgba(255,255,255,0.10)',
            overflow:        'hidden',
            shadowColor:     '#000',
            shadowOpacity:   0.6,
            shadowRadius:    40,
            shadowOffset:    { width: 0, height: 20 },
          }}
          onPress={() => {}}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <FontAwesome name="close" size={14} color="#FAF6E7" />
          </TouchableOpacity>

          {/* Header gradient */}
          <LinearGradient
            colors={['rgba(36,0,70,0.97)', 'rgba(96,38,158,0.88)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, alignItems: 'center' }}
          >
            <View
              style={{
                width:           64,
                height:          64,
                borderRadius:    20,
                backgroundColor: 'rgba(255,184,0,0.15)',
                borderWidth:     2,
                borderColor:     'rgba(255,184,0,0.35)',
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    12,
              }}
            >
              <Text style={{ color: '#FFB800', fontSize: 22, fontWeight: '900' }}>{initials}</Text>
            </View>
            <Text style={{ color: '#FAF6E7', fontSize: 18, fontWeight: '800', marginBottom: 8, fontFamily: FONT_FAMILY.heading }}>
              {displayName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View
                style={{
                  backgroundColor: role.bg,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: role.color, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, fontFamily: FONT_FAMILY.bodyBold }}>
                  {role.label}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: status.bg,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color }} />
                  <Text style={{ color: status.color, fontSize: 10, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <Text
                style={{
                  color:         'rgba(255,255,255,0.35)',
                  fontSize:      10,
                  fontWeight:    '800',
                  letterSpacing: 1.5,
                  fontFamily:    FONT_FAMILY.bodyBold,
                }}
              >
                INFORMACIÓN DE LA CUENTA
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: '#FFB800',
                  overflow: 'hidden',
                }}
                onPress={() => { onClose(); onEditProfile(); }}
              >
                <FontAwesome name="pencil" size={13} color="#1A1A2E" />
                <Text style={{ color: '#1A1A2E', fontWeight: '700', fontSize: 16, fontFamily: FONT_FAMILY.bodySemiBold }}>
                  Editar perfil
                </Text>
              </TouchableOpacity>
            </View>
            {infoRows.map((row, i) => (
              <View
                key={row.label}
                style={{
                  flexDirection:     'row',
                  alignItems:        'center',
                  paddingVertical:   10,
                  borderBottomWidth: i < infoRows.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.07)',
                }}
              >
                <View
                  style={{
                    width:           30,
                    height:          30,
                    borderRadius:    8,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems:      'center',
                    justifyContent:  'center',
                    marginRight:     12,
                  }}
                >
                  <FontAwesome name={row.icon} size={12} color="rgba(255,255,255,0.35)" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color:      'rgba(255,255,255,0.38)',
                      fontSize:   10,
                      fontWeight: '700',
                      marginBottom: 2,
                      fontFamily: FONT_FAMILY.bodySemiBold,
                    }}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={{ color: '#FAF6E7', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}
                  >
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}

            {profile.entitlements && profile.entitlements.length > 0 && (
              <View style={{ paddingTop: 18 }}>
                <Text
                  style={{
                    color:         'rgba(255,255,255,0.35)',
                    fontSize:      10,
                    fontWeight:    '800',
                    letterSpacing: 1.5,
                    marginBottom:  10,
                    fontFamily:    FONT_FAMILY.bodyBold,
                  }}
                >
                  ENTITLEMENTS
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {profile.entitlements.map((entitlement) => (
                    <View
                      key={entitlement}
                      style={{
                        backgroundColor: 'rgba(255,184,0,0.10)',
                        borderRadius:    6,
                        paddingHorizontal: 8,
                        paddingVertical:   4,
                        borderWidth:     1,
                        borderColor:     'rgba(255,184,0,0.22)',
                      }}
                    >
                      <Text style={{ color: '#FFDA6B', fontSize: 10, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                        {entitlement}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={{ padding: 20, paddingTop: 4, alignItems: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => { onClose(); onLogout(); }}
              style={{
                backgroundColor: 'rgba(209,16,90,0.12)',
                borderRadius:    12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems:      'center',
                borderWidth:     1,
                borderColor:     'rgba(209,16,90,0.25)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome name="sign-out" size={14} color="#D1105A" />
                <Text style={{ color: '#D1105A', fontWeight: '700', fontSize: 13, fontFamily: FONT_FAMILY.bodyBold }}>
                  Cerrar sesión
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// CmsShellInner — consumes ThemeContext
// ---------------------------------------------------------------------------
interface CmsShellProps {
  breadcrumbs: BreadcrumbItem[];
  pageIcon?:   string;
  children:    React.ReactNode;
}

function CmsShellInner({ breadcrumbs, pageIcon, children }: CmsShellProps) {
  const { profile, logout } = useCmsStore();
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const { width } = useWindowDimensions();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile,      setShowProfile]      = useState(false);

  useEffect(() => {
    setSidebarCollapsed(width < 1024);
  }, [width]);

  const handleLogout = () => {
    logout();
    router.replace('/cms/login' as never);
  };

  if (!profile) return null;

  return (
    <View
      style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.bodyBg, overflow: 'hidden' }}
    >
      {/* Decorative background behind cards */}
      <LinearGradient
        colors={isDark
          ? [
              'rgba(36,0,70,0.4)',
              'rgba(96,38,158,0.25)',
              'rgba(115,3,192,0.12)',
            ]
          : [
              'rgba(255,255,255,1)',
              'rgba(255,255,255,0.98)',
              'rgba(255,255,255,1)',
            ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />

      {/* Radial orbs */}
      <>
        <View
          style={{
            position:        'absolute',
            top:             -140,
            left:            -140,
            width:           500,
            height:          500,
            borderRadius:    250,
            backgroundColor: isDark ? 'rgba(255,198,41,0.08)' : 'rgba(120,120,120,0.10)',
            zIndex: 1,
          }}
          pointerEvents="none"
        />
        <View
          style={{
            position:        'absolute',
            top:             -80,
            right:           '4%',
            width:           320,
            height:          320,
            borderRadius:    160,
            backgroundColor: isDark ? 'rgba(255,213,77,0.04)' : 'rgba(120,120,120,0.06)',
            zIndex: 1,
          }}
          pointerEvents="none"
        />
      </>

      {/* Sidebar — always dark, hide below 640px */}
      {width >= 640 && (
        <View style={{ position: 'relative', zIndex: 2 }}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        </View>
      )}

      {/* Main content */}
      <View style={{ flex: 1, overflow: 'hidden', zIndex: 2 }}>
        <TopBar
          breadcrumbs={breadcrumbs}
          pageIcon={pageIcon}
          onLogout={handleLogout}
          onShowProfile={() => setShowProfile(true)}
        />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {children}
        </View>
      </View>

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={handleLogout}
        onEditProfile={() => router.push('/cms/profile' as never)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// CmsShell — public export, ThemeProvider now lives in _layout.tsx
// ---------------------------------------------------------------------------
export default function CmsShell({ breadcrumbs, pageIcon, children }: CmsShellProps) {
  return (
    <CmsShellInner breadcrumbs={breadcrumbs} pageIcon={pageIcon}>{children}</CmsShellInner>
  );
}
