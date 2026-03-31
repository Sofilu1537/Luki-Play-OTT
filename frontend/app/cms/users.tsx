import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const BG = '#0F172A';
const SURFACE = '#1E293B';
const ACCENT = '#6D28D9';
const TEXT = '#F1F5F9';
const MUTED = '#94A3B8';
const BORDER = '#334155';

const ROLE_COLORS: Record<string, string> = {
  superadmin: '#A78BFA',
  soporte: '#38BDF8',
  cliente: '#34D399',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#34D399',
  inactive: '#9CA3AF',
  suspended: '#F87171',
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? '#94A3B8';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{role}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#94A3B8';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

/**
 * CMS Users screen.
 *
 * Displays all users in a searchable, filterable table.
 * Supports filtering by role.
 */
export default function CmsUsers() {
  const router = useRouter();
  const { admin, users, isLoading, error, fetchUsers } = useCmsStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (!admin) { router.replace('/cms/login'); return; }
    fetchUsers();
  }, [admin]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.contractNumber ?? '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  if (!admin) return null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: '800' }}>Usuarios</Text>
          <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
            {filtered.length} de {users.length} usuarios
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchUsers}
          style={{ backgroundColor: SURFACE, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BORDER }}
        >
          <FontAwesome name="refresh" size={15} color={MUTED} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <View style={{
          flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center',
          backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
          paddingHorizontal: 12,
        }}>
          <FontAwesome name="search" size={14} color={MUTED} />
          <TextInput
            style={{ flex: 1, color: TEXT, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14 }}
            placeholder="Buscar por email, contrato o ID..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {['all', 'cliente', 'soporte', 'superadmin'].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRoleFilter(r)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                backgroundColor: roleFilter === r ? ACCENT : SURFACE,
                borderWidth: 1, borderColor: roleFilter === r ? ACCENT : BORDER,
              }}
            >
              <Text style={{ color: roleFilter === r ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: '600' }}>
                {r === 'all' ? 'Todos' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && (
        <View style={{ marginHorizontal: 20, backgroundColor: '#7F1D1D33', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <Text style={{ color: '#F87171', fontSize: 14 }}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Table header */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: BORDER,
          }}>
            {['Email / ID', 'Contrato', 'Rol', 'Estado'].map((h, i) => (
              <Text key={h} style={{
                color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                flex: i === 0 ? 2 : 1,
              }}>{h.toUpperCase()}</Text>
            ))}
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: MUTED }}>No se encontraron usuarios</Text>
            </View>
          ) : (
            filtered.map((user, idx) => (
              <View
                key={user.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 14, paddingVertical: 14,
                  backgroundColor: idx % 2 === 0 ? 'transparent' : SURFACE + '66',
                  borderRadius: 8,
                }}
              >
                <View style={{ flex: 2 }}>
                  <Text style={{ color: TEXT, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                    {user.id}
                  </Text>
                </View>
                <Text style={{ color: MUTED, fontSize: 13, flex: 1 }} numberOfLines={1}>
                  {user.contractNumber ?? '—'}
                </Text>
                <View style={{ flex: 1 }}>
                  <RoleBadge role={user.role} />
                </View>
                <View style={{ flex: 1 }}>
                  <StatusBadge status={user.status} />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
