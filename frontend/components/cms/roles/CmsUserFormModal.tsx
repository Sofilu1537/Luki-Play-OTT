import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { C } from '../CmsShell';
import PermissionToggles from './PermissionToggles';
import { ROLE_META, buildToggleItems, TOGGLEABLE_MODULES, SOPORTE_DEFAULT_PERMISSIONS } from './types';
import type { AdminUser } from '../../../services/api/adminApi';

type CmsRole = 'admin' | 'soporte';

interface CmsUserFormModalProps {
  visible: boolean;
  initialData?: AdminUser | null;
  onClose: () => void;
  onSave: (data: {
    nombre: string;
    email: string;
    phone?: string;
    role: CmsRole;
    permissions: string[];
  }) => Promise<void>;
}

export default function CmsUserFormModal({ visible, initialData, onClose, onSave }: CmsUserFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CmsRole>('admin');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = {
    backgroundColor: C.lift,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
    ...webInput,
  };

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setNombre(initialData.nombre);
      setEmail(initialData.email);
      setPhone(initialData.telefono ?? '');
      const r = initialData.role === 'soporte' ? 'soporte' : 'admin';
      setRole(r);
      setPermissions(initialData.permissions ?? []);
    } else {
      setNombre('');
      setEmail('');
      setPhone('');
      setRole('admin');
      setPermissions([]);
    }
    setError('');
  }, [visible, initialData]);

  useEffect(() => {
    if (role === 'soporte') {
      setPermissions(SOPORTE_DEFAULT_PERMISSIONS);
    } else if (!initialData || initialData.role === 'soporte') {
      setPermissions([]);
    }
  }, [role]);

  const toggleItems = buildToggleItems(role, permissions);

  const handleToggle = (key: string, enabled: boolean) => {
    setPermissions((prev) =>
      enabled ? [...prev, key] : prev.filter((p) => p !== key),
    );
  };

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son requeridos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        role,
        permissions: role === 'admin' ? permissions : SOPORTE_DEFAULT_PERMISSIONS,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 700, maxHeight: '90%', backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>
                {initialData ? 'Editar usuario CMS' : 'Crear usuario CMS'}
              </Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>
                Usuarios internos del sistema con acceso al panel de administración.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            {/* Basic info */}
            <View style={{ backgroundColor: C.lift, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 }}>INFORMACIÓN BÁSICA</Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>Nombre completo</Text>
              <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} placeholder="Juan Pérez" placeholderTextColor={C.muted} />
              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>Email</Text>
              <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="usuario@lukiplay.com" placeholderTextColor={C.muted} keyboardType="email-address" autoCapitalize="none" />
              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>Teléfono (opcional)</Text>
              <TextInput style={{ ...inputStyle, marginBottom: 0 }} value={phone} onChangeText={setPhone} placeholder="+593..." placeholderTextColor={C.muted} />
            </View>

            {/* Role selector */}
            <View style={{ backgroundColor: C.lift, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 }}>ROL</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['admin', 'soporte'] as const).map((r) => {
                  const meta = ROLE_META[r];
                  const selected = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: selected ? meta.color : C.border,
                        backgroundColor: selected ? `${meta.color}18` : C.surface,
                      }}
                    >
                      <FontAwesome name={meta.icon} size={14} color={selected ? meta.color : C.muted} />
                      <View>
                        <Text style={{ color: selected ? C.text : C.textDim, fontSize: 13, fontWeight: '700' }}>{meta.label}</Text>
                        <Text style={{ color: C.muted, fontSize: 10 }}>{r === 'admin' ? 'Permisos configurables' : 'Permisos fijos'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Permissions */}
            <View style={{ backgroundColor: C.lift, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>PERMISOS DE MÓDULOS</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>
                {role === 'admin'
                  ? 'Selecciona los módulos a los que tendrá acceso este usuario.'
                  : 'Los permisos de Soporte son fijos y no se pueden modificar.'}
              </Text>
              <PermissionToggles
                items={toggleItems}
                readOnly={role === 'soporte'}
                onChange={handleToggle}
              />
            </View>

            {/* Error */}
            {error ? (
              <View style={{ backgroundColor: C.roseSoft, borderRadius: 8, padding: 12 }}>
                <Text style={{ color: C.rose, fontSize: 12, fontWeight: '600' }}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={{ flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
