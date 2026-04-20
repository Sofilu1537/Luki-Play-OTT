import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { C } from '../CmsShell';
import { ROLE_META } from './types';
import CmsUserFormModal from './CmsUserFormModal';
import CmsUserDetailModal from './CmsUserDetailModal';
import {
  adminListCmsUsers,
  adminCreateCmsUser,
  adminUpdateCmsUserPermissions,
  adminDeleteUser,
} from '../../../services/api/adminApi';
import type { AdminUser, CmsUserPayload } from '../../../services/api/adminApi';
import { useCmsStore } from '../../../services/cmsStore';

export default function CmsUsersTab() {
  const { accessToken } = useCmsStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await adminListCmsUsers(accessToken);
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.nombre.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCreate = async (data: {
    nombre: string;
    email: string;
    phone?: string;
    role: 'admin' | 'soporte';
    permissions: string[];
  }) => {
    if (!accessToken) return;
    await adminCreateCmsUser(accessToken, {
      nombre: data.nombre,
      email: data.email,
      telefono: data.phone,
      role: data.role,
      permissions: data.permissions,
    });
    await loadUsers();
  };

  const handleSavePermissions = async (userId: string, permissions: string[]) => {
    if (!accessToken) return;
    await adminUpdateCmsUserPermissions(accessToken, userId, permissions);
    await loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!accessToken) return;
    await adminDeleteUser(accessToken, userId);
    await loadUsers();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Toolbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10 }}>
          <FontAwesome name="search" size={13} color={C.muted} />
          <TextInput
            style={{ flex: 1, color: C.text, fontSize: 13, paddingVertical: 8, paddingHorizontal: 8, ...webInput }}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={C.muted}
          />
        </View>

        {/* Role filter pills */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[{ key: 'all', label: 'Todos' }, { key: 'superadmin', label: 'Super Admin' }, { key: 'admin', label: 'Admin' }, { key: 'soporte', label: 'Soporte' }].map((f) => {
            const active = roleFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setRoleFilter(f.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: active ? C.accentSoft : C.lift,
                  borderWidth: 1,
                  borderColor: active ? C.accent : C.border,
                }}
              >
                <Text style={{ color: active ? C.accent : C.textSec, fontSize: 12, fontWeight: '700' }}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => { setEditUser(null); setFormVisible(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.accent }}
        >
          <FontAwesome name="plus" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Crear usuario</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: C.roseSoft, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: C.rose, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {/* Table */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <FontAwesome name="users" size={32} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>No se encontraron usuarios CMS.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={hdr(3)}>Nombre</Text>
            <Text style={hdr(2.5)}>Email</Text>
            <Text style={hdr(1)}>Rol</Text>
            <Text style={hdr(1)}>Estado</Text>
            <Text style={hdr(0.8)}>Permisos</Text>
            <Text style={hdr(0.7)}>Acciones</Text>
          </View>

          {filtered.map((user) => {
            const meta = ROLE_META[user.role];
            return (
              <TouchableOpacity
                key={user.id}
                onPress={() => setDetailUser(user)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border }}
              >
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: meta ? `${meta.color}18` : C.lift, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name={meta?.icon ?? 'user'} size={13} color={meta?.color ?? C.accent} />
                  </View>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{user.nombre}</Text>
                </View>
                <Text style={{ flex: 2.5, color: C.textSec, fontSize: 12 }} numberOfLines={1}>{user.email}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: meta ? `${meta.color}18` : C.lift }}>
                    <Text style={{ color: meta?.color ?? C.accent, fontSize: 11, fontWeight: '700' }}>{meta?.label ?? user.role}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{
                    alignSelf: 'flex-start',
                    borderRadius: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    backgroundColor: user.status === 'active' ? 'rgba(16,185,129,0.14)' : C.roseSoft,
                  }}>
                    <Text style={{ color: user.status === 'active' ? '#10B981' : C.rose, fontSize: 11, fontWeight: '700' }}>
                      {user.status === 'active' ? 'Activo' : user.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ flex: 0.8, color: C.textSec, fontSize: 12 }}>{user.permissions?.length ?? 0}</Text>
                <View style={{ flex: 0.7, flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => { setEditUser(user); setFormVisible(true); }}>
                    <FontAwesome name="pencil" size={13} color={C.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDetailUser(user)}>
                    <FontAwesome name="eye" size={13} color={C.textSec} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modals */}
      <CmsUserFormModal
        visible={formVisible}
        initialData={editUser}
        onClose={() => { setFormVisible(false); setEditUser(null); }}
        onSave={handleCreate}
      />
      <CmsUserDetailModal
        visible={!!detailUser}
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onSavePermissions={handleSavePermissions}
        onDelete={handleDelete}
      />
    </View>
  );
}

function hdr(flex: number) {
  return { flex, color: C.muted, fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 };
}
