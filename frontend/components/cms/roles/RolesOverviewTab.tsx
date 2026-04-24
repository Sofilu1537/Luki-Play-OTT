import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../../hooks/useTheme';
import PermissionToggles from './PermissionToggles';
import { ROLE_META, buildToggleItems, buildContentPermItems, TOGGLEABLE_MODULES } from './types';
import { adminGetRoles, adminUpdateRolePermissions } from '../../../services/api/adminApi';
import type { CmsRole } from '../../../services/api/adminApi';
import { useCmsStore } from '../../../services/cmsStore';

const DISPLAY_ROLES = ['superadmin', 'admin', 'soporte', 'cliente'] as const;
type RoleKey = typeof DISPLAY_ROLES[number];

const FIXED_ROLES: RoleKey[] = ['superadmin', 'cliente'];

export default function RolesOverviewTab() {
  const { isDark, theme } = useTheme();
  const { accessToken } = useCmsStore();
  const [roles, setRoles] = useState<CmsRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<RoleKey | null>(null);
  const [dirty, setDirty] = useState<Partial<Record<RoleKey, string[]>>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<RoleKey | null>(null);

  const loadRoles = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminGetRoles(accessToken);
      setRoles(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const getPermissions = (roleKey: RoleKey): string[] =>
    dirty[roleKey] ?? roles.find((r) => r.key === roleKey)?.permissions ?? [];

  const handleToggle = (roleKey: RoleKey, permKey: string, enabled: boolean) => {
    const current = getPermissions(roleKey);
    const updated = enabled ? [...current, permKey] : current.filter((p) => p !== permKey);
    setDirty((prev) => ({ ...prev, [roleKey]: updated }));
  };

  const handleSave = async (roleKey: RoleKey) => {
    if (!accessToken || !dirty[roleKey]) return;
    setSaving(roleKey);
    setError('');
    try {
      const updated = await adminUpdateRolePermissions(accessToken, roleKey, dirty[roleKey]!);
      setRoles((prev) => prev.map((r) => r.key === roleKey ? updated : r));
      setDirty((prev) => { const next = { ...prev }; delete next[roleKey]; return next; });
      setSaved(roleKey);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setSaving(null);
    }
  };

  const handleDiscard = (roleKey: RoleKey) => {
    setDirty((prev) => { const next = { ...prev }; delete next[roleKey]; return next; });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 900 }}>
      <Text style={{ color: theme.textSec, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
        Configura los permisos de cada rol. Los cambios aplican a{' '}
        <Text style={{ color: theme.accent, fontWeight: '700' }}>todos los usuarios</Text> con ese rol en su próximo inicio de sesión.
      </Text>

      {error ? (
        <View style={{ backgroundColor: theme.dangerSoft, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>{error}</Text>
        </View>
      ) : null}

      {DISPLAY_ROLES.map((roleKey) => {
        const meta = ROLE_META[roleKey];
        if (!meta) return null;

        const isCliente = roleKey === 'cliente';
        const isFixed = FIXED_ROLES.includes(roleKey);
        const editable = !isFixed;
        const permissions = getPermissions(roleKey);
        const isDirty = !!dirty[roleKey];
        const isSaving = saving === roleKey;
        const wasSaved = saved === roleKey;
        const toggleItems = isCliente ? [] : buildToggleItems(roleKey, permissions, editable);
        const contentItems = isCliente ? [] : buildContentPermItems(roleKey, permissions, editable);
        const enabledCount = toggleItems.filter((t) => t.enabled).length;

        return (
          <View
            key={roleKey}
            style={{
              backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDirty
                ? theme.accent
                : (isDark ? theme.border : 'rgba(130,130,130,0.34)'),
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.26)',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${meta.color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <FontAwesome name={meta.icon} size={16} color={meta.color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 15, fontWeight: '800' }}>{meta.label}</Text>
                <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, marginTop: 2 }}>{meta.description}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!isCliente && (
                  <View style={{ backgroundColor: theme.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>
                      {roleKey === 'superadmin' ? 'Todos' : `${enabledCount}/${TOGGLEABLE_MODULES.length}`}
                    </Text>
                  </View>
                )}
                {isFixed && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <FontAwesome name="lock" size={11} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>Fijo</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Permissions */}
            {isCliente ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 12, fontStyle: 'italic' }}>
                  Solo acceso a la app OTT (playback + perfiles). Sin acceso al CMS.
                </Text>
              </View>
            ) : (
              <>
                <PermissionToggles
                  items={toggleItems}
                  readOnly={!editable}
                  onChange={(key, enabled) => handleToggle(roleKey, key, enabled)}
                />
                {contentItems.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: isDark ? theme.border : 'rgba(130,130,130,0.26)', paddingTop: 4 }}>
                    <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 }}>
                      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>CONTENIDO (API)</Text>
                    </View>
                    <PermissionToggles
                      items={contentItems}
                      readOnly={!editable}
                      onChange={(key, enabled) => handleToggle(roleKey, key, enabled)}
                    />
                  </View>
                )}

                {/* Save/Discard footer (only for editable roles with changes) */}
                {editable && (
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: isDark ? theme.border : 'rgba(130,130,130,0.18)' }}>
                    {wasSaved && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
                        <FontAwesome name="check-circle" size={13} color="#10B981" />
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>Guardado</Text>
                      </View>
                    )}
                    {isDirty && (
                      <TouchableOpacity
                        onPress={() => handleDiscard(roleKey)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }}
                      >
                        <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Descartar</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleSave(roleKey)}
                      disabled={!isDirty || isSaving}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 7,
                        backgroundColor: isDirty ? theme.accent : `${theme.accent}40`,
                        opacity: isSaving ? 0.7 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isSaving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <FontAwesome name="save" size={12} color="#fff" />
                      }
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                        {isSaving ? 'Guardando…' : 'Guardar cambios'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
