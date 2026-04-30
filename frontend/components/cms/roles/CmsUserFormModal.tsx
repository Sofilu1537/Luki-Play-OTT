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
import { useTheme } from '../../../hooks/useTheme';
import { ROLE_META, TOGGLEABLE_MODULES, SOPORTE_DEFAULT_PERMISSIONS, ADMIN_DEFAULT_PERMISSIONS } from './types';
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
  const { theme } = useTheme();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CmsRole>('admin');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = {
    backgroundColor: theme.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.softUiBorderDark,
    color: theme.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
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
    setEmailInvalid(false);
  }, [visible, initialData]);

  useEffect(() => {
    // Don't override permissions loaded from initialData when editing
    if (initialData) return;
    if (role === 'soporte') {
      setPermissions(SOPORTE_DEFAULT_PERMISSIONS);
    } else {
      // Admin: default to full operational permissions
      setPermissions(ADMIN_DEFAULT_PERMISSIONS);
    }
  }, [role]);

  const handleSave = async () => {
    if (!nombre.trim() || nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Ingrese un email válido.');
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
      const msg = e instanceof Error ? e.message : '';
      if (/duplicate|already.?exist|ya.?exist|email.*taken|taken.*email/i.test(msg)) {
        setError('Este email ya está registrado en el sistema.');
      } else {
        setError(msg || 'Error al guardar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.82)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 500, backgroundColor: theme.cardBg, borderRadius: 20, borderWidth: 1, borderColor: theme.softUiBorderDark, overflow: 'hidden' }}>

          {/* ── Header ───────────────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: initialData ? theme.accentSoft : 'rgba(16,185,129,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: initialData ? theme.accentBorder : 'rgba(16,185,129,0.30)' }}>
                <FontAwesome name={initialData ? 'pencil' : 'user-plus'} size={17} color={initialData ? theme.accent : '#10B981'} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
                  {initialData ? 'Editar usuario CMS' : 'Nuevo usuario CMS'}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 3 }}>
                  {initialData
                    ? 'Modifica los datos del usuario interno.'
                    : 'El usuario recibirá un correo para activar su cuenta.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6, marginTop: -2 }}>
              <FontAwesome name="times" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>

            {/* ── INFORMACIÓN BÁSICA ───────────────────────────────── */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <View style={{ width: 3, height: 15, borderRadius: 2, backgroundColor: theme.accent }} />
                <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>INFORMACIÓN BÁSICA</Text>
              </View>

              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '600', marginBottom: 7 }}>Nombre completo</Text>
                  <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} placeholder="Juan Pérez" placeholderTextColor={theme.textMuted} />
                </View>
                <View>
                  <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '600', marginBottom: 7 }}>Correo electrónico</Text>
                  <TextInput
                    style={{ ...inputStyle, borderColor: emailInvalid ? '#D1105A' : theme.softUiBorderDark }}
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (emailInvalid) setEmailInvalid(false); }}
                    onBlur={() => {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      setEmailInvalid(!!email.trim() && !emailRegex.test(email.trim()));
                    }}
                    placeholder="usuario@lukiplay.com"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailInvalid && (
                    <Text style={{ color: '#D1105A', fontSize: 11, marginTop: 4 }}>Ingrese un email válido.</Text>
                  )}
                </View>
                <View>
                  <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '600', marginBottom: 7 }}>
                    Teléfono <Text style={{ color: theme.textMuted, fontWeight: '400' }}>(opcional)</Text>
                  </Text>
                  <TextInput style={inputStyle} value={phone} onChangeText={setPhone} placeholder="+593..." placeholderTextColor={theme.textMuted} />
                </View>
              </View>
            </View>

            {/* ── ROL ──────────────────────────────────────────────── */}
            <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 15, borderRadius: 2, backgroundColor: theme.accent }} />
                  <Text style={{ color: theme.text, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>ROL</Text>
                </View>
                {!!initialData && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.warningSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 }}>
                    <FontAwesome name="lock" size={9} color={theme.warning} />
                    <Text style={{ color: theme.warning, fontSize: 10, fontWeight: '700' }}>No modificable</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['admin', 'soporte'] as const).map((r) => {
                  const meta = ROLE_META[r];
                  const selected = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      disabled={!!initialData}
                      onPress={() => !initialData && setRole(r)}
                      style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 14,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? meta.color : theme.border,
                        backgroundColor: selected ? `${meta.color}14` : theme.liftBg,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: selected ? `${meta.color}22` : 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                          <FontAwesome name={meta.icon} size={14} color={selected ? meta.color : theme.textMuted} />
                        </View>
                        {selected && (
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: meta.color, alignItems: 'center', justifyContent: 'center' }}>
                            <FontAwesome name="check" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <Text style={{ color: selected ? theme.text : theme.textSec, fontSize: 13, fontWeight: '800', marginBottom: 4 }}>{meta.label}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10, lineHeight: 14 }}>
                        {r === 'admin' ? 'Acceso configurable\npor Superadmin' : 'Permisos de soporte\nfijos y predefinidos'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Error ────────────────────────────────────────────── */}
            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: theme.dangerSoft, borderRadius: 10, padding: 13, borderWidth: 1, borderColor: 'rgba(209,16,90,0.25)' }}>
                <FontAwesome name="exclamation-circle" size={14} color={theme.danger} style={{ marginTop: 1 }} />
                <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '600', flex: 1 }}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <View style={{ flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.textSec, fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ flex: 2, paddingVertical: 13, borderRadius: 10, alignItems: 'center', backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }}>
              {loading ? <ActivityIndicator color="#000" size="small" /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome name="check" size={13} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>Guardar</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
