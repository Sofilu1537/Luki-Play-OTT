import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../services/cmsStore';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',        icon: 'th-large',  route: '/cms/dashboard' },
  { label: 'Usuarios',         icon: 'users',     route: '/cms/users'     },
  { label: 'Contratos',        icon: 'file-text', route: '/cms/accounts'  },
  { label: 'Sesiones activas', icon: 'clock-o',   route: '/cms/sessions'  },
  { label: 'Configuración',    icon: 'cog',       route: '/cms/settings', superAdminOnly: true },
];

interface CmsLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Shared CMS layout that renders the sidebar + top header around page content.
 * Used by every CMS screen after login.
 */
export default function CmsPageLayout({ children, title }: CmsLayoutProps) {
  const { cmsUser, cmsLogout } = useCmsStore();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  // Collapse sidebar on narrow screens
  const isWide = Platform.OS === 'web' && width >= 768;

  const handleLogout = () => {
    cmsLogout();
    router.replace('/cms/login' as any);
  };

  const roleLabel = cmsUser?.role === 'SUPERADMIN' ? 'Super Admin' : 'Soporte';
  const roleBadgeColor = cmsUser?.role === 'SUPERADMIN' ? '#7c3aed' : '#0369a1';

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0f172a' }}>
      {/* Sidebar */}
      {isWide && (
        <View style={{
          width: 240, backgroundColor: '#1e293b',
          borderRightWidth: 1, borderRightColor: '#334155',
          paddingTop: 24, paddingBottom: 16,
        }}>
          {/* Logo */}
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, backgroundColor: '#3b82f6', borderRadius: 9,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesome name="shield" size={16} color="#fff" />
              </View>
              <View>
                <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '700' }}>Luki Play</Text>
                <Text style={{ color: '#64748b', fontSize: 11 }}>CMS Panel</Text>
              </View>
            </View>
          </View>

          {/* Nav items */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {NAV_ITEMS.filter(
              (item) => !item.superAdminOnly || cmsUser?.role === 'SUPERADMIN',
            ).map((item) => {
              const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
              return (
                <TouchableOpacity
                  key={item.route}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 20, paddingVertical: 11,
                    marginHorizontal: 8, marginBottom: 2, borderRadius: 8,
                    backgroundColor: isActive ? '#0f172a' : 'transparent',
                  }}
                  onPress={() => router.push(item.route as any)}
                >
                  <FontAwesome
                    name={item.icon as any}
                    size={15}
                    color={isActive ? '#3b82f6' : '#64748b'}
                  />
                  <Text style={{
                    fontSize: 14, fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#f1f5f9' : '#94a3b8',
                  }}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <View style={{
                      marginLeft: 'auto', width: 4, height: 4,
                      borderRadius: 2, backgroundColor: '#3b82f6',
                    }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* User info */}
          <View style={{
            paddingHorizontal: 20, paddingTop: 16,
            borderTopWidth: 1, borderTopColor: '#334155',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesome name="user" size={14} color="#94a3b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f1f5f9', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                  {cmsUser?.email ?? '—'}
                </Text>
                <View style={{
                  alignSelf: 'flex-start', marginTop: 2,
                  backgroundColor: roleBadgeColor, borderRadius: 4,
                  paddingHorizontal: 5, paddingVertical: 1,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                    {roleLabel.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingVertical: 8,
              }}
              onPress={handleLogout}
            >
              <FontAwesome name="sign-out" size={14} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 13 }}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main content */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Top header */}
        <View style={{
          height: 56, flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, backgroundColor: '#1e293b',
          borderBottomWidth: 1, borderBottomColor: '#334155',
          gap: 12,
        }}>
          {/* Mobile hamburger + logo */}
          {!isWide && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 28, height: 28, backgroundColor: '#3b82f6', borderRadius: 7,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesome name="shield" size={12} color="#fff" />
              </View>
              <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: '700' }}>CMS</Text>
            </View>
          )}

          <Text style={{ flex: 1, color: '#f1f5f9', fontSize: 16, fontWeight: '700' }}>
            {title}
          </Text>

          {/* Right side: user + logout (always visible on narrow) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!isWide && (
              <View style={{
                backgroundColor: roleBadgeColor, borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                  {roleLabel.toUpperCase()}
                </Text>
              </View>
            )}
            {!isWide && (
              <TouchableOpacity onPress={handleLogout}>
                <FontAwesome name="sign-out" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mobile bottom nav (narrow screens) */}
        {!isWide && (
          <View style={{
            height: 52, flexDirection: 'row', backgroundColor: '#1e293b',
            borderBottomWidth: 1, borderBottomColor: '#334155',
          }}>
            {NAV_ITEMS.filter(
              (item) => !item.superAdminOnly || cmsUser?.role === 'SUPERADMIN',
            ).map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center',
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
                  }}
                  onPress={() => router.push(item.route as any)}
                >
                  <FontAwesome
                    name={item.icon as any}
                    size={16}
                    color={isActive ? '#3b82f6' : '#64748b'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Page content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
