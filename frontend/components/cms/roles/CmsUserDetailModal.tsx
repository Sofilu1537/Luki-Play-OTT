import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../../hooks/useTheme';
import PermissionToggles from './PermissionToggles';
import { ROLE_META, buildToggleItems, buildContentPermItems } from './types';
import type { AdminUser } from '../../../services/api/adminApi';

interface CmsUserDetailModalProps {
  visible: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSavePermissions: (userId: string, permissions: string[]) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
}

export default function CmsUserDetailModal({ visible, user, onClose, onSavePermissions, onDelete }: CmsUserDetailModalProps) {
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && user) {
      setPermissions(user.permissions ?? []);
      setDirty(false);
      setError('');
    }
  }, [visible, user]);

  if (!user) return null;

  const meta = ROLE_META[user.role] ?? ROLE_META['admin']!;
  const isAdmin = user.role === 'admin';
  const isSuperadmin = user.role === 'superadmin';
  const toggleItems = buildToggleItems(user.role, permissions);
  const contentPermItems = buildContentPermItems(user.role, permissions);

  const handleToggle = (key: string, enabled: boolean) => {
    setPermissions((prev) => enabled ? [...prev, key] : prev.filter((p) => p !== key));
    setDirty(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await onSavePermissions(user.id, permissions);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete(user.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 600, maxHeight: '90%', backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${meta.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name={meta.icon} size={20} color={meta.color} />
                </View>
                <View>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>{user.nombre}</Text>
                  <Text style={{ color: theme.textSec, fontSize: 12 }}>{user.email}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <FontAwesome name="times" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Role badge */}
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              <View style={{ borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: `${meta.color}18` }}>
                <Text style={{ color: meta.color, fontSize: 11, fontWeight: '800' }}>{meta.label}</Text>
              </View>
              <View style={{ borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: `${theme.accent}18` }}>
                <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>
                  {permissions.length} permisos activos
                </Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* User info */}
            <View style={{ backgroundColor: theme.liftBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 }}>INFORMACIÓN</Text>
              <InfoRow label="ID" value={user.id} />
              <InfoRow label="Teléfono" value={user.telefono || '—'} />
              <InfoRow label="Estado" value={user.status === 'active' ? 'Activo' : user.status} />
              <InfoRow label="Email" value={user.email} last />
            </View>

            {/* Module permissions */}
            {!isSuperadmin && (
              <View style={{ backgroundColor: theme.liftBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>PERMISOS DE MÓDULOS</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>
                  {isAdmin
                    ? 'Activa/desactiva módulos visibles en la barra lateral.'
                    : 'Los permisos de Soporte son fijos.'}
                </Text>
                <PermissionToggles
                  items={toggleItems}
                  readOnly={!isAdmin}
                  onChange={handleToggle}
                />
              </View>
            )}

            {/* Content API permissions (read / write) */}
            {!isSuperadmin && (
              <View style={{ backgroundColor: theme.liftBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>PERMISOS DE CONTENIDO</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>
                  {isAdmin
                    ? 'Controla qué operaciones de API puede ejecutar este usuario sobre canales, categorías y sliders.'
                    : 'Los permisos de Soporte son fijos.'}
                </Text>
                <PermissionToggles
                  items={contentPermItems}
                  readOnly={!isAdmin}
                  onChange={handleToggle}
                />
              </View>
            )}

            {isSuperadmin && (
              <View style={{ padding: 16, backgroundColor: `${theme.accent}0A`, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                  El Super Admin tiene acceso total (cms:*). No se pueden editar sus permisos.
                </Text>
              </View>
            )}

            {error ? (
              <View style={{ backgroundColor: theme.dangerSoft, borderRadius: 8, padding: 12 }}>
                <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600' }}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={{ flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
            {onDelete && !isSuperadmin && (
              <TouchableOpacity onPress={handleDelete} disabled={loading} style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.danger, backgroundColor: theme.dangerSoft }}>
                <FontAwesome name="trash-o" size={14} color={theme.danger} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }}>
              <Text style={{ color: theme.textSec, fontWeight: '700' }}>Cerrar</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity onPress={handleSave} disabled={!dirty || loading} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: dirty ? theme.accent : `${theme.accent}40`, opacity: loading ? 0.6 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar permisos</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.border }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, width: 90 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 12, flex: 1 }}>{value}</Text>
    </View>
  );
}
