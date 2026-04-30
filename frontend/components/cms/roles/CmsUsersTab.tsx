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
import { useTheme } from '../../../hooks/useTheme';
import { ROLE_META } from './types';
import CmsUserFormModal from './CmsUserFormModal';
import CmsUserDetailModal from './CmsUserDetailModal';
import {
  adminListCmsUsers,
  adminCreateCmsUser,
  adminUpdateUser,
  adminUpdateUserStatus,
  adminDeleteUser,
} from '../../../services/api/adminApi';
import type { AdminUser } from '../../../services/api/adminApi';
import { useCmsStore } from '../../../services/cmsStore';
import { FONT_FAMILY } from '../../../styles/typography';

function hasPermission(perms: string[] | undefined | null, key: string): boolean {
  if (!perms) return false;
  return (
    perms.includes('cms:*') ||
    perms.includes(key) ||
    perms.some((p) => p !== 'cms:*' && key.startsWith(p + ':'))
  );
}

const ROLE_FILTERS = [
  { key: 'all',        label: 'Todos'      },
  { key: 'superadmin', label: 'Super Admin' },
  { key: 'admin',      label: 'Admin'      },
  { key: 'soporte',    label: 'Soporte'    },
] as const;

export default function CmsUsersTab() {
  const { isDark, theme } = useTheme();
  const { accessToken, profile } = useCmsStore();
  const isSuperAdmin = profile?.role === 'superadmin';
  const canWrite     = isSuperAdmin || hasPermission(profile?.permissions, 'cms:users:write');

  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState<string>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editUser,    setEditUser]    = useState<AdminUser | null>(null);
  const [detailUser,  setDetailUser]  = useState<AdminUser | null>(null);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [error,       setError]       = useState('');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await adminListCmsUsers(accessToken);
      setUsers(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Stats ─────────────────────────────────────────────────
  const total    = users.length;
  const active   = users.filter((u) => u.status === 'active').length;
  const admins   = users.filter((u) => u.role === 'admin').length;
  const soportes = users.filter((u) => u.role === 'soporte').length;

  // ── Filtrado ───────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch = !search
      || u.nombre.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Handlers ───────────────────────────────────────────────
  const handleSave = async (data: {
    nombre: string;
    email: string;
    phone?: string;
    role: 'admin' | 'soporte';
    permissions: string[];
  }) => {
    if (!accessToken) return;
    if (editUser) {
      await adminUpdateUser(accessToken, editUser.id, {
        nombre:    data.nombre,
        firstName: data.nombre.split(' ')[0] ?? data.nombre,
        lastName:  data.nombre.split(' ').slice(1).join(' ') || '',
        email:     data.email,
        telefono:  data.phone,
        role:      editUser.role,
        status:    editUser.status,
      } as any);
    } else {
      await adminCreateCmsUser(accessToken, {
        nombre:   data.nombre,
        email:    data.email,
        telefono: data.phone,
        role:     data.role,
      });
    }
    await loadUsers();
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (!accessToken || !canWrite) return;
    try {
      const next = user.status === 'active' ? 'inactive' : 'active';
      await adminUpdateUserStatus(accessToken, user.id, next as AdminUser['status']);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!accessToken || !canWrite) return;
    setDeletingId(userId);
    try {
      await adminDeleteUser(accessToken, userId);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
      setDetailUser(null);
    }
  };

  function hdr(flex: number) {
    return {
      flex,
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 0.8,
      fontFamily: FONT_FAMILY.bodyBold,
    };
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>

      {/* ── Aviso solo lectura ── */}
      {!canWrite && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          margin: 16, marginBottom: 0,
          backgroundColor: isDark ? 'rgba(255,184,0,0.08)' : 'rgba(255,184,0,0.10)',
          borderRadius: 10, padding: 12, borderWidth: 1,
          borderColor: 'rgba(255,184,0,0.25)',
        }}>
          <FontAwesome name="lock" size={13} color="#FFB800" />
          <Text style={{ color: isDark ? '#FFB800' : '#8a6000', fontSize: 12, fontFamily: FONT_FAMILY.body, flex: 1 }}>
            Solo usuarios con permiso de escritura pueden crear, editar o cambiar el estado de usuarios CMS.
          </Text>
        </View>
      )}

      {/* ── Stats bar ── */}
      <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total usuarios', value: total,    icon: 'users'   as const, color: theme.accent       },
          { label: 'Activos',        value: active,   icon: 'circle'  as const, color: '#10B981'          },
          { label: 'Admin',          value: admins,   icon: 'user'    as const, color: ROLE_META.admin?.color   ?? theme.accent },
          { label: 'Soporte',        value: soportes, icon: 'headphones' as const, color: ROLE_META.soporte?.color ?? theme.accent },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flex: 1, minWidth: 100,
              backgroundColor: isDark ? theme.cardBg : '#FFFFFF',
              borderRadius: 10, padding: 12,
              borderWidth: 1,
              borderColor: isDark ? theme.border : 'rgba(130,130,130,0.20)',
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${s.color}18`, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name={s.icon} size={13} color={s.color} />
            </View>
            <View>
              <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>{s.value}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONT_FAMILY.body }}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Error ── */}
      {error ? (
        <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: theme.dangerSoft, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {/* ── Toolbar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 10, flexWrap: 'wrap' }}>
        {/* Search */}
        <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)', borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', paddingHorizontal: 10 }}>
          <FontAwesome name="search" size={12} color={theme.textMuted} />
          <TextInput
            style={{ flex: 1, color: isDark ? theme.text : '#240046', fontSize: 13, paddingVertical: 8, paddingHorizontal: 8, fontFamily: FONT_FAMILY.body, ...webInput }}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o email..."
            placeholderTextColor={theme.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={13} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Role filter pills */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {ROLE_FILTERS.map((f) => {
            const active = roleFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setRoleFilter(f.key)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                  backgroundColor: active ? theme.accentSoft : (isDark ? theme.liftBg : 'rgba(255,255,255,0.8)'),
                  borderWidth: 1,
                  borderColor: active ? theme.accent : (isDark ? theme.border : 'rgba(130,130,130,0.26)'),
                }}
              >
                <Text style={{ color: active ? theme.accent : theme.textSec, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Crear usuario */}
        {canWrite && (
          <TouchableOpacity
            onPress={() => { setEditUser(null); setFormVisible(true); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.accent }}
          >
            <FontAwesome name="plus" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold }}>Nuevo usuario</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabla ── */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: theme.liftBg, alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome name="users" size={24} color={theme.textMuted} />
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: FONT_FAMILY.body }}>
            {search ? 'Sin resultados para tu búsqueda.' : 'No hay usuarios CMS registrados.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
          {/* Cabecera */}
          <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.26)' }}>
            <Text style={hdr(3)}>USUARIO</Text>
            <Text style={hdr(2.5)}>EMAIL</Text>
            <Text style={hdr(1)}>ROL</Text>
            <Text style={hdr(1)}>ESTADO</Text>
            <Text style={hdr(1)}>ÚLT. ACCESO</Text>
            <Text style={hdr(0.9)}>ACCIONES</Text>
          </View>

          {filtered.map((user) => {
            const meta        = ROLE_META[user.role];
            const isActive    = user.status === 'active';
            const isToggling  = togglingId === user.id;
            const isDeleting  = deletingId === user.id;
            const isSelf      = profile?.id === user.id;
            const lastLogin   = user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
              : '—';

            return (
              <View
                key={user.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 11, paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.16)',
                  opacity: isDeleting ? 0.4 : 1,
                }}
              >
                {/* Avatar + nombre */}
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 9,
                    backgroundColor: meta ? `${meta.color}18` : theme.liftBg,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: meta ? `${meta.color}28` : theme.border,
                  }}>
                    <Text style={{ color: meta?.color ?? theme.accent, fontSize: 11, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>
                      {user.nombre.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }} numberOfLines={1}>
                      {user.nombre}
                      {isSelf && <Text style={{ color: theme.accent, fontSize: 10 }}> (tú)</Text>}
                    </Text>
                  </View>
                </View>

                {/* Email */}
                <Text style={{ flex: 2.5, color: isDark ? theme.textSec : 'rgba(36,0,70,0.7)', fontSize: 12, fontFamily: FONT_FAMILY.body }} numberOfLines={1}>
                  {user.email}
                </Text>

                {/* Rol */}
                <View style={{ flex: 1 }}>
                  <View style={{ alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: meta ? `${meta.color}18` : theme.liftBg }}>
                    <Text style={{ color: meta?.color ?? theme.accent, fontSize: 10, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>
                      {meta?.label ?? user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Estado */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isActive ? '#10B981' : theme.danger }} />
                    <Text style={{ color: isActive ? '#10B981' : theme.danger, fontSize: 11, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                {/* Último acceso */}
                <Text style={{ flex: 1, color: theme.textMuted, fontSize: 11, fontFamily: FONT_FAMILY.body }}>
                  {lastLogin}
                </Text>

                {/* Acciones */}
                <View style={{ flex: 0.9, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Toggle estado */}
                  {canWrite && !isSelf && user.role !== 'superadmin' && (
                    <TouchableOpacity
                      onPress={() => handleToggleStatus(user)}
                      disabled={isToggling}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : theme.dangerSoft,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isActive ? 'rgba(16,185,129,0.28)' : 'rgba(209,16,90,0.28)',
                      }}
                    >
                      {isToggling
                        ? <ActivityIndicator size="small" color={theme.accent} />
                        : <FontAwesome name={isActive ? 'toggle-on' : 'toggle-off'} size={13} color={isActive ? '#10B981' : theme.danger} />
                      }
                    </TouchableOpacity>
                  )}

                  {/* Editar */}
                  {canWrite && (
                    <TouchableOpacity
                      onPress={() => { setEditUser(user); setFormVisible(true); }}
                      style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.accentBorder }}
                    >
                      <FontAwesome name="pencil" size={12} color={theme.accent} />
                    </TouchableOpacity>
                  )}

                  {/* Ver detalle */}
                  <TouchableOpacity
                    onPress={() => setDetailUser(user)}
                    style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: isDark ? theme.liftBg : 'rgba(130,130,130,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.22)' }}
                  >
                    <FontAwesome name="eye" size={12} color={theme.textSec} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Modales ── */}
      <CmsUserFormModal
        visible={formVisible}
        initialData={editUser}
        onClose={() => { setFormVisible(false); setEditUser(null); }}
        onSave={handleSave}
      />
      <CmsUserDetailModal
        visible={!!detailUser}
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onDelete={canWrite ? handleDelete : undefined}
      />
    </View>
  );
}
