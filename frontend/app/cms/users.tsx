import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, MockUser, UserRole } from '../../services/cmsStore';
import CmsPageLayout from '../../components/CmsPageLayout';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const ROLE_FILTERS: { label: string; value: UserRole | 'ALL' }[] = [
  { label: 'Todos',      value: 'ALL'        },
  { label: 'Cliente',    value: 'CLIENT'     },
  { label: 'Soporte',    value: 'SUPPORT'    },
  { label: 'SuperAdmin', value: 'SUPERADMIN' },
];

const ROLE_BADGE: Record<UserRole, { bg: string; text: string }> = {
  CLIENT:     { bg: '#065f46', text: '#6ee7b7' },
  SUPPORT:    { bg: '#1e3a5f', text: '#93c5fd' },
  SUPERADMIN: { bg: '#4c1d95', text: '#c4b5fd' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const c = ROLE_BADGE[role];
  return (
    <View style={{
      alignSelf: 'flex-start', backgroundColor: c.bg,
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    }}>
      <Text style={{ color: c.text, fontSize: 10, fontWeight: '700' }}>{role}</Text>
    </View>
  );
}

/**
 * CMS Users list screen.
 *
 * Displays a searchable, filterable table of all users.
 * Data is currently mocked — replace `mockUsers` with an API call when ready.
 */
export default function CmsUsers() {
  const { isAuthenticated, mockUsers } = useCmsStore();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const filtered = mockUsers.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <CmsPageLayout title="Usuarios">
      {/* Filters row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {/* Search */}
        <View style={{
          flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#1e293b', borderRadius: 8,
          borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12,
        }}>
          <FontAwesome name="search" size={13} color="#475569" style={{ marginRight: 8 }} />
          <TextInput
            style={{
              flex: 1, color: '#f1f5f9', paddingVertical: 10, fontSize: 14,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
            }}
            placeholder="Buscar por email..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={13} color="#475569" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Role filter buttons */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {ROLE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                backgroundColor: roleFilter === f.value ? '#3b82f6' : '#1e293b',
                borderWidth: 1, borderColor: roleFilter === f.value ? '#3b82f6' : '#334155',
              }}
              onPress={() => setRoleFilter(f.value)}
            >
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: roleFilter === f.value ? '#fff' : '#94a3b8',
              }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Result count */}
      <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>
        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* Table */}
      <View style={{
        backgroundColor: '#1e293b', borderRadius: 12,
        borderWidth: 1, borderColor: '#334155', overflow: 'hidden',
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: '#0f172a',
        }}>
          <Text style={[colStyle.id,    headerStyle]}>ID</Text>
          <Text style={[colStyle.email, headerStyle]}>EMAIL</Text>
          <Text style={[colStyle.role,  headerStyle]}>ROL</Text>
          <Text style={[colStyle.phone, headerStyle]}>TELÉFONO</Text>
          <Text style={[colStyle.date,  headerStyle]}>CREADO</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <FontAwesome name="search" size={24} color="#334155" />
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>Sin resultados</Text>
          </View>
        ) : (
          filtered.map((user, idx) => (
            <UserRow key={user.id} user={user} idx={idx} />
          ))
        )}
      </View>
    </CmsPageLayout>
  );
}

function UserRow({ user, idx }: { user: MockUser; idx: number }) {
  return (
    <View style={{
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#334155',
      alignItems: 'center',
    }}>
      <Text style={[colStyle.id,    cellStyle]}>{user.id}</Text>
      <Text style={[colStyle.email, cellStyle]} numberOfLines={1}>{user.email}</Text>
      <View style={colStyle.role}>
        <RoleBadge role={user.role} />
      </View>
      <Text style={[colStyle.phone, cellStyle]}>{user.phone ?? '—'}</Text>
      <Text style={[colStyle.date,  cellStyle]}>{user.createdAt}</Text>
    </View>
  );
}

const headerStyle = { color: '#475569', fontSize: 10, fontWeight: '700' as const };
const cellStyle   = { color: '#cbd5e1', fontSize: 13 };

const colStyle = {
  id:    { flex: 1 },
  email: { flex: 2.5 },
  role:  { flex: 1.5 },
  phone: { flex: 1.5 },
  date:  { flex: 1 },
};
