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
import { ThemeProvider, useTheme } from '../../hooks/useTheme';
import { SIDEBAR } from '../../styles/theme';
import { FONT_FAMILY } from '../../styles/typography';

// ---------------------------------------------------------------------------
// Backward-compatible C export — pages still importing C get dark theme values
// ---------------------------------------------------------------------------
export const C = {
  bg:          '#090909',
  panel:       'rgba(18,18,18,0.92)',
  sidebar:     'rgba(17,17,17,0.97)',
  surface:     'rgba(24,24,24,0.86)',
  surfaceAlt:  'rgba(30,30,30,0.90)',
  surfaceSoft: 'transparent',
  lift:        'rgba(34,34,34,0.96)',
  tableHead:   'rgba(34,34,34,0.96)',
  border:      'rgba(255,255,255,0.08)',
  borderMid:   'rgba(255,184,0,0.28)',
  accent:      '#FFB800',
  accentLight: '#FFDA6B',
  accentSoft:  'rgba(255,184,0,0.12)',
  accentBorder:'rgba(255,184,0,0.30)',
  accentGlow:  'rgba(255,184,0,0.22)',
  accentFaint: 'rgba(255,184,0,0.10)',
  cyan:        '#17D1C6',
  cyanSoft:    'rgba(23,209,198,0.14)',
  green:       '#17D1C6',
  greenSoft:   'rgba(23,209,198,0.14)',
  amber:       '#FFB800',
  rose:        '#D1105A',
  roseSoft:    'rgba(209,16,90,0.14)',
  success:     '#17D1C6',
  danger:      '#D1105A',
  muted:       'rgba(250,246,231,0.38)',
  text:        '#FAF6E7',
  textSec:     'rgba(250,246,231,0.65)',
  textDim:     'rgba(250,246,231,0.50)',
  void:        '#060606',
  dimmed:      '#030303',
};

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
  return permissions.includes('cms:*') || permissions.includes(key);
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
        borderRightWidth: 1,
        borderRightColor: SIDEBAR.border,
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
          borderBottomWidth: 1,
          borderBottomColor: SIDEBAR.border,
          justifyContent: collapsed ? 'center' : 'flex-start',
          marginBottom: 8,
        }}
      >
        <LukiPlayLogo variant="icon" size={36} />
        {!collapsed && (
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                color: SIDEBAR.text,
                fontWeight: '900',
                fontSize: 15,
                letterSpacing: -0.3,
              }}
            >
              LUKI PLAY
            </Text>
            <Text
              style={{
                color: SIDEBAR.textMuted,
                fontSize: 8,
                fontWeight: '800',
                letterSpacing: 2.2,
                textTransform: 'uppercase',
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

            return (
              <Pressable
                key={item.path}
                style={({ hovered }: { hovered?: boolean }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: collapsed ? 0 : 12,
                  paddingVertical: 11,
                  marginBottom: 2,
                  borderRadius: 11,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  backgroundColor: active
                    ? SIDEBAR.activeBg
                    : hovered
                    ? SIDEBAR.hoverBg
                    : 'transparent',
                  borderLeftWidth: active && !collapsed ? 2 : 0,
                  borderLeftColor: SIDEBAR.activeBorder,
                })}
                onPress={() => router.push(item.path as never)}
              >
                <FontAwesome
                  name={item.icon}
                  size={13}
                  color={active ? SIDEBAR.activeText : SIDEBAR.iconDefault}
                />
                {!collapsed && (
                  <Text
                    style={{
                      color: active ? SIDEBAR.activeText : SIDEBAR.text,
                      fontWeight: active ? '700' : '500',
                      fontSize: 13,
                      marginLeft: 11,
                      flex: 1,
                      fontFamily: FONT_FAMILY.bodySemiBold,
                    }}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                )}
                {!collapsed && active && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: SIDEBAR.activeBorder,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer status */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: SIDEBAR.footerBorder,
          paddingHorizontal: collapsed ? 0 : 16,
          paddingTop: 12,
          alignItems: collapsed ? 'center' : 'flex-start',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: '#17D1C6',
              shadowColor: '#17D1C6',
              shadowOpacity: 0.7,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          {!collapsed && (
            <View>
              <Text
                style={{
                  color: SIDEBAR.text,
                  fontSize: 11,
                  fontWeight: '600',
                  fontFamily: FONT_FAMILY.bodySemiBold,
                }}
              >
                Sistema operativo
              </Text>
              <Text
                style={{
                  color: SIDEBAR.textMuted,
                  fontSize: 10,
                  fontFamily: FONT_FAMILY.body,
                }}
              >
                CMS v1.0 · Sprint 1
              </Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------
interface BreadcrumbItem { label: string; path?: string }

function TopBar({
  breadcrumbs,
  onLogout,
  onShowProfile,
}: {
  breadcrumbs: BreadcrumbItem[];
  onLogout: () => void;
  onShowProfile: () => void;
}) {
  const { profile } = useCmsStore();
  const { isDark, theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const firstName = profile?.email?.split('@')[0] ?? 'admin';
  const initials  = firstName.slice(0, 2).toUpperCase();
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Panel';

  const fecha = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });

  return (
    <View
      style={{
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical:   14,
        backgroundColor:   theme.headerBg,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        zIndex:    50,
        elevation: 50,
      }}
    >
      {/* Left: page title + date */}
      <View>
        <Text
          style={{
            color:        theme.text,
            fontSize:     20,
            fontWeight:   '700',
            letterSpacing: -0.4,
            fontFamily:   FONT_FAMILY.heading,
          }}
        >
          {pageTitle}
        </Text>
        <Text
          style={{
            color:     theme.textMuted,
            fontSize:  11,
            fontWeight:'500',
            marginTop: 1,
            textTransform: 'capitalize',
            fontFamily: FONT_FAMILY.body,
          }}
        >
          {fecha}
        </Text>
      </View>

      {/* Right: search + theme toggle + avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems:    'center',
            backgroundColor: theme.surfaceBg,
            borderRadius:    10,
            borderWidth:     1,
            borderColor:     theme.border,
            paddingHorizontal: 12,
            paddingVertical:    8,
            gap: 8,
            minWidth: 170,
          }}
        >
          <FontAwesome name="search" size={11} color={theme.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar..."
            placeholderTextColor={theme.textMuted}
            style={[
              {
                flex:       1,
                color:      theme.text,
                fontSize:   13,
                fontWeight: '500',
                fontFamily: FONT_FAMILY.body,
              },
              // web-only: remove outline ring
              { outlineStyle: 'none' } as any,
            ]}
          />
        </View>

        {/* Dark / Light toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.75}
          style={{
            width:           38,
            height:          38,
            borderRadius:    10,
            backgroundColor: theme.surfaceBg,
            borderWidth:     1,
            borderColor:     theme.border,
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <FontAwesome
            name={isDark ? 'sun-o' : 'moon-o'}
            size={15}
            color={isDark ? theme.accent : theme.textMuted}
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
              backgroundColor: theme.surfaceBg,
              borderRadius:    12,
              borderWidth:     1,
              borderColor:     theme.border,
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
                backgroundColor: theme.accentSoft,
                borderWidth:     1,
                borderColor:     theme.accentBorder,
              }}
            >
              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800' }}>
                {initials}
              </Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>
              {firstName}
            </Text>
            <FontAwesome
              name={menuOpen ? 'chevron-up' : 'chevron-down'}
              size={9}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {menuOpen && (
            <View
              style={{
                position:        'absolute',
                top:             46,
                right:           0,
                minWidth:        160,
                backgroundColor: theme.cardBg,
                borderRadius:    12,
                borderWidth:     1,
                borderColor:     theme.border,
                overflow:        'hidden',
                zIndex:    60,
                elevation: 60,
                shadowColor:   '#000',
                shadowOpacity: 0.25,
                shadowRadius:  16,
                shadowOffset:  { width: 0, height: 8 },
              }}
            >
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); onShowProfile(); }}
                style={{ paddingHorizontal: 14, paddingVertical: 12 }}
              >
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  Perfil
                </Text>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: theme.border }} />
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
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProfileModal
// ---------------------------------------------------------------------------
function ProfileModal({
  visible,
  onClose,
  onLogout,
}: {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const { profile } = useCmsStore();
  if (!profile) return null;

  const displayName = profile.email?.split('@')[0].toUpperCase() ?? 'USUARIO';
  const initials    = displayName.slice(0, 2);

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
    { label: 'Correo electrónico', value: profile.email,                              icon: 'envelope'    },
    { label: 'ID de usuario',      value: profile.id,                                 icon: 'id-badge'    },
    { label: 'Rol',                value: role.label,                                 icon: 'shield'      },
    { label: 'Estado',             value: status.label,                               icon: 'circle'      },
    { label: 'Contrato',           value: profile.contractNumber ?? 'N/A — Interno',  icon: 'file-text-o' },
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

          {/* Info rows */}
          <View style={{ padding: 20 }}>
            <Text
              style={{
                color:         'rgba(255,255,255,0.35)',
                fontSize:      10,
                fontWeight:    '800',
                letterSpacing: 1.5,
                marginBottom:  12,
                fontFamily:    FONT_FAMILY.bodyBold,
              }}
            >
              INFORMACIÓN DE LA CUENTA
            </Text>
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
                    numberOfLines={1}
                  >
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Permissions */}
          {profile.permissions && profile.permissions.length > 0 && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
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
                PERMISOS ASIGNADOS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {profile.permissions.map((p) => (
                  <View
                    key={p}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius:    6,
                      paddingHorizontal: 8,
                      paddingVertical:   4,
                      borderWidth:     1,
                      borderColor:     'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>
                      {p}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={{ padding: 20, paddingTop: 4, gap: 8 }}>
            <TouchableOpacity
              onPress={() => { onClose(); onLogout(); }}
              style={{
                backgroundColor: 'rgba(209,16,90,0.12)',
                borderRadius:    12,
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
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius:    12,
                paddingVertical: 12,
                alignItems:      'center',
                borderWidth:     1,
                borderColor:     'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold }}>
                Cerrar
              </Text>
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
  children:    React.ReactNode;
}

function CmsShellInner({ breadcrumbs, children }: CmsShellProps) {
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
      {/* Yellow radial orbs — dark mode only */}
      {isDark && (
        <>
          <View
            style={{
              position:        'absolute',
              top:             -140,
              left:            -140,
              width:           500,
              height:          500,
              borderRadius:    250,
              backgroundColor: 'rgba(255,198,41,0.08)',
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
              backgroundColor: 'rgba(255,213,77,0.04)',
            }}
            pointerEvents="none"
          />
        </>
      )}

      {/* Sidebar — always dark, hide below 640px */}
      {width >= 640 && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
      )}

      {/* Main content */}
      <View style={{ flex: 1, overflow: 'hidden', zIndex: 1 }}>
        <TopBar
          breadcrumbs={breadcrumbs}
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
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// CmsShell — public export, provides ThemeProvider
// ---------------------------------------------------------------------------
export default function CmsShell({ breadcrumbs, children }: CmsShellProps) {
  return (
    <ThemeProvider>
      <CmsShellInner breadcrumbs={breadcrumbs}>{children}</CmsShellInner>
    </ThemeProvider>
  );
}
