import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import CmsShell from '../../components/cms/CmsShell';
import { StatCard } from '../../components/cms/CmsComponents';
import type { ThemeTokens } from '../../styles/theme';
import {
  adminCreateUser,
  adminGenerateActivationCode,
  adminGetUser,
  adminGetUserPlan,
  adminListPlans,
  adminListUserSessions,
  adminListUsers,
  adminRevokeAllUserSessions,
  adminRevokeUserSession,
  adminSendRecoveryCode,
  adminSetUserPassword,
  adminUpdateUser,
  adminUpdateUserStatus,
  AdminPlan,
  AdminUser,
  AdminUserPayload,
  AdminUserPlan,
  AdminUserSession,
} from '../../services/api/adminApi';
import { useCmsStore } from '../../services/cmsStore';
import { useTheme } from '../../hooks/useTheme';
import { CMS_LIGHT_DASHBOARD_TYPO, FONT_FAMILY } from '../../styles/typography';

type UserType = 'system' | 'subscriber';
type StatusFilter = 'all' | AdminUser['status'];
type DetailTab = 'perfil' | 'sesiones' | 'comercial';
type Feedback = { type: 'success' | 'error'; message: string } | null;

interface SessionsByUser {
  [userId: string]: AdminUserSession[];
}

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
}

interface UserFormModalProps {
  visible: boolean;
  initialData?: AdminUser | null;
  plans: AdminPlan[];
  onClose: () => void;
  onSave: (payload: AdminUserPayload, context: { isSubscriber: boolean }) => Promise<void>;
}

interface UserDetailModalProps {
  visible: boolean;
  accessToken: string | null;
  userId: string | null;
  canWrite: boolean;
  plans: AdminPlan[];
  sessionsByUser: SessionsByUser;
  onClose: () => void;
  onUserUpdated: (user: AdminUser) => void;
  onSessionsUpdated: (userId: string, sessions: AdminUserSession[]) => void;
  onRequestConfirm: (config: Omit<ConfirmState, 'visible'>) => void;
}

function fmtDate(value: string | null) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_BG = 'rgba(255,184,0,0.12)';
const AVATAR_TEXT = '#FFB800';

function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permissions) return false;
  return permissions.includes('cms:*') || permissions.includes(permission);
}

function getUserType(user: Pick<AdminUser, 'isCmsUser' | 'isSubscriber'>): UserType {
  return user.isCmsUser ? 'system' : 'subscriber';
}

function getUserTypeMeta(user: Pick<AdminUser, 'isCmsUser' | 'isSubscriber'>, theme: ThemeTokens) {
  if (user.isCmsUser)      return { label: 'Interno',  color: theme.accentLight, bg: theme.accentSoft };
  if (user.isSubscriber)   return { label: 'Abonado',  color: theme.info,        bg: theme.infoSoft   };
  return                          { label: 'Cliente',  color: theme.accent,      bg: theme.accentSoft };
}

// Tipo de usuario OTT derivado de isSubscriber (fuente de verdad: base de datos)
function getTipoMeta(user: Pick<AdminUser, 'isSubscriber'>, theme: ThemeTokens) {
  if (user.isSubscriber) return { label: 'Abonado', color: theme.info,   bg: theme.infoSoft   };
  return                        { label: 'Cliente', color: theme.accent, bg: theme.accentSoft };
}

function getRoleMeta(role: AdminUser['role'], theme: ThemeTokens) {
  if (role === 'superadmin') return { label: 'Superadmin', color: theme.danger, bg: theme.dangerSoft };
  if (role === 'admin') return { label: 'Admin', color: theme.accent, bg: theme.accentSoft };
  if (role === 'soporte') return { label: 'Soporte', color: theme.success, bg: theme.successSoft };
  return { label: 'Cliente', color: theme.textSec, bg: theme.liftBg };
}

function getStatusMeta(status: AdminUser['status'], theme: ThemeTokens) {
  if (status === 'active')    return { label: 'Activo',     color: theme.success,  bg: theme.successSoft    };
  if (status === 'suspended') return { label: 'Suspendido', color: theme.danger,   bg: theme.dangerSoft     };
  if (status === 'pending')   return { label: 'Pendiente',  color: theme.warning,  bg: theme.warningSoft    };
  return                             { label: 'Inactivo',   color: theme.warning,  bg: theme.warningSoft    };
}

function getDeviceCount(sessions: AdminUserSession[]) {
  return sessions.filter((session) => session.status === 'active').length;
}

function getDeviceSummary(sessions: AdminUserSession[]) {
  const activeNames = sessions.filter((session) => session.status === 'active').map((session) => session.deviceId);
  if (activeNames.length === 0) return 'Sin dispositivos';
  if (activeNames.length <= 2) return activeNames.join(', ');
  return `${activeNames.slice(0, 2).join(', ')} +${activeNames.length - 2}`;
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { isDark, theme } = useTheme();
  return (
    <View style={{
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
      padding: 16,
      shadowColor: theme.cardShadow,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 3,
      ...(Platform.OS === 'web' ? { boxShadow: isDark ? theme.softUiShadowDark : theme.softUiShadow } as object : {}),
    }}>
      <Text style={{ color: isDark ? theme.text : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.sectionTitle, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold, letterSpacing: 0.2 }}>{title}</Text>
      {subtitle ? <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.sectionSubtitle, marginTop: 3, marginBottom: 12, fontFamily: FONT_FAMILY.body }}>{subtitle}</Text> : <View style={{ height: 10 }} />}
      {children}
    </View>
  );
}

function FilterChip({ active, label, onPress, tone = 'accent' }: { active: boolean; label: string; onPress: () => void; tone?: 'accent' | 'cyan' | 'neutral' }) {
  const { theme } = useTheme();
  const activeColor = tone === 'cyan' ? theme.info : tone === 'neutral' ? theme.text : theme.accentLight;
  const activeBg = tone === 'cyan' ? theme.infoSoft : tone === 'neutral' ? theme.liftBg : theme.accentSoft;
  const activeBorder = tone === 'cyan' ? theme.info : tone === 'neutral' ? theme.border : theme.accent;

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: active ? activeBg : theme.liftBg,
        borderWidth: 1,
        borderColor: active ? activeBorder : theme.border,
      }}
      onPress={onPress}
    >
      <Text style={{ color: active ? activeColor : theme.textSec, fontSize: 15, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function DropdownFilter({ label, value, options, onSelect }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const { isDark, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;
  const isFiltered = value !== 'all';

  return (
    <View style={{ position: 'relative', zIndex: open ? 100 : 1, elevation: open ? 100 : 1 }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 10,
          backgroundColor: isFiltered ? theme.accentSoft : (isDark ? theme.liftBg : 'rgba(255,255,255,0.8)'),
          borderWidth: 1,
          borderColor: isFiltered ? theme.accentBorder : (isDark ? theme.border : 'rgba(130,130,130,0.34)'),
        }}
      >
        <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 13, fontWeight: '700' }}>{label}:</Text>
        <Text style={{ color: isFiltered ? theme.accent : (isDark ? theme.text : '#240046'), fontSize: 15, fontWeight: '700' }}>{selectedLabel}</Text>
        <FontAwesome name={open ? 'chevron-up' : 'chevron-down'} size={9} color={isDark ? theme.textMuted : '#240046'} />
      </TouchableOpacity>

      {open ? (
        <>
          {/* Invisible overlay to close on outside tap */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setOpen(false)}
            style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          />
          <View style={{
            position: 'absolute',
            top: 42,
            left: 0,
            minWidth: 160,
            backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)',
            overflow: 'hidden',
            shadowColor: '#0D0020',
            shadowOpacity: isDark ? 0.5 : 0.1,
            shadowRadius: isDark ? 20 : 12,
            shadowOffset: { width: 0, height: 10 },
            zIndex: 110,
            elevation: 110,
          }}>
            {options.map((option, i) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => { onSelect(option.value); setOpen(false); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: value === option.value
                    ? (isDark ? theme.liftBg : 'rgba(255,255,255,0.8)')
                    : 'transparent',
                  borderBottomWidth: i < options.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.26)',
                }}
              >
                <Text style={{ color: value === option.value ? theme.accent : (isDark ? theme.textSec : '#240046'), fontSize: 15, fontWeight: value === option.value ? '800' : '600' }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function RecoveryModal({ user, accessToken, onClose, onFeedback, onUserUpdated }: { user: AdminUser; accessToken: string; onClose: () => void; onFeedback: (fb: Feedback) => void; onUserUpdated: (u: AdminUser) => void }) {
  const { isDark, theme } = useTheme();
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);
  const [telefono, setTelefono] = useState(user.telefono ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = {
    backgroundColor: isDark ? theme.cardBg : '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? theme.accent : 'rgba(130,130,130,0.18)',
    color: isDark ? theme.text : '#240046',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge,
    fontFamily: FONT_FAMILY.bodySemiBold,
    ...webInput,
  };
  const hasChanges = nombre !== user.nombre || email.trim() !== user.email || telefono !== (user.telefono ?? '');

  const handleSavePersonalData = async () => {
    if (!nombre.trim() || !email.trim()) { onFeedback({ type: 'error', message: 'Nombre y email son requeridos.' }); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      onFeedback({ type: 'error', message: 'Por favor, ingresa un correo electrónico válido.' });
      return;
    }

    setSaving(true);
    try {
      const updated = await adminUpdateUser(accessToken, user.id, { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() || undefined } as AdminUserPayload);
      onUserUpdated(updated);
      onFeedback({ type: 'success', message: 'Datos personales actualizados.' });
      setEditing(false);
      setCodeSent(false);
      setGeneratedCode(null);
    } catch (err) {
      onFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error al actualizar datos' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      onFeedback({ type: 'error', message: 'El correo actualizado es inválido. Por favor corrígelo antes de enviar el código.' });
      return;
    }

    setSending(true);
    try {
      const result = await adminSendRecoveryCode(accessToken, user.id, email.trim());
      setCodeSent(true);
      if (result.code) {
        setGeneratedCode(result.code);
        onFeedback({ type: 'success', message: `Código generado para ${email.trim()}` });
      } else {
        onFeedback({ type: 'success', message: `Código de recuperación enviado a ${email.trim()}` });
      }
    } catch (err) {
      onFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error al enviar código' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(13,0,32,0.76)' }}>
        <View style={{ backgroundColor: isDark ? '#0e0e1f' : '#fff', borderRadius: 16, width: 460, borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.3)' : 'rgba(130,130,130,0.18)', overflow: 'hidden' }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(96,38,158,0.15)' : 'rgba(130,130,130,0.18)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,121,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,121,0,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome name="lock" size={15} color="#FF7900" />
              </View>
              <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.heading }}>Recuperación de contraseña</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: isDark ? 'rgba(250,246,231,0.1)' : 'rgba(130,130,130,0.18)', backgroundColor: isDark ? 'rgba(250,246,231,0.05)' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="times" size={12} color={isDark ? 'rgba(250,246,231,0.4)' : '#240046'} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={{ padding: 20, gap: 14 }}>
            {/* Datos personales card */}
            <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.18)' : 'rgba(130,130,130,0.18)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONT_FAMILY.bodyBold }}>Datos personales</Text>
                {!editing ? (
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(255,184,0,0.28)' : 'rgba(130,130,130,0.18)', backgroundColor: isDark ? 'rgba(255,184,0,0.07)' : '#fff' }} onPress={() => setEditing(true)}>
                    <FontAwesome name="pencil" size={10} color="#FFB800" />
                    <Text style={{ color: isDark ? '#FFB800' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Editar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {editing ? (
                <View style={{ gap: 10 }}>
                  <View>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>Nombre</Text>
                    <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} autoFocus />
                  </View>
                  <View>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>Email</Text>
                    <TextInput style={inputStyle} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  <View>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>Teléfono</Text>
                    <TextInput style={inputStyle} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(250,246,231,0.1)' : 'rgba(130,130,130,0.18)', alignItems: 'center', backgroundColor: isDark ? 'transparent' : '#fff' }} onPress={() => { setNombre(user.nombre); setEmail(user.email); setTelefono(user.telefono ?? ''); setEditing(false); }}>
                      <Text style={{ color: isDark ? 'rgba(250,246,231,0.5)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 6, backgroundColor: hasChanges ? '#FFB800' : 'rgba(255,184,0,0.15)', alignItems: 'center', opacity: saving ? 0.6 : 1 }} onPress={handleSavePersonalData} disabled={saving || !hasChanges}>
                      {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: hasChanges ? '#000' : 'rgba(255,184,0,0.5)', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>Guardar cambios</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.4)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, width: 68, fontFamily: FONT_FAMILY.body }}>Nombre</Text>
                    <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '700', flex: 1, fontFamily: FONT_FAMILY.bodyBold }}>{user.nombre.toUpperCase()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.4)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, width: 68, fontFamily: FONT_FAMILY.body }}>Email</Text>
                    <Text style={{ color: isDark ? '#FFB800' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', flex: 1, fontFamily: FONT_FAMILY.bodySemiBold }}>{user.email}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
                    <Text style={{ color: isDark ? 'rgba(250,246,231,0.4)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, width: 68, fontFamily: FONT_FAMILY.body }}>Teléfono</Text>
                    <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', flex: 1, fontFamily: FONT_FAMILY.bodySemiBold }}>{user.telefono || '—'}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Código generado */}
            {generatedCode ? (
              <View style={{ backgroundColor: isDark ? 'rgba(23,209,198,0.07)' : '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: isDark ? 'rgba(23,209,198,0.2)' : 'rgba(130,130,130,0.18)' }}>
                <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: FONT_FAMILY.bodyBold }}>Código de recuperación</Text>
                <Text style={{ color: '#17D1C6', fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: 4, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' }}>{generatedCode}</Text>
                <Text style={{ color: isDark ? 'rgba(250,246,231,0.35)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, marginTop: 8, textAlign: 'center', fontFamily: FONT_FAMILY.body }}>Comparte este código con el usuario de forma segura.</Text>
              </View>
            ) : codeSent ? (
              <View style={{ backgroundColor: isDark ? 'rgba(23,209,198,0.07)' : '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: isDark ? 'rgba(23,209,198,0.2)' : 'rgba(130,130,130,0.18)' }}>
                <Text style={{ color: '#17D1C6', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', textAlign: 'center', fontFamily: FONT_FAMILY.bodySemiBold }}>Código enviado correctamente a {email.trim()}</Text>
              </View>
            ) : null}

            {/* Footer buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(250,246,231,0.1)' : 'rgba(130,130,130,0.18)', alignItems: 'center', backgroundColor: isDark ? 'transparent' : '#fff' }} onPress={onClose}>
                <Text style={{ color: isDark ? 'rgba(250,246,231,0.55)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: codeSent ? 'rgba(255,184,0,0.15)' : '#FFB800', alignItems: 'center', opacity: (sending || editing) ? 0.6 : 1 }}
                onPress={handleSendCode}
                disabled={sending || editing}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={codeSent ? '#FFB800' : '#000'} />
                ) : (
                  <Text style={{ color: codeSent ? '#FFB800' : '#000', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
                    {codeSent ? 'Generar nuevo código' : 'Generar clave temporal'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const { isDark, theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await state.onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: isDark ? '#0e0e1f' : '#fff', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.3)' : 'rgba(130,130,130,0.18)', padding: 24 }}>
          <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: 20, fontWeight: '800', marginBottom: 10, fontFamily: FONT_FAMILY.heading }}>{state.title}</Text>
          <Text style={{ color: isDark ? 'rgba(250,246,231,0.45)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, lineHeight: 20, marginBottom: 24, fontFamily: FONT_FAMILY.body }}>{state.message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }} onPress={onClose} disabled={loading}>
              <Text style={{ color: isDark ? 'rgba(250,246,231,0.55)' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: state.tone === 'danger' ? '#D1105A' : '#FFB800', opacity: loading ? 0.7 : 1 }}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>{state.confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UserFormModal({ visible, initialData, plans, onClose, onSave }: UserFormModalProps) {
  const { isDark, theme } = useTheme();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [clienteType, setClienteType] = useState<'cliente' | 'abonado'>('cliente');
  const [status, setStatus] = useState<AdminUser['status']>('active');
  const [planId, setPlanId] = useState('');
  const [contrato, setContrato] = useState('');
  const [maxDevices, setMaxDevices] = useState('3');
  const [sessionDurationDays, setSessionDurationDays] = useState('30');
  const [sessionLimitPolicy, setSessionLimitPolicy] = useState<AdminUser['sessionLimitPolicy']>('block_new');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const previousPlanIdRef = useRef<string | null>(null);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const baseInput = {
    backgroundColor: isDark ? theme.liftBg : '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)',
    color: isDark ? theme.text : '#240046',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodySemiBold,
    ...webInput,
  };
  const activePlans = useMemo(() => plans.filter((plan) => plan.activo), [plans]);
  const selectedCatalogPlan = useMemo(() => activePlans.find((plan) => plan.id === planId) ?? null, [activePlans, planId]);
  const contractLocked = Boolean(initialData?.isSubscriber && initialData?.contrato);
  const isAbonado = clienteType === 'abonado';

  useEffect(() => {
    if (!visible) return;
    const tipo = initialData?.isSubscriber ? 'abonado' : 'cliente';
    setClienteType(tipo);
    setNombre(initialData?.nombre ?? '');
    setEmail(initialData?.email ?? '');
    setTelefono(initialData?.telefono ?? '');
    setIdNumber(initialData?.idNumber ?? '');
    setStatus(initialData?.status ?? 'active');
    setPlanId(initialData?.planId ?? activePlans[0]?.id ?? '');
    setContrato(initialData?.contrato ?? '');
    setMaxDevices(String(initialData?.maxDevices ?? 3));
    setSessionDurationDays(String(initialData?.sessionDurationDays ?? 30));
    setSessionLimitPolicy(initialData?.sessionLimitPolicy ?? 'block_new');
    previousPlanIdRef.current = initialData?.planId ?? activePlans[0]?.id ?? null;
    setError('');
  }, [visible, initialData, activePlans]);

  useEffect(() => {
    const selectedPlan = activePlans.find((plan) => plan.id === planId) ?? activePlans[0];
    if (selectedPlan && !planId) setPlanId(selectedPlan.id);
  }, [clienteType, planId, activePlans]);

  useEffect(() => {
    if (!visible || !selectedCatalogPlan) return;
    const planChanged = previousPlanIdRef.current !== selectedCatalogPlan.id;
    if (planChanged) {
      setMaxDevices(String(selectedCatalogPlan.maxDevices || 3));
      previousPlanIdRef.current = selectedCatalogPlan.id;
    }
  }, [visible, selectedCatalogPlan]);

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son requeridos.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (activePlans.length === 0) {
      setError('No hay planes disponibles. Crea o activa un plan en la sección Planes.');
      return;
    }

    const selectedPlan = activePlans.find((plan) => plan.id === planId);
    const payload: AdminUserPayload = {
      nombre:   nombre.trim(),
      email:    email.trim().toLowerCase(),
      telefono: telefono.trim() || undefined,
      idNumber: idNumber.trim() || undefined,
      status,
      role:     'cliente',
      maxDevices: Math.max(1, Number(maxDevices) || 3),
      sessionDurationDays: Math.max(1, Number(sessionDurationDays) || 30),
      sessionLimitPolicy,
      planId:   selectedPlan?.id,
      plan:     selectedPlan?.nombre,
      contrato: isAbonado
        ? (contractLocked ? initialData?.contrato ?? undefined : contrato.trim() || undefined)
        : undefined,
    };

    setLoading(true);
    setError('');
    try {
      await onSave(payload, { isSubscriber: isAbonado });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 860, maxHeight: '90%', backgroundColor: isDark ? theme.cardBg : '#fff', borderRadius: 18, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)', overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 18, backgroundColor: '#2D0060', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>{initialData ? 'Editar usuario' : 'Crear usuario'}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={18} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <SectionCard title="Datos de Registro">
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>NOMBRE COMPLETO</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="Ej: Juan Pérez" placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'} value={nombre} onChangeText={setNombre} />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>CÉDULA DE IDENTIDAD</Text>
                  <TextInput
                    style={{ ...baseInput, marginBottom: 0 }}
                    placeholder="Ej: 1712345678"
                    placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'}
                    value={idNumber}
                    onChangeText={setIdNumber}
                    keyboardType="number-pad"
                    maxLength={13}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>EMAIL</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="usuario@email.com" placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>TELÉFONO</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="+593 999 999 999" placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                </View>
              </View>
            </SectionCard>

            <SectionCard title="Plan y servicio" subtitle={isAbonado ? 'Suscripción mensual ISP. Genera contrato.' : undefined}>
              {activePlans.length > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 12, alignItems: 'flex-start' }}>
                    {selectedCatalogPlan ? (
                      <View style={{ flex: 2, minWidth: 200, backgroundColor: isDark ? theme.liftBg : '#fff', borderRadius: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)', padding: 12 }}>
                        <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>{selectedCatalogPlan.nombre.replace(/\s+/g, '')}</Text>
                        <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, marginTop: 4, fontFamily: FONT_FAMILY.body }}>{selectedCatalogPlan.descripcion}</Text>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                      {activePlans.map((plan) => (
                        <TouchableOpacity
                          key={plan.id}
                          style={{
                            minWidth: 150, paddingHorizontal: 12, paddingVertical: 10,
                            borderRadius: 10, borderWidth: 1,
                            borderColor:     planId === plan.id ? theme.info : theme.border,
                            backgroundColor: planId === plan.id ? theme.infoSoft : (isDark ? theme.liftBg : '#fff'),
                          }}
                          onPress={() => setPlanId(plan.id)}
                        >
                          <Text style={{ color: planId === plan.id ? theme.info : (isDark ? theme.text : '#240046'), fontSize: 13, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>{plan.nombre.replace(/\s+/g, '')}</Text>
                          <Text style={{ color: planId === plan.id ? theme.info : (isDark ? theme.textSec : '#240046'), fontSize: 12, marginTop: 4, fontFamily: FONT_FAMILY.body }}>
                            {plan.maxDevices} disp. · {plan.videoQuality} · {plan.moneda} {plan.precio}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ backgroundColor: theme.dangerSoft, borderRadius: 10, borderWidth: 1, borderColor: `${theme.danger}40`, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>No hay planes activos disponibles en el catálogo.</Text>
                </View>
              )}

              {/* Contrato — solo para Abonados */}
              {isAbonado ? (
                <>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>CONTRATO / CÓDIGO</Text>
                  <TextInput
                    style={{ ...baseInput, opacity: contractLocked ? 0.6 : 1 }}
                    placeholder="Ej: CONTRACT-001"
                    placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'}
                    value={contrato}
                    onChangeText={setContrato}
                    editable={!contractLocked}
                    autoCapitalize="characters"
                  />
                  {contractLocked ? (
                    <Text style={{ color: theme.warning, fontSize: 12, marginTop: -4, fontFamily: FONT_FAMILY.body }}>Este contrato viene del sistema y no se puede editar manualmente.</Text>
                  ) : null}
                </>
              ) : null}
            </SectionCard>

            <SectionCard title="Sesiones" subtitle="Control de simultaneidad y dispositivos permitidos.">
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>SESIONES SIMULTÁNEAS</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="3" placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'} value={maxDevices} onChangeText={setMaxDevices} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4, fontFamily: FONT_FAMILY.bodyBold }}>DURACIÓN DE SESIÓN (DÍAS)</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="30" placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.45)'} value={sessionDurationDays} onChangeText={setSessionDurationDays} keyboardType="number-pad" />
                </View>
              </View>

              <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 12, marginBottom: 6, fontFamily: FONT_FAMILY.bodyBold }}>AL EXCEDER EL LÍMITE</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {([
                  { value: 'block_new'       as const, label: 'Bloquear nuevo acceso' },
                  { value: 'replace_oldest'  as const, label: 'Cerrar la sesión más antigua' },
                ] as const).map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
                      borderColor:     sessionLimitPolicy === option.value ? theme.info : theme.border,
                      backgroundColor: sessionLimitPolicy === option.value ? theme.infoSoft : (isDark ? theme.liftBg : '#fff'),
                    }}
                    onPress={() => setSessionLimitPolicy(option.value)}
                  >
                    <Text style={{ color: sessionLimitPolicy === option.value ? theme.info : (isDark ? theme.textSec : '#240046'), fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            {error ? <Text style={{ color: theme.danger, fontSize: 13, fontFamily: FONT_FAMILY.bodySemiBold }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)', alignItems: 'center', backgroundColor: isDark ? 'transparent' : '#fff' }} onPress={onClose}>
                <Text style={{ color: isDark ? theme.textSec : '#240046', fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.accent, alignItems: 'center', opacity: loading ? 0.7 : 1 }} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Detail modal helpers ────────────────────────────────────────────────────

function FieldCard({
  label, value, na, accent, mono, error, full, style,
}: {
  label: string; value?: string | null;
  na?: boolean; accent?: boolean; mono?: boolean; error?: boolean; full?: boolean;
  style?: object;
}) {
  const isEmpty = !value || value === '—';
  const { isDark, theme } = useTheme();
  return (
    <View style={[{
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
      borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.14)' : 'rgba(130,130,130,0.18)',
      borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10,
    }, style]}>
      <Text style={{ fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 3, fontFamily: FONT_FAMILY.bodyBold }}>{label}</Text>
      <Text style={{
        fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldValue, fontWeight: isEmpty ? '400' : '600',
        color: isEmpty
          ? (isDark ? 'rgba(250,246,231,0.25)' : 'rgba(36,0,70,0.28)')
          : accent
            ? (isDark ? '#FFB800' : '#B07CC6')
            : error
              ? (isDark ? '#D1105A' : '#D1105A')
              : (isDark ? '#FAF6E7' : '#240046'),
        fontStyle: isEmpty ? 'italic' : 'normal',
        fontFamily: mono ? (Platform.OS === 'web' ? 'monospace' : 'Courier') : FONT_FAMILY.bodySemiBold,
        letterSpacing: mono ? 0.5 : undefined,
      }}>{isEmpty ? 'No registrado' : value}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      <Text style={{ fontSize: CMS_LIGHT_DASHBOARD_TYPO.fieldLabel, fontWeight: '700', color: isDark ? 'rgba(250,246,231,0.25)' : '#240046', textTransform: 'uppercase', letterSpacing: 1.1, fontFamily: FONT_FAMILY.bodyBold }}>{children}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(250,246,231,0.05)' : 'rgba(130,130,130,0.18)' }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function UserDetailModal({
  visible,
  accessToken,
  userId,
  canWrite,
  plans,
  sessionsByUser,
  onClose,
  onUserUpdated,
  onSessionsUpdated,
  onRequestConfirm,
}: UserDetailModalProps) {
  const { isDark, theme } = useTheme();
  const forceDarkHeaderSection = true;
  const [user, setUser] = useState<AdminUser | null>(null);
  const [plan, setPlan] = useState<AdminUserPlan | null>(null);
  const [sessions, setSessions] = useState<AdminUserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('perfil');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const baseInput = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(130,130,130,0.18)',
    borderRadius: 9,
    color: isDark ? theme.text : '#240046',
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
    ...webInput,
  };

  const [editPayload, setEditPayload] = useState<Partial<AdminUserPayload>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditPayload({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        idNumber: user.idNumber || '',
        address: user.address || '',
        planId: user.planId || '',
        contrato: user.contrato || '',
        status: user.status,
      });
      setIsEditingProfile(false);
      setIsEditingPlan(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!accessToken || !user || !editPayload.nombre.trim() || !editPayload.email.trim()) {
      setFeedback({ type: 'error', message: 'Nombre y correo son obligatorios.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editPayload.email.trim())) {
      setFeedback({ type: 'error', message: 'Ingresa un correo electrónico válido.' });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<AdminUserPayload> = {
        nombre: editPayload.nombre,
        email: editPayload.email,
        telefono: editPayload.telefono,
        idNumber: editPayload.idNumber,
        address: editPayload.address,
        status: editPayload.status,
      };
      await adminUpdateUser(accessToken, user.id, payload as AdminUserPayload);
      await refreshUser();
      setFeedback({ type: 'success', message: 'Perfil actualizado correctamente' });
      setIsEditingProfile(false);
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlan = async () => {
    if (!accessToken || !user || !editPayload.planId || !editPayload.email) {
      setFeedback({ type: 'error', message: 'Falta información requerida' });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<AdminUserPayload> = {
        email: editPayload.email,
        planId: editPayload.planId,
        contrato: editPayload.contrato,
      };
      await adminUpdateUser(accessToken, user.id, payload as AdminUserPayload);
      await refreshUser();
      setFeedback({ type: 'success', message: 'Plan actualizado correctamente' });
      setIsEditingPlan(false);
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const roleMeta = user ? getRoleMeta(user.role, theme) : null;
  const userTypeMeta = user ? getUserTypeMeta(user, theme) : null;
  const statusMeta = user ? getStatusMeta(user.status, theme) : null;

  useEffect(() => {
    if (!visible || !accessToken || !userId) return;
    setLoading(true);
    setFeedback(null);
    Promise.all([
      adminGetUser(accessToken, userId),
      adminGetUserPlan(accessToken, userId),
      adminListUserSessions(accessToken, userId),
    ])
      .then(([userData, planData, sessionData]) => {
        setUser(userData);
        setPlan(planData);
        setSessions(sessionData);
      })
      .catch((cause) => setFeedback({ type: 'error', message: cause instanceof Error ? cause.message : 'No se pudo cargar el detalle del usuario.' }))
      .finally(() => setLoading(false));
  }, [visible, accessToken, userId]);

  useEffect(() => {
    if (userId && sessionsByUser[userId]) setSessions(sessionsByUser[userId]);
  }, [sessionsByUser, userId]);

  const refreshUser = async () => {
    if (!accessToken || !userId) return;
    const [nextUser, nextPlan, nextSessions] = await Promise.all([
      adminGetUser(accessToken, userId),
      adminGetUserPlan(accessToken, userId),
      adminListUserSessions(accessToken, userId),
    ]);
    setUser(nextUser);
    setPlan(nextPlan);
    setSessions(nextSessions);
    onUserUpdated(nextUser);
    onSessionsUpdated(userId, nextSessions);
  };

  const askPasswordReset = () => {
    if (!accessToken || !user) return;
    onRequestConfirm({
      title: 'Resetear contraseña',
      message: `Se generará una contraseña temporal segura para ${user.nombre} y se revocarán sus sesiones activas.`,
      confirmLabel: 'Resetear ahora',
      tone: 'danger',
      onConfirm: async () => {
        const temporaryPassword = generateTemporaryPassword();
        await adminSetUserPassword(accessToken, user.id, temporaryPassword, true);
        await refreshUser();
        setFeedback({ type: 'success', message: `Contraseña temporal generada: ${temporaryPassword}` });
        setActiveTab('perfil');
      },
    });
  };

  const askRevokeSession = (session: AdminUserSession) => {
    if (!accessToken || !user) return;
    onRequestConfirm({
      title: 'Cerrar sesión del dispositivo',
      message: `Se cerrará la sesión activa del dispositivo ${session.deviceId}.`,
      confirmLabel: 'Cerrar sesión',
      tone: 'danger',
      onConfirm: async () => {
        await adminRevokeUserSession(accessToken, user.id, session.id);
        const nextSessions = await adminListUserSessions(accessToken, user.id);
        const nextUser = await adminGetUser(accessToken, user.id);
        setSessions(nextSessions);
        setUser(nextUser);
        onUserUpdated(nextUser);
        onSessionsUpdated(user.id, nextSessions);
        setFeedback({ type: 'success', message: 'La sesión del dispositivo fue cerrada.' });
      },
    });
  };

  const askRevokeAllSessions = () => {
    if (!accessToken || !user) return;
    onRequestConfirm({
      title: 'Cerrar todas las sesiones',
      message: `Se cerrarán todas las sesiones activas de ${user.nombre} en todos sus dispositivos.`,
      confirmLabel: 'Cerrar todas',
      tone: 'danger',
      onConfirm: async () => {
        await adminRevokeAllUserSessions(accessToken, user.id);
        const nextSessions = await adminListUserSessions(accessToken, user.id);
        const nextUser = await adminGetUser(accessToken, user.id);
        setSessions(nextSessions);
        setUser(nextUser);
        onUserUpdated(nextUser);
        onSessionsUpdated(user.id, nextSessions);
        setFeedback({ type: 'success', message: 'Todas las sesiones activas fueron cerradas.' });
      },
    });
  };

  const askCancelSubscription = () => {
    if (!accessToken || !user) return;
    onRequestConfirm({
      title: 'Cancelar suscripción',
      message: `Se desactivará la cuenta de ${user.nombre} y perderá acceso al servicio.`,
      confirmLabel: 'Cancelar suscripción',
      tone: 'danger',
      onConfirm: async () => {
        await adminUpdateUserStatus(accessToken, user.id, 'inactive');
        await refreshUser();
        setFeedback({ type: 'success', message: 'Suscripción cancelada. El usuario fue desactivado.' });
      },
    });
  };

  const selectedCatalogPlan = user?.planId ? plans.find((catalogPlan) => catalogPlan.id === user.planId) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 580, maxHeight: '92%', backgroundColor: isDark ? '#0e0e1f' : '#fff', borderRadius: 18, borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.3)' : 'rgba(130,130,130,0.18)', overflow: 'hidden' }}>

          {/* ── HEADER ── */}
          <View style={{ backgroundColor: forceDarkHeaderSection ? '#1a0038' : (isDark ? '#1a0038' : '#fff'), paddingHorizontal: 22, paddingTop: 20, paddingBottom: 0 }}>
            {/* Close button */}
            <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: forceDarkHeaderSection ? 'rgba(250,246,231,0.1)' : (isDark ? 'rgba(250,246,231,0.1)' : 'rgba(130,130,130,0.18)'), backgroundColor: forceDarkHeaderSection ? 'rgba(250,246,231,0.05)' : (isDark ? 'rgba(250,246,231,0.05)' : '#fff'), alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <FontAwesome name="times" size={13} color={forceDarkHeaderSection ? 'rgba(250,246,231,0.4)' : (isDark ? 'rgba(250,246,231,0.4)' : '#240046')} />
            </TouchableOpacity>

            {/* Avatar + name + tags */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16 }}>
              <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,184,0,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,184,0,0.35)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ color: '#FFB800', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>{user ? initials(user.nombre) : '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: forceDarkHeaderSection ? '#FAF6E7' : (isDark ? '#FAF6E7' : '#240046'), fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 3 }}>{user?.nombre ?? '—'}</Text>
                <Text style={{ color: forceDarkHeaderSection ? 'rgba(250,246,231,0.4)' : (isDark ? 'rgba(250,246,231,0.4)' : '#240046'), fontSize: 13.5, fontWeight: '500' }}>{user?.email ?? '—'}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                  {userTypeMeta && (
                    <View style={{ backgroundColor: user?.isSubscriber ? 'rgba(255,184,0,0.1)' : 'rgba(255,184,0,0.08)', borderWidth: 1, borderColor: user?.isSubscriber ? 'rgba(255,184,0,0.2)' : 'rgba(255,184,0,0.15)', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#FFB800', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{userTypeMeta.label}</Text>
                    </View>
                  )}
                  {statusMeta && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${statusMeta.color}18`, borderWidth: 1, borderColor: `${statusMeta.color}30`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusMeta.color }} />
                      <Text style={{ color: statusMeta.color, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{statusMeta.label}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Underline tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: forceDarkHeaderSection ? 'rgba(96,38,158,0.2)' : (isDark ? 'rgba(96,38,158,0.2)' : 'rgba(130,130,130,0.18)') }}>
              {([
                { id: 'perfil' as const, label: 'Perfil' },
                { id: 'sesiones' as const, label: 'Dispositivos y sesiones' },
                { id: 'comercial' as const, label: 'Plan / contrato' },
              ] as const).map(tab => (
                <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === tab.id ? '#FFB800' : 'transparent', marginBottom: -1 }}>
                  <Text style={{ color: activeTab === tab.id ? '#FFB800' : (forceDarkHeaderSection ? 'rgba(250,246,231,0.4)' : (isDark ? 'rgba(250,246,231,0.4)' : '#240046')), fontSize: CMS_LIGHT_DASHBOARD_TYPO.tabLabel, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold, whiteSpace: 'nowrap' } as any}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── BODY ── */}
          <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }}>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <ActivityIndicator color={theme.accent} size="large" />
                <Text style={{ color: isDark ? theme.textSec : '#240046', marginTop: 12 }}>Cargando detalle del usuario…</Text>
              </View>
            ) : user ? (
              <>
                {feedback ? (
                  <View style={{ borderRadius: 10, padding: 12, backgroundColor: feedback.type === 'success' ? theme.successSoft : theme.dangerSoft, borderWidth: 1, borderColor: feedback.type === 'success' ? `${theme.success}40` : `${theme.danger}40` }}>
                    <Text style={{ color: feedback.type === 'success' ? theme.success : theme.danger, fontSize: 16, fontWeight: '700' }}>{feedback.message}</Text>
                  </View>
                ) : null}

                {activeTab === 'perfil' ? (
                  <View>
                    {/* Section header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <View>
                        <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.sectionTitle, fontWeight: '700', marginBottom: 2, fontFamily: FONT_FAMILY.bodyBold }}>Perfil personal e identidad</Text>
                      </View>
                      {canWrite && !isEditingProfile && (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(130,130,130,0.18)', backgroundColor: '#fff' }} onPress={() => setIsEditingProfile(true)}>
                          <FontAwesome name="pencil" size={11} color={'#240046'} />
                          <Text style={{ color: '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Editar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                      {isEditingProfile ? (
                      <View style={{ gap: 12 }}>
                        <View style={{ gap: 4 }}>
                          <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>NOMBRES Y APELLIDOS *</Text>
                          <TextInput style={baseInput} value={editPayload.nombre} onChangeText={v => setEditPayload({ ...editPayload, nombre: v })} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                          <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>CÉDULA DE IDENTIDAD</Text>
                            <TextInput style={baseInput} value={editPayload.idNumber} onChangeText={v => setEditPayload({ ...editPayload, idNumber: v })} />
                          </View>
                          <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>CORREO ELECTRÓNICO *</Text>
                            <TextInput style={baseInput} value={editPayload.email} onChangeText={v => setEditPayload({ ...editPayload, email: v })} keyboardType="email-address" autoCapitalize="none" />
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                          <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>TELÉFONO CELULAR</Text>
                            <TextInput style={baseInput} value={editPayload.telefono} onChangeText={v => setEditPayload({ ...editPayload, telefono: v })} keyboardType="phone-pad" />
                          </View>
                          <View style={{ flex: 1, minWidth: 200, gap: 4 }}>
                            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>DIRECCIÓN</Text>
                            <TextInput style={baseInput} value={editPayload.address} onChangeText={v => setEditPayload({ ...editPayload, address: v })} />
                          </View>
                        </View>

                        <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700', marginTop: 10 }}>ESTADO</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {(['active', 'suspended', 'inactive'] as const).map(estado => (
                            <TouchableOpacity
                              key={estado}
                              style={{
                                flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1,
                                borderColor: editPayload.status === estado ? theme.accent : (isDark ? theme.border : 'rgba(130,130,130,0.18)'),
                                backgroundColor: editPayload.status === estado ? theme.accentSoft : (isDark ? 'transparent' : '#fff'),
                                alignItems: 'center'
                              }}
                              onPress={() => setEditPayload({ ...editPayload, status: estado })}
                            >
                              <Text style={{ color: editPayload.status === estado ? theme.accentLight : (isDark ? theme.text : '#240046'), fontSize: 15 }}>{estado === 'active' ? 'Activo' : estado === 'suspended' ? 'Suspendido' : 'Inactivo'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                          <TouchableOpacity disabled={isSaving} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(130,130,130,0.18)' }} onPress={() => setIsEditingProfile(false)}>
                            <Text style={{ color: '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity disabled={isSaving} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#B07CC6', opacity: isSaving ? 0.7 : 1, borderWidth: 1, borderColor: '#B07CC6' }} onPress={handleSaveProfile}>
                            <Text style={{ color: '#fff', fontSize: CMS_LIGHT_DASHBOARD_TYPO.bodyLarge, fontWeight: '800', fontFamily: FONT_FAMILY.bodySemiBold }}>{isSaving ? 'Guardando...' : 'Guardar Perfil'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        {/* DATOS PERSONALES */}
                        <SectionLabel>Datos personales</SectionLabel>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                          <FieldCard label="Nombres" value={user.nombre.split(' ').slice(0, -1).join(' ') || user.nombre} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Apellidos" value={user.nombre.split(' ').length > 1 ? user.nombre.split(' ').slice(-1).join(' ') : undefined} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Cédula" value={user.idNumber} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Teléfono" value={user.telefono} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Email" value={user.email} accent style={{ width: '100%' }} />
                          <FieldCard label="Dirección" value={user.address} style={{ width: '100%' }} />
                        </View>

                        {/* ESTADO DE CUENTA */}
                        <SectionLabel>Estado de cuenta</SectionLabel>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                          <FieldCard label="N° Contrato" value={user.contrato} mono style={{ width: '100%' }} />
                          <FieldCard label="Estado" value={statusMeta?.label} error={user.status !== 'active'} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Tipo" value={userTypeMeta?.label} style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Rol" value="Usuario" style={{ flex: 1, minWidth: 200 }} />
                          <FieldCard label="Fecha de creación" value={fmtDate(user.createdAt)} style={{ flex: 1, minWidth: 200 }} />
                        </View>

                        {/* SEGURIDAD */}
                        <SectionLabel>Seguridad</SectionLabel>
                        <SectionCard title="Estado de seguridad" subtitle="MFA, bloqueos y acceso.">
                          <View style={{ gap: 8 }}>
                            <Text style={{ color: theme.textSec, fontSize: 15 }}>Rol actual: <Text style={{ color: theme.text }}>Usuario</Text></Text>
                            <Text style={{ color: theme.textSec, fontSize: 15 }}>MFA: <Text style={{ color: theme.text }}>{user.mfaEnabled ? 'Activo' : 'No configurado'}</Text></Text>
                            <Text style={{ color: theme.textSec, fontSize: 15 }}>Bloqueo: <Text style={{ color: theme.text }}>{user.isLocked ? `Hasta ${fmtDate(user.lockedUntil)}` : 'No'}</Text></Text>
                            <Text style={{ color: theme.textSec, fontSize: 15 }}>Cambio obligatorio de contraseña: <Text style={{ color: theme.text }}>{user.mustChangePassword ? 'Sí' : 'No'}</Text></Text>
                          </View>
                          {canWrite ? (
                            <TouchableOpacity style={{ marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.accent }} onPress={askPasswordReset}>
                              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Generar reset seguro</Text>
                            </TouchableOpacity>
                          ) : null}
                        </SectionCard>
                      </>
                    )}
                  </View>
                ) : null}

                {activeTab === 'sesiones' ? (
                  <View>
                    {/* Section header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View>
                        <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.sectionTitle, fontWeight: '700', marginBottom: 2, fontFamily: FONT_FAMILY.bodyBold }}>Dispositivos y sesiones</Text>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: 11.5, fontWeight: '500' }}>Dominio Session/Device — actividad y cierres controlados</Text>
                      </View>
                      {canWrite ? (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(209,16,90,0.3)', backgroundColor: 'rgba(209,16,90,0.08)' }} onPress={askRevokeAllSessions}>
                          <FontAwesome name="times" size={11} color={theme.danger} />
                          <Text style={{ color: theme.danger, fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cerrar todas</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Info box */}
                    <View style={{ backgroundColor: isDark ? 'rgba(255,184,0,0.04)' : '#fff', borderWidth: 1, borderColor: isDark ? 'rgba(255,184,0,0.1)' : 'rgba(130,130,130,0.18)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, gap: 4 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.45)' : '#240046', fontSize: 13.5 }}>Sesiones simultáneas permitidas</Text>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.7)' : '#240046', fontSize: 13.5, fontWeight: '600' }}>{user.maxDevices}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.45)' : '#240046', fontSize: 13.5 }}>Duración de sesión</Text>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.7)' : '#240046', fontSize: 13.5, fontWeight: '600' }}>{user.sessionDurationDays} días</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.45)' : '#240046', fontSize: 13.5 }}>Política</Text>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.7)' : '#240046', fontSize: 13.5, fontWeight: '600' }}>{user.sessionLimitPolicy === 'replace_oldest' ? 'Cerrar la más antigua' : 'Bloquear nuevo acceso'}</Text>
                      </View>
                    </View>

                    {sessions.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 28, paddingBottom: 10 }}>
                        <FontAwesome name="television" size={38} color={isDark ? 'rgba(250,246,231,0.12)' : 'rgba(36,0,70,0.24)'} />
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.25)' : '#240046', fontSize: 15, marginTop: 8 }}>0 dispositivos activos para este usuario</Text>
                      </View>
                    ) : (
                      sessions.map((session) => (
                        <View key={session.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: isDark ? theme.border : 'rgba(130,130,130,0.18)' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 16, fontWeight: '700' }}>{session.deviceId}</Text>
                            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 15, marginTop: 4 }}>Canal: {session.audience} · Inicio: {fmtDate(session.createdAt)} · Expira: {fmtDate(session.expiresAt)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: session.status === 'active' ? theme.successSoft : session.status === 'revoked' ? theme.dangerSoft : theme.warningSoft }}>
                              <Text style={{ color: session.status === 'active' ? theme.success : session.status === 'revoked' ? theme.danger : theme.warning, fontSize: 13, fontWeight: '700' }}>{session.status}</Text>
                            </View>
                            {canWrite ? (
                              <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: isDark ? theme.cardBg : '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)', opacity: session.status === 'active' ? 1 : 0.5 }} disabled={session.status !== 'active'} onPress={() => askRevokeSession(session)}>
                                <FontAwesome name="power-off" size={13} color={session.status === 'active' ? theme.danger : theme.textMuted} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}

                {activeTab === 'comercial' ? (
                  <View>
                    {/* Section header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <View>
                        <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.sectionTitle, fontWeight: '700', marginBottom: 2, fontFamily: FONT_FAMILY.bodyBold }}>Plan y contrato</Text>
                        <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: 11.5, fontWeight: '500' }}>Dominio Account/Subscription — catálogo, contrato y capacidad</Text>
                      </View>
                    </View>

                    {isEditingPlan ? (
                      <View style={{ gap: 12 }}>
                        <View style={{ gap: 4 }}>
                          <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700' }}>CÓDIGO DE CONTRATO</Text>
                          <TextInput style={baseInput} value={editPayload.contrato} onChangeText={v => setEditPayload({ ...editPayload, contrato: v })} />
                        </View>
                        <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700', marginTop: 10 }}>SELECCIONA UN PLAN</Text>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                          {plans.map(p => (
                            <TouchableOpacity
                              key={p.id}
                              style={{
                                padding: 12, borderRadius: 8, borderWidth: 1, minWidth: 150,
                                borderColor: editPayload.planId === p.id ? theme.accent : (isDark ? theme.border : 'rgba(130,130,130,0.18)'),
                                backgroundColor: editPayload.planId === p.id ? theme.accentSoft : (isDark ? theme.cardBg : '#fff'),
                              }}
                              onPress={() => setEditPayload({ ...editPayload, planId: p.id })}
                            >
                              <Text style={{ color: editPayload.planId === p.id ? theme.accentLight : (isDark ? theme.text : '#240046'), fontSize: 15, fontWeight: '700' }}>{p.nombre}</Text>
                              <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, marginTop: 4 }}>Dispositivos: {p.maxDevices} máx.</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                          <TouchableOpacity disabled={isSaving} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: isDark ? 'transparent' : '#fff', borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.18)' }} onPress={() => setIsEditingPlan(false)}>
                            <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 15, fontWeight: '700' }}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity disabled={isSaving} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.accent, opacity: isSaving ? 0.7 : 1 }} onPress={handleSavePlan}>
                            <Text style={{ color: '#000', fontSize: 15, fontWeight: '800' }}>{isSaving ? 'Guardando...' : 'Guardar Plan'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        {/* Plan card */}
                        <View style={{ backgroundColor: isDark ? 'rgba(96,38,158,0.15)' : '#fff', borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.25)' : 'rgba(130,130,130,0.18)', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 12 }}>
                          <Text style={{ color: isDark ? '#FAF6E7' : '#240046', fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: 2 }}>{plan?.nombre ?? 'LUKI PLAY'}</Text>
                          <Text style={{ color: isDark ? 'rgba(250,246,231,0.3)' : '#240046', fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', letterSpacing: 0.5, marginBottom: 12 }}>Contrato #{user.contrato ?? '—'}</Text>
                          {plan ? (
                            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                              {[
                                { label: 'Dispositivos', value: String(plan.maxDevices) },
                                { label: 'Streams', value: String(plan.maxConcurrentStreams) },
                                { label: 'Perfiles', value: String(plan.maxProfiles) },
                                { label: 'Calidad', value: plan.videoQuality },
                              ].map(item => (
                                <View key={item.label} style={{ flex: 1, minWidth: 100, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderWidth: 1, borderColor: isDark ? 'rgba(96,38,158,0.12)' : 'rgba(130,130,130,0.18)', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? 'rgba(250,246,231,0.28)' : '#240046', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{item.label}</Text>
                                  <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FAF6E7' : '#240046' }}>{item.value}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>

                        {/* Alert if no catalog match */}
                        {!selectedCatalogPlan && (
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: isDark ? 'rgba(255,121,0,0.07)' : '#fff', borderWidth: 1, borderColor: isDark ? 'rgba(255,121,0,0.2)' : 'rgba(130,130,130,0.18)', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 12 }}>
                            <FontAwesome name="exclamation-circle" size={15} color="#FF7900" style={{ marginTop: 1 }} />
                            <Text style={{ flex: 1, color: isDark ? 'rgba(250,246,231,0.5)' : '#240046', fontSize: 13, lineHeight: 17 }}>
                              Plan asignado desde catálogo: <Text style={{ color: '#FF7900', fontWeight: '700' }}>Sin coincidencia</Text> — el plan en sistema no coincide con ningún producto del catálogo actual.
                            </Text>
                          </View>
                        )}

                        {/* Action buttons */}
                        {canWrite && (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: isDark ? 'rgba(255,184,0,0.3)' : 'rgba(130,130,130,0.18)', backgroundColor: isDark ? 'rgba(255,184,0,0.08)' : '#fff', alignItems: 'center' }} onPress={() => setIsEditingPlan(true)}>
                              <Text style={{ color: isDark ? '#FFB800' : '#240046', fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cambiar plan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: isDark ? 'rgba(209,16,90,0.25)' : 'rgba(130,130,130,0.18)', backgroundColor: isDark ? 'rgba(209,16,90,0.06)' : '#fff', alignItems: 'center' }} onPress={askCancelSubscription}>
                              <Text style={{ color: theme.danger, fontSize: CMS_LIGHT_DASHBOARD_TYPO.button, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>Cancelar suscripción</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ) : null}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: isDark ? theme.textSec : '#240046' }}>No hay detalle disponible para este usuario.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CmsUsers() {
  const { profile, accessToken } = useCmsStore();
  const { isDark, theme } = useTheme();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [sessionsByUser, setSessionsByUser] = useState<SessionsByUser>({});
  const [cmsUserCount, setCmsUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'abonado' | 'cliente'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [recoveryUser, setRecoveryUser] = useState<AdminUser | null>(null);

  const isCmsStaff = profile?.role === 'superadmin' || profile?.role === 'soporte';
  const canWrite = isCmsStaff || hasPermission(profile?.permissions, 'cms:users:write');
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  // Auto-dismiss feedback toast after 4s
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [usersData, plansData] = await Promise.all([
        adminListUsers(accessToken),
        adminListPlans(accessToken),
      ]);

      setUsers(usersData.filter((user) => !user.isCmsUser));
      setCmsUserCount(usersData.filter((user) => user.isCmsUser).length);
      setPlans(plansData);
    } catch (cause) {
      setFeedback({ type: 'error', message: cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase();

      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (tipoFilter === 'abonado' && !user.isSubscriber) return false;
      if (tipoFilter === 'cliente' && user.isSubscriber) return false;
      if (!query) return true;

      return [
        user.nombre,
        user.email,
        user.telefono ?? '',
        user.contrato ?? '',
        user.plan,
        getRoleMeta(user.role, theme).label,
        getUserTypeMeta(user, theme).label,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [users, search, statusFilter, tipoFilter]);

  // Reset to page 1 whenever filters or search change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, tipoFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = {
    total:       users.length,
    internal:    cmsUserCount,
    subscribers: users.filter((user) => user.isSubscriber).length,
    clients:     users.filter((user) => !user.isSubscriber).length,  // one-shot, sin contrato
  };

  const updateUserInList = (nextUser: AdminUser) => {
    setUsers((current) => current.map((user) => (user.id === nextUser.id ? nextUser : user)));
  };

  const updateSessionsForUser = (userId: string, sessions: AdminUserSession[]) => {
    setSessionsByUser((current) => ({ ...current, [userId]: sessions }));
  };

  const openConfirm = (config: Omit<ConfirmState, 'visible'>) => {
    setConfirmState({ ...config, visible: true });
  };

  const closeConfirm = () => setConfirmState(null);

  const exportExcel = () => {
    if (Platform.OS !== 'web') return;
    import('xlsx').then((XLSX) => {
      const today       = new Date();
      const dateStr     = today.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const period      = today.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
      const periodCap   = period.charAt(0).toUpperCase() + period.slice(1);
      const tipoLabel   = tipoFilter === 'abonado' ? 'Abonados' : tipoFilter === 'cliente' ? 'Clientes' : 'Abonados y Clientes';
      const estadoLabel = statusFilter === 'all' ? 'Todos' : statusFilter === 'active' ? 'Activos' : statusFilter === 'suspended' ? 'Suspendidos' : 'Inactivos';
      const exportUsers = filteredUsers;

      const rows: (string | number)[][] = [
        ['LUKI PLAY — Reporte de Usuarios para Facturación Mensual'],
        ['Luki Internet S.A.'],
        [],
        ['Período',         periodCap],
        ['Estado',          estadoLabel],
        ['Tipo de reporte', tipoLabel],
        ['Total registros', `${exportUsers.length} usuarios`],
        ['Generado',        dateStr],
        [],
        ['N°', 'Contrato', 'Nombre', 'Cédula', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Plan', 'Sesiones', 'Fecha registro'],
        ...exportUsers.map((user, i) => [
          i + 1,
          user.contrato ?? '—',
          user.nombre,
          user.idNumber ?? '—',
          user.email,
          user.telefono ?? '—',
          getUserTypeMeta(user, theme).label,
          getStatusMeta(user.status, theme).label,
          user.plan ?? '—',
          `${user.sesiones}/${user.maxDevices}`,
          fmtDate(user.createdAt),
        ]),
        [],
        [`Luki Play CMS · ${dateStr} · Documento confidencial de uso interno`],
      ];

      const ws   = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 }, { wch: 16 }, { wch: 28 }, { wch: 14 },
        { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 10 }, { wch: 18 },
      ];
      const wb   = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Facturación');

      const filename = `luki-play-facturacion-${tipoFilter !== 'all' ? tipoFilter + '-' : ''}${today.toISOString().slice(0, 7)}.xlsx`;
      XLSX.writeFile(wb, filename);
    });
  };

  const handleSaveUser = async (payload: AdminUserPayload, context: { isSubscriber: boolean }) => {
    if (!accessToken) return;

    if (editingUser) {
      const safePayload: AdminUserPayload = {
        ...payload,
        role: context.isSubscriber ? editingUser.role : payload.role,
        contrato: editingUser.contrato && context.isSubscriber ? editingUser.contrato : payload.contrato,
      };

      const updated = await adminUpdateUser(accessToken, editingUser.id, safePayload);
      const selectedPlan = safePayload.planId ? plans.find((plan) => plan.id === safePayload.planId) : null;
      const reconciledUser: AdminUser = context.isSubscriber
        ? {
            ...updated,
            role: 'cliente',
            isSubscriber: true,
            isCmsUser: false,
            planId: safePayload.planId ?? updated.planId,
            plan: selectedPlan?.nombre ?? updated.plan,
            maxDevices: safePayload.maxDevices ?? updated.maxDevices,
            sessionDurationDays: safePayload.sessionDurationDays ?? updated.sessionDurationDays,
            sessionLimitPolicy: safePayload.sessionLimitPolicy ?? updated.sessionLimitPolicy,
          }
        : {
            ...updated,
            planId: null,
            plan: 'Usuario CMS',
            maxDevices: 3,
            sessionDurationDays: safePayload.sessionDurationDays ?? updated.sessionDurationDays,
            sessionLimitPolicy: safePayload.sessionLimitPolicy ?? updated.sessionLimitPolicy,
          };

      updateUserInList(reconciledUser);
      setFeedback({ type: 'success', message: 'Usuario actualizado correctamente.' });
      return;
    }

    const created = await adminCreateUser(accessToken, payload);
    const selectedPlan = payload.planId ? plans.find((plan) => plan.id === payload.planId) : null;
    const reconciledCreatedUser: AdminUser = context.isSubscriber
      ? {
          ...created,
          role: 'cliente',
          isSubscriber: true,
          isCmsUser: false,
          planId: payload.planId ?? created.planId,
          plan: selectedPlan?.nombre ?? payload.plan ?? created.plan,
          maxDevices: payload.maxDevices ?? created.maxDevices,
          sessionDurationDays: payload.sessionDurationDays ?? created.sessionDurationDays,
          sessionLimitPolicy: payload.sessionLimitPolicy ?? created.sessionLimitPolicy,
        }
      : {
          ...created,
          planId: null,
          plan: 'Usuario CMS',
          maxDevices: 3,
          sessionDurationDays: payload.sessionDurationDays ?? created.sessionDurationDays,
          sessionLimitPolicy: payload.sessionLimitPolicy ?? created.sessionLimitPolicy,
        };

    setUsers((current) => [reconciledCreatedUser, ...current]);
    setSessionsByUser((current) => ({ ...current, [reconciledCreatedUser.id]: [] }));
    setFeedback({ type: 'success', message: 'Usuario creado correctamente.' });
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (!accessToken || !canWrite) return;
    // suspended y pending requieren acción explícita desde el modal de detalle
    if (user.status === 'suspended' || user.status === 'pending') return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await adminUpdateUserStatus(accessToken, user.id, newStatus);
      updateUserInList(updated);
      setFeedback({ type: 'success', message: newStatus === 'inactive' ? 'Usuario desactivado.' : 'Usuario activado.' });
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Error al cambiar el estado del usuario.' });
    }
  };

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Usuarios' }]} pageIcon="users">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
            {/* Exportar Excel — outline theme.accent */}
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: 'transparent',
                borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                borderWidth: 1, borderColor: `${theme.accent}66`,
              }}
              onPress={exportExcel}
            >
              <FontAwesome name="download" size={13} color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 16, fontFamily: 'Montserrat-SemiBold' }}>Exportar</Text>
            </TouchableOpacity>
            {canWrite ? (
              /* Crear usuario — accent color */
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                  borderWidth: isDark ? 0 : 1,
                  borderColor: isDark ? 'transparent' : 'rgba(130,130,130,0.18)',
                  backgroundColor: isDark ? 'transparent' : '#fff',
                  overflow: 'hidden',
                }}
                onPress={() => { setEditingUser(null); setShowFormModal(true); }}
              >
                {isDark ? (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
                    <View style={{ flex: 1, backgroundColor: theme.accent }} />
                  </View>
                ) : null}
                <FontAwesome name="plus" size={13} color={isDark ? '#1A1A2E' : '#240046'} />
                <Text style={{ color: isDark ? '#1A1A2E' : '#240046', fontWeight: '700', fontSize: 16, fontFamily: FONT_FAMILY.bodySemiBold }}>Crear usuario</Text>
              </TouchableOpacity>
            ) : null}
        </View>

        {feedback ? (
          <View style={{ marginBottom: 16, borderRadius: 12, padding: 12, backgroundColor: feedback.type === 'success' ? theme.successSoft : theme.dangerSoft, borderWidth: 1, borderColor: feedback.type === 'success' ? `${theme.success}40` : `${theme.danger}40` }}>
            <Text style={{ color: feedback.type === 'success' ? theme.success : theme.danger, fontSize: 16, fontWeight: '700' }}>{feedback.message}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { label: 'Total',     value: stats.total,       icon: 'users'        as const, color: theme.tag    },
            { label: 'Abonados',  value: stats.subscribers, icon: 'play-circle'  as const, color: theme.info   },
            { label: 'Clientes',  value: stats.clients,     icon: 'shopping-bag' as const, color: theme.accent },
          ].map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} color={card.color} />
          ))}
        </View>

        <View style={{
          backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)',
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)',
          marginBottom: 16,
          zIndex: 50,
          elevation: 50,
          shadowColor: '#240046',
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: isDark ? 0 : 20,
          shadowOffset: { width: 0, height: 6 },
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.8)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)',
              paddingHorizontal: 12,
              flex: 1,
              minWidth: 240,
            }}>
              <FontAwesome name='search' size={12} color={isDark ? theme.textMuted : '#240046'} />
              <TextInput
                style={{ flex: 1, color: isDark ? theme.text : '#240046', paddingVertical: 10, paddingHorizontal: 10, fontSize: 16, fontFamily: 'Montserrat-SemiBold', ...webInput }}
                placeholder="Buscar nombre, email, plan..."
                placeholderTextColor={isDark ? theme.textMuted : theme.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <FontAwesome name="times-circle" size={14} color={isDark ? theme.textMuted : theme.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown-style compact filters */}
            <DropdownFilter
              label="Estado"
              value={statusFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Activos' },
                { value: 'suspended', label: 'Suspendidos' },
                { value: 'inactive', label: 'Inactivos' },
              ]}
              onSelect={(v) => setStatusFilter(v as StatusFilter)}
            />

            <DropdownFilter
              label="Tipo"
              value={tipoFilter}
              options={[
                { value: 'all',      label: 'Todos' },
                { value: 'abonado',  label: 'Abonados' },
                { value: 'cliente',  label: 'Clientes' },
              ]}
              onSelect={(v) => setTipoFilter(v as 'all' | 'abonado' | 'cliente')}
            />

            {/* Page size */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[25, 50, 100].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical:    6,
                    borderRadius:       6,
                    backgroundColor:   pageSize === size ? theme.accent : 'transparent',
                    borderWidth:        pageSize === size ? 0 : 1,
                    borderColor:       isDark ? theme.border : 'rgba(130,130,130,0.34)',
                  }}
                  onPress={() => setPageSize(size)}
                >
                  <Text style={{ color: pageSize === size ? '#1A1A2E' : (isDark ? theme.textSec : theme.textMuted), fontSize: 15, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Active filter count + clear */}
            {(statusFilter !== 'all' || tipoFilter !== 'all' || search) ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: theme.dangerSoft, borderWidth: 1, borderColor: `${theme.danger}40` }}
                onPress={() => { setSearch(''); setStatusFilter('all'); setTipoFilter('all'); }}
              >
                <FontAwesome name="times" size={10} color={theme.danger} />
                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textMuted, marginTop: 14, fontSize: 17 }}>Cargando usuarios…</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <FontAwesome name="user-times" size={36} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 17, marginTop: 12 }}>Sin resultados</Text>
            <Text style={{ color: theme.textSec, fontSize: 15, marginTop: 6 }}>Ajusta filtros o crea un nuevo usuario si tienes permisos.</Text>
          </View>
        ) : (
          <>

            {/* Table header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#2D0060', borderRadius: 8, marginBottom: 4 }}>
              {[
                { label: 'CONTRATO', flex: 0.9  },
                { label: 'NOMBRE',   flex: 2.6  },
                { label: 'TIPO',     flex: 0.8  },
                { label: 'ESTADO',   flex: 0.9  },
                { label: 'PLAN',     flex: 1.1  },
                { label: 'SESIONES', flex: 0.55 },
                { label: 'EMAIL',    flex: 1.6  },
                { label: 'ACCIONES', flex: 1.0, align: 'right' as const },
              ].map((col) => (
                <View key={col.label} style={{ flex: col.flex, paddingHorizontal: 4, alignItems: (col as any).align === 'right' ? 'flex-end' : 'flex-start' }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 11, fontWeight: '800',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    fontFamily: 'Montserrat-SemiBold',
                  }}>
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Table rows */}
            {visibleUsers.map((user) => {
              const roleMeta = getRoleMeta(user.role, theme);
              const statusMeta = getStatusMeta(user.status, theme);
              return (
                <View key={user.id} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
                  backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)',
                  borderRadius: 8, marginBottom: 3,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.26)',
                }}>
                  {/* CONTRATO */}
                  <View style={{ flex: 0.9, paddingHorizontal: 4 }}>
                    <Text style={{ color: user.contrato ? (isDark ? theme.text : theme.text) : (isDark ? theme.textMuted : theme.textMuted), fontSize: 13, fontWeight: user.contrato ? '600' : '400', fontFamily: FONT_FAMILY.bodySemiBold }} numberOfLines={1}>{user.contrato || '—'}</Text>
                  </View>

                  {/* NOMBRE — round avatar + name */}
                  <View style={{ flex: 2.6, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 4 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: AVATAR_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.22)', flexShrink: 0 }}>
                      <Text style={{ color: AVATAR_TEXT, fontSize: 11, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>{initials(user.nombre)}</Text>
                    </View>
                    <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold, flex: 1 }} numberOfLines={1}>{user.nombre}</Text>
                  </View>

                  {/* TIPO — derivado de isSubscriber (fuente: BD) */}
                  <View style={{ flex: 0.8, paddingHorizontal: 4 }}>
                    {(() => { const t = getTipoMeta(user, theme); return (
                      <View style={{ backgroundColor: t.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
                        <Text style={{ color: t.color, fontSize: 13, fontWeight: '600', fontFamily: 'Montserrat-SemiBold' }}>{t.label}</Text>
                      </View>
                    ); })()}
                  </View>

                  {/* ESTADO */}
                  <View style={{ flex: 0.9, paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: statusMeta.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
                      <Text style={{ color: statusMeta.color, fontSize: 13, fontWeight: '600', fontFamily: 'Montserrat-SemiBold' }}>{statusMeta.label}</Text>
                    </View>
                  </View>

                  {/* PLAN — accent color */}
                  <View style={{ flex: 1.1, paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#1A1A2E', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase', fontFamily: 'Montserrat-SemiBold' }} numberOfLines={1}>{user.plan}</Text>
                    </View>
                  </View>

                  {/* SESIONES */}
                  <View style={{ flex: 0.55, paddingHorizontal: 4 }}>
                    <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>{user.sesiones}/{user.maxDevices}</Text>
                  </View>

                  {/* EMAIL */}
                  <View style={{ flex: 1.6, paddingHorizontal: 4 }}>
                    <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13 }} numberOfLines={1}>{user.email}</Text>
                  </View>

                  {/* Inline Actions */}
                  <View style={{ flex: 1.0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingHorizontal: 4 }}>
                    <TouchableOpacity
                      style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,184,0,0.28)', backgroundColor: 'rgba(255,184,0,0.07)', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => { setDetailUserId(user.id); setShowDetailModal(true); }}
                    >
                      <FontAwesome name="eye" size={12} color="#FFB800" />
                    </TouchableOpacity>
                    {canWrite && (
                      <>
                        <TouchableOpacity
                          style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,121,0,0.3)', backgroundColor: 'rgba(255,121,0,0.08)', alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => setRecoveryUser(user)}
                        >
                          <FontAwesome name="lock" size={12} color="#FF7900" />
                        </TouchableOpacity>
                        {(user.status === 'active' || user.status === 'inactive') && (
                          <TouchableOpacity
                            style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: user.status === 'active' ? 'rgba(209,16,90,0.3)' : 'rgba(23,209,198,0.3)', backgroundColor: user.status === 'active' ? 'rgba(209,16,90,0.08)' : 'rgba(23,209,198,0.08)', alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => handleDeactivate(user)}
                          >
                            <FontAwesome name={user.status === 'active' ? 'ban' : 'check-circle'} size={12} color={user.status === 'active' ? '#D1105A' : '#17D1C6'} />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {!loading && filteredUsers.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 4 }}>
            <Text style={{ color: isDark ? theme.textMuted : theme.textSec, fontSize: 13 }}>
              {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} de {filteredUsers.length} usuarios
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((p) => p - 1)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: currentPage === 1 ? 'transparent' : (isDark ? theme.liftBg : '#fff'), opacity: currentPage === 1 ? 0.35 : 1 }}
              >
                <FontAwesome name="chevron-left" size={12} color={isDark ? theme.textSec : '#240046'} />
              </TouchableOpacity>
              <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '700', minWidth: 60, textAlign: 'center' }}>
                {currentPage} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((p) => p + 1)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: currentPage === totalPages ? 'transparent' : (isDark ? theme.liftBg : '#fff'), opacity: currentPage === totalPages ? 0.35 : 1 }}
              >
                <FontAwesome name="chevron-right" size={12} color={isDark ? theme.textSec : '#240046'} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <UserFormModal
        visible={showFormModal}
        initialData={editingUser}
        plans={plans}
        onClose={() => { setShowFormModal(false); setEditingUser(null); }}
        onSave={handleSaveUser}
      />

      <UserDetailModal
        visible={showDetailModal}
        accessToken={accessToken}
        userId={detailUserId}
        canWrite={canWrite}
        plans={plans}
        sessionsByUser={sessionsByUser}
        onClose={() => { setShowDetailModal(false); setDetailUserId(null); }}
        onUserUpdated={updateUserInList}
        onSessionsUpdated={updateSessionsForUser}
        onRequestConfirm={openConfirm}
      />

      {confirmState ? <ConfirmModal state={confirmState} onClose={closeConfirm} /> : null}
      {recoveryUser ? <RecoveryModal user={recoveryUser} accessToken={accessToken ?? ''} onClose={() => setRecoveryUser(null)} onFeedback={(fb) => { setFeedback(fb); }} onUserUpdated={(u) => { updateUserInList(u); setRecoveryUser(u); }} /> : null}
    </CmsShell>
  );
}
