import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../../hooks/useTheme';
import PermissionToggles from './PermissionToggles';
import { ROLE_META, buildModulePermissions, TOGGLEABLE_MODULES } from './types';
import { adminGetRoles, adminUpdateRolePermissions } from '../../../services/api/adminApi';
import type { CmsRole } from '../../../services/api/adminApi';
import { useCmsStore } from '../../../services/cmsStore';
import { FONT_FAMILY } from '../../../styles/typography';

const CMS_ROLES = ['superadmin', 'admin', 'soporte'] as const;
type RoleKey = typeof CMS_ROLES[number];

const FIXED_ROLES: RoleKey[] = ['superadmin'];

const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  superadmin: 'Acceso total e irrestricto al sistema. No editable.',
  admin:      'Permisos configurables. Accede a los módulos que el Super Admin habilite.',
  soporte:    'Permisos de solo lectura por defecto. Configurable por el Super Admin.',
};

export default function RolesOverviewTab() {
  const { isDark, theme } = useTheme();
  const { accessToken, profile } = useCmsStore();
  const isSuperAdmin = profile?.role === 'superadmin';

  const [roles, setRoles]   = useState<CmsRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<RoleKey | null>(null);
  const [dirty, setDirty]     = useState<Partial<Record<RoleKey, string[]>>>({});
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState<RoleKey | null>(null);
  const [expanded, setExpanded] = useState<RoleKey | null>(null);

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

  const getPermissions = (roleKey: RoleKey): string[] => {
    if (dirty[roleKey]) return dirty[roleKey]!;
    const found = roles.find(
      (r) => r.key === roleKey || r.key?.toLowerCase() === roleKey,
    );
    return Array.isArray(found?.permissions) ? found!.permissions : [];
  };

  const handleToggle = (roleKey: RoleKey, permKey: string, enabled: boolean) => {
    const current = getPermissions(roleKey);
    let updated = enabled ? [...current, permKey] : current.filter((p) => p !== permKey);

    // Sync module-level key for sidebar visibility:
    // Extract module key from granular key (e.g. 'cms:canales:read' → 'cms:canales')
    const parts = permKey.split(':');
    if (parts.length === 3) {
      const moduleKey = `${parts[0]}:${parts[1]}`;
      const siblingReadKey  = `${moduleKey}:read`;
      const siblingWriteKey = `${moduleKey}:write`;
      const anyOpEnabled = enabled ||
        (permKey !== siblingReadKey  && updated.includes(siblingReadKey)) ||
        (permKey !== siblingWriteKey && updated.includes(siblingWriteKey));
      if (anyOpEnabled) {
        if (!updated.includes(moduleKey)) updated = [...updated, moduleKey];
      } else {
        updated = updated.filter((p) => p !== moduleKey);
      }
    }

    setDirty((prev) => ({ ...prev, [roleKey]: updated }));
  };

  const handleSave = async (roleKey: RoleKey) => {
    if (!accessToken || !dirty[roleKey]) return;
    setSaving(roleKey);
    setError('');
    try {
      const updated = await adminUpdateRolePermissions(accessToken, roleKey, dirty[roleKey]!);
      setRoles((prev) => prev.map((r) => (r.key === roleKey ? updated : r)));
      setDirty((prev) => { const next = { ...prev }; delete next[roleKey]; return next; });
      setSaved(roleKey);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar.';
      setError(
        msg === 'Failed to fetch'
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'
          : msg,
      );
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
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

      {/* ── Aviso de solo lectura para no-superadmin ── */}
      {!isSuperAdmin && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: isDark ? 'rgba(255,184,0,0.08)' : 'rgba(255,184,0,0.10)',
          borderRadius: 10, padding: 12, borderWidth: 1,
          borderColor: 'rgba(255,184,0,0.25)',
        }}>
          <FontAwesome name="lock" size={14} color="#FFB800" />
          <Text style={{ color: isDark ? '#FFB800' : '#8a6000', fontSize: 12, fontFamily: FONT_FAMILY.body, flex: 1 }}>
            Solo el <Text style={{ fontWeight: '800' }}>Super Admin</Text> puede modificar permisos de rol.
            Estás viendo los roles en modo lectura.
          </Text>
        </View>
      )}

      {error ? (
        <View style={{ backgroundColor: theme.dangerSoft, borderRadius: 8, padding: 12 }}>
          <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>{error}</Text>
        </View>
      ) : null}

      {/* ── Tarjetas resumen de roles ── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {CMS_ROLES.map((roleKey) => {
          const meta        = ROLE_META[roleKey];
          if (!meta) return null;
          const isFixed     = FIXED_ROLES.includes(roleKey);
          const permissions = getPermissions(roleKey);
          const enabledCount = buildModulePermissions(roleKey, permissions).filter(
            (r) => r.read?.enabled || r.write?.enabled,
          ).length;
          const isExpanded  = expanded === roleKey;
          const isDirty     = !!dirty[roleKey];
          const canEdit     = isSuperAdmin && !isFixed;

          return (
            <TouchableOpacity
              key={roleKey}
              activeOpacity={canEdit ? 0.75 : 1}
              onPress={() => canEdit && setExpanded(isExpanded ? null : roleKey)}
              style={{
                flex: 1,
                minWidth: 220,
                backgroundColor: isDark ? theme.cardBg : '#FFFFFF',
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: isExpanded
                  ? meta.color
                  : isDirty
                  ? theme.accent
                  : isDark ? theme.border : 'rgba(130,130,130,0.28)',
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 16,
                borderBottomWidth: isExpanded ? 1 : 0,
                borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.20)',
              }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 12,
                  backgroundColor: `${meta.color}1A`,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: `${meta.color}30`,
                }}>
                  <FontAwesome name={meta.icon} size={17} color={meta.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 14, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>
                      {meta.label}
                    </Text>
                    {isFixed && (
                      <View style={{ backgroundColor: 'rgba(255,184,0,0.14)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ color: '#FFB800', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>FIJO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: isDark ? theme.textSec : 'rgba(36,0,70,0.60)', fontSize: 11, marginTop: 2, fontFamily: FONT_FAMILY.body }}>
                    {ROLE_DESCRIPTIONS[roleKey]}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {roleKey === 'superadmin' ? (
                    <View style={{ backgroundColor: `${meta.color}18`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: meta.color, fontSize: 10, fontWeight: '800' }}>TODOS</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: theme.accentSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800' }}>
                        {enabledCount}/{TOGGLEABLE_MODULES.filter((m) => m.key !== 'cms:roles').length} módulos
                      </Text>
                    </View>
                  )}
                  {canEdit && (
                    <FontAwesome
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={11}
                      color={theme.textMuted}
                    />
                  )}
                </View>
              </View>

              {/* SUPERADMIN: descripción de acceso total */}
              {isExpanded && roleKey === 'superadmin' && (
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,184,0,0.08)', borderRadius: 10, padding: 12 }}>
                    <FontAwesome name="star" size={14} color="#FFB800" />
                    <Text style={{ color: isDark ? '#FFB800' : '#7a5500', fontSize: 12, fontFamily: FONT_FAMILY.body, flex: 1 }}>
                      El Super Admin tiene acceso total al sistema (<Text style={{ fontWeight: '700' }}>cms:*</Text>). Sus permisos no son configurables.
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Panel de edición de permisos (inline) ── */}
      {expanded && expanded !== 'superadmin' && isSuperAdmin && (() => {
        const roleKey      = expanded;
        const meta         = ROLE_META[roleKey];
        const permissions  = getPermissions(roleKey);
        const isDirty      = !!dirty[roleKey];
        const isSaving     = saving === roleKey;
        const wasSaved     = saved === roleKey;
        const matrixItems  = buildModulePermissions(roleKey, permissions, true);

        return (
          <View style={{
            backgroundColor: isDark ? theme.cardBg : '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDirty ? theme.accent : (isDark ? theme.border : 'rgba(130,130,130,0.28)'),
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderBottomWidth: 1,
              borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.20)',
              backgroundColor: isDark ? theme.liftBg : 'rgba(96,38,158,0.04)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${meta.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name={meta.icon} size={14} color={meta.color} />
                </View>
                <View>
                  <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 14, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>
                    Permisos — {meta.label}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: FONT_FAMILY.body }}>
                    Los cambios aplican en el próximo inicio de sesión del usuario.
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setExpanded(null); handleDiscard(roleKey); }}>
                <FontAwesome name="times" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Módulos CMS */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, fontFamily: FONT_FAMILY.bodyBold }}>
                MÓDULOS DEL CMS
              </Text>
            </View>
            <PermissionToggles
              items={matrixItems}
              readOnly={false}
              onChange={(key, enabled) => handleToggle(roleKey, key, enabled)}
            />

            {/* Footer save/discard */}
            <View style={{
              flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
              padding: 14, gap: 8,
              borderTopWidth: 1, borderTopColor: isDark ? theme.border : 'rgba(130,130,130,0.18)',
              backgroundColor: isDark ? theme.liftBg : 'rgba(96,38,158,0.03)',
            }}>
              {wasSaved && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 }}>
                  <FontAwesome name="check-circle" size={13} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>Guardado</Text>
                </View>
              )}
              {isDirty && (
                <TouchableOpacity
                  onPress={() => handleDiscard(roleKey)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }}
                >
                  <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>Descartar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleSave(roleKey)}
                disabled={!isDirty || isSaving}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8,
                  backgroundColor: isDirty ? theme.accent : `${theme.accent}40`,
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <FontAwesome name="save" size={12} color="#fff" />
                }
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </ScrollView>
  );
}
