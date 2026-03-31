import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
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

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'th-large' as const, path: '/cms/dashboard' },
  { label: 'Usuarios', icon: 'users' as const, path: '/cms/users' },
  { label: 'Contratos', icon: 'file-text' as const, path: '/cms/accounts' },
  { label: 'Sesiones', icon: 'lock' as const, path: '/cms/sessions' },
];

// ---------------------------------------------------------------------------
// Mock data — replace with real API calls once users endpoint is available
// ---------------------------------------------------------------------------

interface UserRow {
  id: string;
  email: string;
  role: 'CLIENTE' | 'SOPORTE' | 'SUPERADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  contractNumber: string | null;
  createdAt: string;
}

const MOCK_USERS: UserRow[] = [
  { id: 'usr-001', email: 'juan@example.com', role: 'CLIENTE', status: 'ACTIVE', contractNumber: 'CONTRACT-001', createdAt: '2024-01-15' },
  { id: 'usr-002', email: 'maria@example.com', role: 'CLIENTE', status: 'ACTIVE', contractNumber: 'CONTRACT-002', createdAt: '2024-01-20' },
  { id: 'usr-003', email: 'carlos@example.com', role: 'CLIENTE', status: 'ACTIVE', contractNumber: 'CONTRACT-003', createdAt: '2024-02-01' },
  { id: 'usr-004', email: 'ana@example.com', role: 'CLIENTE', status: 'ACTIVE', contractNumber: 'CONTRACT-004', createdAt: '2024-02-10' },
  { id: 'usr-ott-001', email: 'pedro@example.com', role: 'CLIENTE', status: 'ACTIVE', contractNumber: 'OTT-000001', createdAt: '2024-03-05' },
  { id: 'usr-admin-001', email: 'admin@lukiplay.com', role: 'SUPERADMIN', status: 'ACTIVE', contractNumber: null, createdAt: '2024-01-01' },
  { id: 'usr-soporte-001', email: 'soporte@lukiplay.com', role: 'SOPORTE', status: 'ACTIVE', contractNumber: null, createdAt: '2024-01-01' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
  CLIENTE: '#0EA5E9',
  SOPORTE: '#F59E0B',
  SUPERADMIN: '#6D28D9',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22C55E',
  INACTIVE: '#64748B',
  SUSPENDED: '#F87171',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? '#64748B';
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: `${color}55`,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{role}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#64748B';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{status}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

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
              <FontAwesome name={item.icon} size={16} color={active ? 'white' : TEXT_MUTED} style={{ width: 22 }} />
              <Text style={{ color: active ? 'white' : '#CBD5E1', fontWeight: active ? '700' : '500', fontSize: 14, marginLeft: 10 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 8, borderRadius: 10 }}
        onPress={onLogout}
      >
        <FontAwesome name="sign-out" size={16} color="#F87171" style={{ width: 22 }} />
        <Text style={{ color: '#F87171', fontWeight: '600', fontSize: 14, marginLeft: 10 }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * CMS Users screen.
 *
 * Displays all registered users in a filterable table.
 * Supports filtering by role and searching by email or contract number.
 * Redirects unauthenticated users to /cms/login.
 */
export default function CmsUsers() {
  const { profile, logout } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

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

  const roles = ['ALL', 'CLIENTE', 'SOPORTE', 'SUPERADMIN'];

  const filtered = MOCK_USERS.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.contractNumber ?? '').toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: BG }}>
      {showSidebar && <Sidebar onLogout={handleLogout} />}

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: BORDER,
          }}
        >
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Usuarios</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {!showSidebar && (
            <TouchableOpacity onPress={handleLogout}>
              <FontAwesome name="sign-out" size={18} color="#F87171" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          {/* Search */}
          <View
            style={{
              backgroundColor: SURFACE,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: BORDER,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              marginBottom: 12,
            }}
          >
            <FontAwesome name="search" size={14} color={TEXT_MUTED} />
            <TextInput
              style={{
                flex: 1,
                color: 'white',
                paddingVertical: 10,
                paddingHorizontal: 10,
                fontSize: 14,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              placeholder="Buscar por email o contrato..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <FontAwesome name="times" size={14} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {/* Role filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: roleFilter === r ? ACCENT : SURFACE,
                    borderWidth: 1,
                    borderColor: roleFilter === r ? ACCENT : BORDER,
                  }}
                  onPress={() => setRoleFilter(r)}
                >
                  <Text
                    style={{
                      color: roleFilter === r ? 'white' : '#CBD5E1',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {r === 'ALL' ? 'Todos' : r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Table */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* Header row */}
          <View
            style={{
              flexDirection: 'row',
              paddingVertical: 10,
              paddingHorizontal: 14,
              backgroundColor: '#0F172A',
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 2.5, letterSpacing: 0.5 }}>
              EMAIL
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1.5, letterSpacing: 0.5 }}>
              ROL
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1.5, letterSpacing: 0.5 }}>
              CONTRATO
            </Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1, letterSpacing: 0.5 }}>
              ESTADO
            </Text>
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <FontAwesome name="user-times" size={36} color={TEXT_MUTED} />
              <Text style={{ color: TEXT_MUTED, fontSize: 15, marginTop: 14 }}>Sin resultados</Text>
            </View>
          ) : (
            filtered.map((user) => (
              <View
                key={user.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  backgroundColor: SURFACE,
                  borderRadius: 12,
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: BORDER,
                }}
              >
                <View style={{ flex: 2.5 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 2 }}>
                    ID: {user.id}
                  </Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <RoleBadge role={user.role} />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                    {user.contractNumber ?? '—'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <StatusBadge status={user.status} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
