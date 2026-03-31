import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../../services/cmsStore';
import type { CmsUser, UserRole } from '../../services/api/cmsApi';

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, { bg: string; text: string; label: string }> = {
  SUPERADMIN: { bg: '#1E1B4B', text: '#A5B4FC', label: 'Super Admin' },
  SUPPORT:    { bg: '#1E3A5F', text: '#60A5FA', label: 'Soporte' },
  CLIENT:     { bg: '#052E16', text: '#34D399', label: 'Cliente' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_COLORS[role] ?? { bg: '#1F2937', text: '#9CA3AF', label: role };
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>
        {c.label}
      </Text>
    </View>
  );
}

// ─── Users screen ─────────────────────────────────────────────────────────────

/**
 * CMS Users screen.
 *
 * Displays all platform users in a table with:
 * - Full-text search by email
 * - Role filter (ALL / CLIENT / SUPPORT / SUPERADMIN)
 * - Color-coded role badges
 *
 * Route protection: redirects to /cms/login when not authenticated.
 */
export default function CmsUsers() {
  const router = useRouter();
  const { user, users, loadData, logout } = useCmsStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  useEffect(() => {
    if (!user) router.replace('/cms/login' as never);
  }, [user]);

  useEffect(() => {
    if (users.length === 0) loadData();
  }, []);

  if (!user) return null;

  // ── Filtering ────────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/cms/login' as never);
  };

  const ROLE_FILTERS: Array<{ value: UserRole | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'CLIENT', label: 'Clientes' },
    { value: 'SUPPORT', label: 'Soporte' },
    { value: 'SUPERADMIN', label: 'Super Admin' },
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0F172A' }}>
      {/* Sidebar — inline mini version */}
      <CmsSidebar role={user.role} activeKey="users" onLogout={handleLogout} />

      {/* Main content */}
      <View style={{ flex: 1 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/cms/dashboard' as never)}>
              <FontAwesome name="chevron-left" size={14} color="#64748B" />
            </TouchableOpacity>
            <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '700' }}>
              Usuarios
            </Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            {filtered.length} de {users.length}
          </Text>
        </View>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1E293B',
          }}
        >
          {/* Search */}
          <View
            style={{
              flex: 1,
              minWidth: 200,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1E293B',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#334155',
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <FontAwesome name="search" size={13} color="#475569" />
            <TextInput
              style={{
                flex: 1,
                color: '#F1F5F9',
                paddingVertical: 10,
                fontSize: 14,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              placeholder="Buscar por email..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <FontAwesome name="times" size={13} color="#475569" />
              </TouchableOpacity>
            )}
          </View>

          {/* Role filter pills */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {ROLE_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => setRoleFilter(f.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor:
                    roleFilter === f.value ? '#2563EB' : '#1E293B',
                  borderWidth: 1,
                  borderColor:
                    roleFilter === f.value ? '#2563EB' : '#334155',
                }}
              >
                <Text
                  style={{
                    color: roleFilter === f.value ? '#fff' : '#94A3B8',
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Table */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#334155',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#334155',
                backgroundColor: '#0F172A',
              }}
            >
              {['Email', 'Rol', 'Estado', 'Registrado'].map((col, i) => (
                <Text
                  key={col}
                  style={{
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    flex: i === 0 ? 2 : 1,
                  }}
                >
                  {col.toUpperCase()}
                </Text>
              ))}
            </View>

            {/* Rows */}
            {filtered.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <FontAwesome name="user-times" size={32} color="#334155" />
                <Text
                  style={{
                    color: '#475569',
                    marginTop: 12,
                    fontSize: 14,
                  }}
                >
                  No se encontraron usuarios
                </Text>
              </View>
            ) : (
              filtered.map((u: CmsUser, idx) => (
                <UserRow
                  key={u.id}
                  user={u}
                  isLast={idx === filtered.length - 1}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

function UserRow({ user, isLast }: { user: CmsUser; isLast: boolean }) {
  const date = new Date(user.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#334155',
      }}
    >
      {/* Email */}
      <View
        style={{
          flex: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#0F172A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name="user" size={13} color="#475569" />
        </View>
        <Text
          style={{ color: '#F1F5F9', fontSize: 13 }}
          numberOfLines={1}
        >
          {user.email ?? '—'}
        </Text>
      </View>

      {/* Role */}
      <View style={{ flex: 1 }}>
        <RoleBadge role={user.role} />
      </View>

      {/* Status */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: user.status === 'ACTIVE' ? '#064E3B' : '#1F2937',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
            alignSelf: 'flex-start',
          }}
        >
          <Text
            style={{
              color: user.status === 'ACTIVE' ? '#34D399' : '#9CA3AF',
              fontSize: 11,
              fontWeight: '700',
            }}
          >
            {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* Created at */}
      <Text style={{ color: '#64748B', fontSize: 12, flex: 1 }}>
        {date}
      </Text>
    </View>
  );
}

// ─── Reusable mini sidebar (shared across CMS screens) ────────────────────────

interface CmsSidebarProps {
  role: string;
  activeKey: string;
  onLogout: () => void;
}

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'th-large' as const, route: '/cms/dashboard' },
  { key: 'users',     label: 'Usuarios',  icon: 'users' as const,    route: '/cms/users' },
  { key: 'accounts',  label: 'Contratos', icon: 'file-text-o' as const, route: '/cms/accounts' },
  { key: 'sessions',  label: 'Sesiones',  icon: 'exchange' as const, route: '/cms/sessions' },
];

function CmsSidebar({ role: _role, activeKey, onLogout }: CmsSidebarProps) {
  const router = useRouter();

  const items = SIDEBAR_ITEMS;

  return (
    <View
      style={{
        width: 56,
        backgroundColor: '#1E293B',
        borderRightWidth: 1,
        borderRightColor: '#334155',
        paddingTop: 20,
        paddingBottom: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo icon */}
      <View>
        <View
          style={{
            width: 34,
            height: 34,
            backgroundColor: '#2563EB',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <FontAwesome name="play" size={13} color="#fff" />
        </View>

        {/* Nav icons */}
        <View style={{ gap: 4 }}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => router.push(item.route as never)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                backgroundColor: activeKey === item.key ? '#2563EB' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesome
                name={item.icon}
                size={15}
                color={activeKey === item.key ? '#fff' : '#64748B'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={onLogout}
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: '#0F172A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name="sign-out" size={15} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}
