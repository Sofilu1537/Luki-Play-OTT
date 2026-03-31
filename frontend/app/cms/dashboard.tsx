import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../../services/cmsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  route: string;
  superadminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'th-large', route: '/cms/dashboard' },
  { key: 'users', label: 'Usuarios', icon: 'users', route: '/cms/users' },
  { key: 'accounts', label: 'Contratos', icon: 'file-text-o', route: '/cms/accounts' },
  { key: 'sessions', label: 'Sesiones', icon: 'exchange', route: '/cms/sessions' },
  { key: 'config', label: 'Configuración', icon: 'cog', route: '/cms/dashboard', superadminOnly: true },
];

// ─── Sidebar component ────────────────────────────────────────────────────────

interface SidebarProps {
  activeKey: string;
  role: string;
  userName: string;
  onNavigate: (item: NavItem) => void;
  onLogout: () => void;
  collapsed?: boolean;
}

function Sidebar({
  activeKey,
  role,
  userName,
  onNavigate,
  onLogout,
  collapsed = false,
}: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superadminOnly || role === 'SUPERADMIN',
  );

  return (
    <View
      style={{
        width: collapsed ? 64 : 220,
        backgroundColor: '#1E293B',
        borderRightWidth: 1,
        borderRightColor: '#334155',
        paddingTop: 24,
        paddingBottom: 16,
        justifyContent: 'space-between',
      }}
    >
      {/* Top: Logo + nav */}
      <View>
        {/* Logo */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 28,
            gap: 10,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#2563EB',
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FontAwesome name="play" size={14} color="#fff" />
          </View>
          {!collapsed && (
            <View>
              <Text
                style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '800' }}
              >
                Luki Play
              </Text>
              <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600' }}>
                CMS Panel
              </Text>
            </View>
          )}
        </View>

        {/* Nav items */}
        <View style={{ gap: 2, paddingHorizontal: 8 }}>
          {visibleItems.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => onNavigate(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  gap: 10,
                  backgroundColor: isActive ? '#2563EB' : 'transparent',
                }}
              >
                <FontAwesome
                  name={item.icon}
                  size={15}
                  color={isActive ? '#fff' : '#64748B'}
                />
                {!collapsed && (
                  <Text
                    style={{
                      color: isActive ? '#fff' : '#94A3B8',
                      fontSize: 14,
                      fontWeight: isActive ? '700' : '500',
                    }}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom: user info + logout */}
      <View style={{ paddingHorizontal: 8 }}>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: '#334155',
            paddingTop: 12,
            gap: 8,
          }}
        >
          {!collapsed && (
            <View style={{ paddingHorizontal: 8 }}>
              <Text
                style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '600' }}
                numberOfLines={1}
              >
                {userName}
              </Text>
              <Text style={{ color: '#64748B', fontSize: 11 }}>
                {role === 'SUPERADMIN' ? 'Super Admin' : 'Soporte'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: '#0F172A',
            }}
          >
            <FontAwesome name="sign-out" size={15} color="#EF4444" />
            {!collapsed && (
              <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                Cerrar sesión
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  subtitle?: string;
}

function SummaryCard({ title, value, icon, color, subtitle }: SummaryCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: '#334155',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <Text
          style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', flex: 1 }}
        >
          {title}
        </Text>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name={icon} size={16} color={color} />
        </View>
      </View>
      <Text
        style={{
          color: '#F1F5F9',
          fontSize: 28,
          fontWeight: '800',
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      {!!subtitle && (
        <Text style={{ color: '#64748B', fontSize: 11 }}>{subtitle}</Text>
      )}
    </View>
  );
}

// ─── Dashboard screen ─────────────────────────────────────────────────────────

/**
 * CMS Dashboard.
 *
 * Main landing screen after CMS login. Shows summary stats and provides
 * sidebar navigation to other CMS sections.
 *
 * Route protection: redirects to /cms/login when user is not authenticated.
 */
export default function CmsDashboard() {
  const router = useRouter();
  const { user, users, accounts, sessions, logout, loadData } =
    useCmsStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.replace('/cms/login' as never);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // ── Computed stats ──────────────────────────────────────────────────────────

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const activeSessions = sessions.filter((s) => !s.revokedAt).length;
  const ispAccounts = accounts.filter((a) => a.contractType === 'ISP').length;
  const ottAccounts = accounts.filter((a) => a.contractType === 'OTT_ONLY').length;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNavigate = (item: NavItem) => {
    setActiveRoute(item.key);
    router.push(item.route as never);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/cms/login' as never);
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0F172A' }}>
      {/* Sidebar */}
      <Sidebar
        activeKey="dashboard"
        role={user.role}
        userName={user.email}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed && isWeb}
      />

      {/* Main content */}
      <View style={{ flex: 1, flexDirection: 'column' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: '#1E293B',
            borderBottomWidth: 1,
            borderBottomColor: '#334155',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {isWeb && (
              <TouchableOpacity onPress={() => setSidebarCollapsed((v) => !v)}>
                <FontAwesome name="bars" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
            <Text
              style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '700' }}
            >
              Dashboard
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: '#334155',
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                {user.role === 'SUPERADMIN' ? '🔑 Super Admin' : '🛠 Soporte'}
              </Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, gap: 24 }}
        >
          {/* Welcome */}
          <View>
            <Text
              style={{ color: '#F1F5F9', fontSize: 22, fontWeight: '800' }}
            >
              Bienvenido, {user.email.split('@')[0]}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
              Resumen general de la plataforma Luki Play
            </Text>
          </View>

          {/* Summary cards */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <SummaryCard
              title="Total Usuarios"
              value={totalUsers}
              icon="users"
              color="#3B82F6"
              subtitle="Registrados en la plataforma"
            />
            <SummaryCard
              title="Usuarios Activos"
              value={activeUsers}
              icon="user-circle-o"
              color="#10B981"
              subtitle={`${totalUsers - activeUsers} inactivos`}
            />
            <SummaryCard
              title="Sesiones Activas"
              value={activeSessions}
              icon="exchange"
              color="#F59E0B"
              subtitle="En este momento"
            />
            <SummaryCard
              title="Contratos ISP"
              value={ispAccounts}
              icon="wifi"
              color="#8B5CF6"
              subtitle={`${ottAccounts} OTT-only`}
            />
          </View>

          {/* Quick actions */}
          <View>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 12,
              }}
            >
              ACCESO RÁPIDO
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: 'Ver Usuarios', route: '/cms/users', icon: 'users' as const, color: '#3B82F6' },
                { label: 'Ver Contratos', route: '/cms/accounts', icon: 'file-text-o' as const, color: '#10B981' },
                { label: 'Ver Sesiones', route: '/cms/sessions', icon: 'exchange' as const, color: '#F59E0B' },
              ].map((action) => (
                <TouchableOpacity
                  key={action.route}
                  onPress={() => router.push(action.route as never)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#1E293B',
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: '#334155',
                  }}
                >
                  <FontAwesome name={action.icon} size={14} color={action.color} />
                  <Text
                    style={{
                      color: '#F1F5F9',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent accounts */}
          <View>
            <Text
              style={{
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.8,
                marginBottom: 12,
              }}
            >
              CONTRATOS RECIENTES
            </Text>
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#334155',
                overflow: 'hidden',
              }}
            >
              {accounts.slice(0, 5).map((account, idx) => (
                <View
                  key={account.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: idx < 4 ? 1 : 0,
                    borderBottomColor: '#334155',
                    gap: 12,
                  }}
                >
                  <Text
                    style={{ color: '#94A3B8', fontSize: 12, width: 100 }}
                    numberOfLines={1}
                  >
                    {account.contractNumber}
                  </Text>
                  <Text
                    style={{ color: '#64748B', fontSize: 11, width: 60 }}
                  >
                    {account.contractType}
                  </Text>
                  <StatusBadge status={account.serviceStatus} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVO:    { bg: '#064E3B', text: '#34D399' },
  CORTESIA:  { bg: '#1E3A5F', text: '#60A5FA' },
  PENDIENTE: { bg: '#451A03', text: '#FCD34D' },
  SUSPENDIDO:{ bg: '#7F1D1D', text: '#FCA5A5' },
  ANULADO:   { bg: '#1F2937', text: '#9CA3AF' },
  CORTADO:   { bg: '#4C0519', text: '#FDA4AF' },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#1F2937', text: '#9CA3AF' };
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
        {status}
      </Text>
    </View>
  );
}
