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
import CmsShell, { C } from '../../components/cms/CmsShell';
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

type UserType = 'system' | 'subscriber';
type UserTypeFilter = 'all' | UserType;
type RoleFilter = 'all' | AdminUser['role'];
type StatusFilter = 'all' | AdminUser['status'];
type DetailTab = 'perfil' | 'seguridad' | 'sesiones' | 'comercial';
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

function avatarColor(name: string) {
  const palette = ['#FFB800', '#B490FF', '#10B981', '#FFDA6B', '#F43F5E', '#8B72B2', '#D0C4E8', '#7B2FBE'];
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = name.charCodeAt(index) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permissions) return false;
  return permissions.includes('cms:*') || permissions.includes(permission);
}

function getUserType(user: Pick<AdminUser, 'isCmsUser' | 'isSubscriber'>): UserType {
  return user.isCmsUser ? 'system' : 'subscriber';
}

function getUserTypeMeta(user: Pick<AdminUser, 'isCmsUser' | 'isSubscriber'>) {
  const userType = getUserType(user);
  if (userType === 'system') return { label: 'Interno', color: C.accentLight, bg: C.accentSoft };
  return { label: 'Abonado', color: C.cyan, bg: C.cyanSoft };
}

function getRoleMeta(role: AdminUser['role']) {
  if (role === 'superadmin') return { label: 'Superadmin', color: C.rose, bg: C.roseSoft };
  if (role === 'soporte') return { label: 'Soporte', color: C.green, bg: C.greenSoft };
  return { label: 'Cliente', color: C.textDim, bg: C.lift };
}

function getStatusMeta(status: AdminUser['status']) {
  if (status === 'active') return { label: 'Activo', color: C.green, bg: C.greenSoft };
  if (status === 'suspended') return { label: 'Suspendido', color: C.rose, bg: C.roseSoft };
  if (status === 'pending') return { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.16)' };
  return { label: 'Inactivo', color: C.amber, bg: 'rgba(245,158,11,0.16)' };
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
  const seed = Math.random().toString(36).slice(-6).toUpperCase();
  return `Luki!${seed}9`;
}

function fieldBase(webInput: object) {
  return {
    backgroundColor: C.lift,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    ...webInput,
  };
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.lift, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 }}>
      <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
      {subtitle ? <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4, marginBottom: 12 }}>{subtitle}</Text> : <View style={{ height: 12 }} />}
      {children}
    </View>
  );
}

function FilterChip({ active, label, onPress, tone = 'accent' }: { active: boolean; label: string; onPress: () => void; tone?: 'accent' | 'cyan' | 'neutral' }) {
  const activeColor = tone === 'cyan' ? C.cyan : tone === 'neutral' ? C.text : C.accentLight;
  const activeBg = tone === 'cyan' ? C.cyanSoft : tone === 'neutral' ? C.surfaceAlt : C.accentSoft;
  const activeBorder = tone === 'cyan' ? C.cyan : tone === 'neutral' ? C.border : C.accent;

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: active ? activeBg : C.lift,
        borderWidth: 1,
        borderColor: active ? activeBorder : C.border,
      }}
      onPress={onPress}
    >
      <Text style={{ color: active ? activeColor : C.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function DropdownFilter({ label, value, options, onSelect }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
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
          backgroundColor: isFiltered ? C.accentSoft : C.lift,
          borderWidth: 1,
          borderColor: isFiltered ? C.accentBorder : C.border,
        }}
      >
        <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700' }}>{label}:</Text>
        <Text style={{ color: isFiltered ? C.accent : C.text, fontSize: 12, fontWeight: '700' }}>{selectedLabel}</Text>
        <FontAwesome name={open ? 'chevron-up' : 'chevron-down'} size={9} color={C.muted} />
      </TouchableOpacity>

      {open ? (
        <>
          {/* Invisible overlay to close on outside tap */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setOpen(false)}
            style={{ position: 'fixed' as never, top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          />
          <View style={{
            position: 'absolute',
            top: 42,
            left: 0,
            minWidth: 160,
            backgroundColor: C.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            shadowColor: '#0D0020',
            shadowOpacity: 0.5,
            shadowRadius: 20,
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
                  backgroundColor: value === option.value ? C.lift : 'transparent',
                  borderBottomWidth: i < options.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ color: value === option.value ? C.accent : C.textDim, fontSize: 12, fontWeight: value === option.value ? '800' : '600' }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function RecoveryModal({ user, accessToken, onClose, onFeedback, onUserUpdated }: { user: AdminUser; accessToken: string; onClose: () => void; onFeedback: (fb: Feedback) => void; onUserUpdated: (u: AdminUser) => void }) {
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);
  const [telefono, setTelefono] = useState(user.telefono ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = { backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.accent, color: C.text, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, ...webInput };
  const hasChanges = nombre !== user.nombre || email.trim() !== user.email || telefono !== (user.telefono ?? '');

  const handleSavePersonalData = async () => {
    if (!nombre.trim() || !email.trim()) { onFeedback({ type: 'error', message: 'Nombre y email son requeridos.' }); return; }
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
    setSending(true);
    try {
      const result = await adminSendRecoveryCode(email.trim());
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 24, width: 460, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome name="lock" size={16} color={C.accentLight} />
              </View>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>Recuperación de contraseña</Text>
            </View>
            <TouchableOpacity onPress={onClose}><FontAwesome name="times" size={16} color={C.muted} /></TouchableOpacity>
          </View>

          <View style={{ backgroundColor: C.lift, borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: C.textDim, fontSize: 11, fontWeight: '700' }}>DATOS PERSONALES</Text>
              {!editing ? (
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: C.cyanSoft, borderWidth: 1, borderColor: 'rgba(180,144,255,0.24)' }} onPress={() => setEditing(true)}>
                  <FontAwesome name="pencil" size={10} color={C.cyan} />
                  <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700' }}>Editar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {editing ? (
              <View style={{ gap: 10 }}>
                <View>
                  <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>NOMBRE</Text>
                  <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} autoFocus />
                </View>
                <View>
                  <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>EMAIL</Text>
                  <TextInput style={inputStyle} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View>
                  <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>TELÉFONO</Text>
                  <TextInput style={inputStyle} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={() => { setNombre(user.nombre); setEmail(user.email); setTelefono(user.telefono ?? ''); setEditing(false); }}>
                    <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 6, backgroundColor: hasChanges ? C.accent : C.accentSoft, alignItems: 'center', opacity: saving ? 0.6 : 1 }} onPress={handleSavePersonalData} disabled={saving || !hasChanges}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: hasChanges ? '#fff' : C.accentLight, fontSize: 12, fontWeight: '700' }}>Guardar cambios</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, width: 65 }}>Nombre</Text>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{user.nombre}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, width: 65 }}>Email</Text>
                  <Text style={{ color: C.accentLight, fontSize: 13, fontWeight: '600', flex: 1 }}>{user.email}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, width: 65 }}>Teléfono</Text>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600', flex: 1 }}>{user.telefono || '—'}</Text>
                </View>
              </View>
            )}
          </View>

          {generatedCode ? (
            <View style={{ backgroundColor: 'rgba(180,144,255,0.08)', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(180,144,255,0.25)' }}>
              <Text style={{ color: C.textDim, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>CÓDIGO DE RECUPERACIÓN</Text>
              <Text style={{ color: C.accentLight, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 4, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>{generatedCode}</Text>
              <Text style={{ color: C.textDim, fontSize: 11, marginTop: 6, textAlign: 'center' }}>Comparte este código con el usuario de forma segura.</Text>
            </View>
          ) : codeSent ? (
            <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' }}>
              <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Código enviado correctamente a {email.trim()}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '700' }}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: codeSent ? C.accentSoft : C.accent, alignItems: 'center', opacity: (sending || editing) ? 0.6 : 1 }}
              onPress={handleSendCode}
              disabled={sending || editing}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: codeSent ? C.accentLight : '#fff', fontSize: 13, fontWeight: '700' }}>
                  {codeSent ? 'Generar nuevo código' : 'Generar clave temporal'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmModal({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
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
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 22 }}>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{state.title}</Text>
          <Text style={{ color: C.textDim, fontSize: 13, marginTop: 8, lineHeight: 20 }}>{state.message}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={onClose} disabled={loading}>
              <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: state.tone === 'danger' ? C.rose : C.accent,
                opacity: loading ? 0.7 : 1,
              }}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{state.confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UserFormModal({ visible, initialData, plans, onClose, onSave }: UserFormModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [userType, setUserType] = useState<UserType>('subscriber');
  const [role, setRole] = useState<AdminUser['role']>('soporte');
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
  const baseInput = fieldBase(webInput);
  const activePlans = useMemo(() => plans.filter((plan) => plan.activo), [plans]);
  const selectedCatalogPlan = useMemo(() => activePlans.find((plan) => plan.id === planId) ?? null, [activePlans, planId]);
  const contractLocked = Boolean(initialData?.isSubscriber && initialData?.contrato);

  useEffect(() => {
    if (!visible) return;
    const currentType = initialData ? getUserType(initialData) : 'subscriber';
    setNombre(initialData?.nombre ?? '');
    setEmail(initialData?.email ?? '');
    setTelefono(initialData?.telefono ?? '');
    setUserType(currentType);
    setRole(initialData?.role ?? (currentType === 'system' ? 'soporte' : 'cliente'));
    setStatus(initialData?.status ?? 'active');
    setPlanId(initialData?.planId ?? activePlans[0]?.id ?? '');
    setContrato(initialData?.contrato ?? '');
    setMaxDevices(String(initialData?.maxDevices ?? 3));
    setSessionDurationDays(String(initialData?.sessionDurationDays ?? (currentType === 'subscriber' ? 30 : 7)));
    setSessionLimitPolicy(initialData?.sessionLimitPolicy ?? 'block_new');
    previousPlanIdRef.current = initialData?.planId ?? activePlans[0]?.id ?? null;
    setError('');
  }, [visible, initialData, activePlans]);

  useEffect(() => {
    if (userType === 'system') {
      setRole((current) => (current === 'superadmin' || current === 'soporte' ? current : 'soporte'));
      setPlanId('');
      setContrato(initialData?.contrato ?? '');
      setMaxDevices('3');
      setSessionDurationDays(String(initialData?.sessionDurationDays ?? 7));
      setSessionLimitPolicy(initialData?.sessionLimitPolicy ?? 'block_new');
      previousPlanIdRef.current = null;
      return;
    }

    setRole((prev) => (prev === 'cliente' ? prev : 'cliente'));
    const selectedPlan = activePlans.find((plan) => plan.id === planId) ?? activePlans[0];
    if (selectedPlan && !planId) {
      setPlanId(selectedPlan.id);
      setMaxDevices(String(selectedPlan.maxDevices || 3));
    }
  }, [userType, planId, activePlans, initialData]);

  useEffect(() => {
    if (!visible || userType !== 'subscriber' || !selectedCatalogPlan) return;
    const planChanged = previousPlanIdRef.current !== selectedCatalogPlan.id;

    if (planChanged) {
      setMaxDevices(String(selectedCatalogPlan.maxDevices || 3));
      previousPlanIdRef.current = selectedCatalogPlan.id;
      return;
    }

    if (!initialData && !maxDevices.trim()) {
      setMaxDevices(String(selectedCatalogPlan.maxDevices || 3));
    }
  }, [visible, userType, selectedCatalogPlan, initialData]);

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son requeridos.');
      return;
    }

    if (userType === 'subscriber' && activePlans.length === 0) {
      setError('No hay planes disponibles en el catálogo. Crea o activa un plan en la sección Planes antes de guardar este abonado.');
      return;
    }

    const selectedPlan = activePlans.find((plan) => plan.id === planId);
    const payload: AdminUserPayload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim() || undefined,
      status,
      role,
      maxDevices: userType === 'subscriber' ? Math.max(1, Number(maxDevices) || 3) : 3,
      sessionDurationDays: Math.max(1, Number(sessionDurationDays) || (userType === 'subscriber' ? 30 : 7)),
      sessionLimitPolicy,
      planId: userType === 'subscriber' ? selectedPlan?.id : undefined,
      plan: userType === 'subscriber' ? selectedPlan?.nombre : 'Usuario CMS',
      contrato: userType === 'subscriber'
        ? (contractLocked ? initialData?.contrato ?? undefined : contrato.trim() || undefined)
        : undefined,
    };

    setLoading(true);
    setError('');
    try {
      await onSave(payload, { isSubscriber: userType === 'subscriber' });
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
        <View style={{ width: '100%', maxWidth: 860, maxHeight: '90%', backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{initialData ? 'Editar usuario' : 'Crear usuario'}</Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Refactor OTT por dominios: identidad, seguridad, sesiones y negocio.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <SectionCard title="Información básica" subtitle="Identidad principal del usuario o abonado.">
              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 6 }}>TIPO DE USUARIO</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[
                  { value: 'subscriber' as const, label: 'Abonado' },
                  { value: 'system' as const, label: 'Interno' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: userType === option.value ? C.accent : C.border,
                      backgroundColor: userType === option.value ? C.accentSoft : C.lift,
                      alignItems: 'center',
                    }}
                    onPress={() => setUserType(option.value)}
                  >
                    <Text style={{ color: userType === option.value ? C.accentLight : C.textDim, fontSize: 12, fontWeight: '700' }}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>NOMBRE COMPLETO</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="Ej: Juan Pérez" placeholderTextColor={C.muted} value={nombre} onChangeText={setNombre} />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>EMAIL</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="usuario@email.com" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>TELÉFONO</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="3001234567" placeholderTextColor={C.muted} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                </View>
              </View>
            </SectionCard>

            <SectionCard title="Acceso y seguridad" subtitle="Autorización, estado y políticas básicas de acceso.">
              {userType === 'system' ? (
                <>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 6 }}>ROL</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[
                      { value: 'soporte' as const, label: 'Soporte' },
                      { value: 'superadmin' as const, label: 'Superadmin' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: role === option.value ? C.cyan : C.border,
                          backgroundColor: role === option.value ? C.cyanSoft : C.lift,
                          alignItems: 'center',
                        }}
                        onPress={() => setRole(option.value)}
                      >
                        <Text style={{ color: role === option.value ? C.cyan : C.textDim, fontSize: 12, fontWeight: '700' }}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>Rol de abonado</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Los abonados usan el rol de negocio Cliente y no admiten edición manual de autorización.</Text>
                </View>
              )}

              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 6 }}>ESTADO</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { value: 'active' as const, label: 'Activo' },
                  { value: 'suspended' as const, label: 'Suspendido' },
                  { value: 'inactive' as const, label: 'Inactivo' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: status === option.value ? C.accent : C.border,
                      backgroundColor: status === option.value ? C.accentSoft : C.lift,
                      alignItems: 'center',
                    }}
                    onPress={() => setStatus(option.value)}
                  >
                    <Text style={{ color: status === option.value ? C.accentLight : C.textDim, fontSize: 12, fontWeight: '700' }}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            <SectionCard title="Sesiones" subtitle="Control de simultaneidad y dispositivos permitidos.">
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>SESIONES SIMULTÁNEAS</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="3" placeholderTextColor={C.muted} value={maxDevices} onChangeText={setMaxDevices} keyboardType="number-pad" editable={userType === 'subscriber'} />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>DURACIÓN DE SESIÓN (DÍAS)</Text>
                  <TextInput style={{ ...baseInput, marginBottom: 0 }} placeholder="30" placeholderTextColor={C.muted} value={sessionDurationDays} onChangeText={setSessionDurationDays} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1, minWidth: 220, justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 }}>
                    <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>Política aplicada</Text>
                    <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>
                      {userType === 'subscriber'
                        ? 'El límite es editable y se sincroniza con la cuenta comercial del abonado.'
                        : 'Los usuarios internos usan control interno y no exponen edición de sesiones comerciales.'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 12, marginBottom: 6 }}>AL EXCEDER EL LÍMITE</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'block_new' as const, label: 'Bloquear nuevo acceso' },
                  { value: 'replace_oldest' as const, label: 'Cerrar la sesión más antigua' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: sessionLimitPolicy === option.value ? C.cyan : C.border,
                      backgroundColor: sessionLimitPolicy === option.value ? C.cyanSoft : C.lift,
                    }}
                    onPress={() => setSessionLimitPolicy(option.value)}
                  >
                    <Text style={{ color: sessionLimitPolicy === option.value ? C.cyan : C.textDim, fontSize: 12, fontWeight: '700' }}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            <SectionCard title="Información comercial" subtitle="Plan, contrato y datos de negocio del abonado.">
              {userType === 'subscriber' ? (
                <>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 6 }}>PLAN DESDE CATÁLOGO</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 10 }}>
                    {initialData
                      ? 'Al editar puedes cambiar el plan del abonado usando cualquier plan activo del catálogo.'
                      : 'Selecciona el plan comercial que quieres asignar desde el catálogo activo.'}
                  </Text>

                  {activePlans.length > 0 ? (
                    <>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {activePlans.map((plan) => (
                          <TouchableOpacity
                            key={plan.id}
                            style={{
                              minWidth: 150,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: planId === plan.id ? C.cyan : C.border,
                              backgroundColor: planId === plan.id ? C.cyanSoft : C.lift,
                            }}
                            onPress={() => setPlanId(plan.id)}
                          >
                            <Text style={{ color: planId === plan.id ? C.cyan : C.text, fontSize: 12, fontWeight: '800' }}>{plan.nombre}</Text>
                            <Text style={{ color: planId === plan.id ? C.cyan : C.textDim, fontSize: 11, marginTop: 4 }}>
                              {plan.maxDevices} disp. · {plan.videoQuality} · {plan.moneda} {plan.precio}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {selectedCatalogPlan ? (
                        <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 12 }}>
                          <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>Plan seleccionado: {selectedCatalogPlan.nombre}</Text>
                          <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{selectedCatalogPlan.descripcion}</Text>
                          <Text style={{ color: C.textDim, fontSize: 12, marginTop: 8 }}>
                            Incluye {selectedCatalogPlan.maxDevices} dispositivos, {selectedCatalogPlan.maxConcurrentStreams} streams y calidad {selectedCatalogPlan.videoQuality}.
                          </Text>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={{ backgroundColor: C.roseSoft, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)', padding: 12, marginBottom: 12 }}>
                      <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>No hay planes activos disponibles en el catálogo.</Text>
                    </View>
                  )}

                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>CONTRATO / CÓDIGO</Text>
                  <TextInput
                    style={{ ...baseInput, opacity: contractLocked ? 0.6 : 1 }}
                    placeholder="Ej: CONTRACT-001"
                    placeholderTextColor={C.muted}
                    value={contrato}
                    onChangeText={setContrato}
                    editable={!contractLocked}
                    autoCapitalize="characters"
                  />
                  {contractLocked ? <Text style={{ color: C.amber, fontSize: 12, marginTop: -4 }}>Este contrato viene del sistema y no se puede editar manualmente.</Text> : null}
                </>
              ) : (
                <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 }}>
                  <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>Sin datos comerciales editables</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Los usuarios internos no usan plan ni contrato porque pertenecen al dominio de identidad y autorización.</Text>
                </View>
              )}
            </SectionCard>

            {error ? <Text style={{ color: C.rose, fontSize: 13 }}>{error}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={onClose}>
                <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', opacity: loading ? 0.7 : 1 }} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar cambios</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
  const [user, setUser] = useState<AdminUser | null>(null);
  const [plan, setPlan] = useState<AdminUserPlan | null>(null);
  const [sessions, setSessions] = useState<AdminUserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('perfil');

  const roleMeta = user ? getRoleMeta(user.role) : null;
  const userTypeMeta = user ? getUserTypeMeta(user) : null;
  const statusMeta = user ? getStatusMeta(user.status) : null;

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

  const askStatusChange = (status: AdminUser['status']) => {
    if (!accessToken || !user) return;
    const labels = { active: 'activar', suspended: 'suspender', inactive: 'desactivar' };
    onRequestConfirm({
      title: `Confirmar ${labels[status]}`,
      message: `Se actualizará el estado de ${user.nombre} a ${labels[status]}. Esta acción afecta acceso y operación del usuario.`,
      confirmLabel: labels[status].charAt(0).toUpperCase() + labels[status].slice(1),
      tone: status === 'active' ? 'primary' : 'danger',
      onConfirm: async () => {
        const updated = await adminUpdateUserStatus(accessToken, user.id, status);
        setUser(updated);
        onUserUpdated(updated);
        setFeedback({ type: 'success', message: 'Estado actualizado correctamente.' });
      },
    });
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
        setActiveTab('seguridad');
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

  const selectedCatalogPlan = user?.planId ? plans.find((catalogPlan) => catalogPlan.id === user.planId) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.76)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ width: '100%', maxWidth: 980, maxHeight: '90%', backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>Detalle de usuario</Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>User, Account, Session y Role/Permission en una sola consola.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <ActivityIndicator color={C.accent} size="large" />
                <Text style={{ color: C.textDim, marginTop: 12 }}>Cargando detalle del usuario…</Text>
              </View>
            ) : user ? (
              <>
                {feedback ? (
                  <View style={{ borderRadius: 12, padding: 12, backgroundColor: feedback.type === 'success' ? C.greenSoft : C.roseSoft, borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.24)' : 'rgba(244,63,94,0.24)' }}>
                    <Text style={{ color: feedback.type === 'success' ? C.green : C.rose, fontSize: 13, fontWeight: '700' }}>{feedback.message}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: 260, backgroundColor: C.lift, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: avatarColor(user.nombre), alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{initials(user.nombre)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{user.nombre}</Text>
                        <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{user.email}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      {userTypeMeta ? (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: userTypeMeta.bg }}>
                          <Text style={{ color: userTypeMeta.color, fontSize: 11, fontWeight: '700' }}>{userTypeMeta.label}</Text>
                        </View>
                      ) : null}
                      {roleMeta ? (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: roleMeta.bg }}>
                          <Text style={{ color: roleMeta.color, fontSize: 11, fontWeight: '700' }}>{roleMeta.label}</Text>
                        </View>
                      ) : null}
                      {statusMeta ? (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: statusMeta.bg }}>
                          <Text style={{ color: statusMeta.color, fontSize: 11, fontWeight: '700' }}>{statusMeta.label}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ flex: 1, minWidth: 260, backgroundColor: C.lift, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 }}>
                    <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 12 }}>Acciones seguras</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {canWrite ? (
                        <>
                          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: 'rgba(16,185,129,0.24)' }} onPress={() => askStatusChange('active')}>
                            <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>Activar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: C.roseSoft, borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)' }} onPress={() => askStatusChange('suspended')}>
                            <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>Suspender</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.16)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.24)' }} onPress={() => askStatusChange('inactive')}>
                            <Text style={{ color: C.amber, fontSize: 12, fontWeight: '700' }}>Desactivar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: C.accent, borderWidth: 1, borderColor: C.accent }} onPress={askPasswordReset}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Resetear contraseña</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <Text style={{ color: C.textDim, fontSize: 12 }}>Tu perfil tiene acceso de lectura para este módulo.</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'perfil' as const, label: 'Perfil' },
                    { id: 'seguridad' as const, label: 'Seguridad' },
                    { id: 'sesiones' as const, label: 'Dispositivos y sesiones' },
                    { id: 'comercial' as const, label: 'Plan / contrato' },
                  ].map((tab) => (
                    <FilterChip key={tab.id} active={activeTab === tab.id} label={tab.label} onPress={() => setActiveTab(tab.id)} tone={activeTab === tab.id ? 'accent' : 'neutral'} />
                  ))}
                </View>

                {activeTab === 'perfil' ? (
                  <SectionCard title="Perfil" subtitle="Dominio User: identidad, tipo y atributos principales.">
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Nombre: <Text style={{ color: C.text }}>{user.nombre}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Tipo: <Text style={{ color: C.text }}>{userTypeMeta?.label}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Rol: <Text style={{ color: C.text }}>{roleMeta?.label}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Estado: <Text style={{ color: C.text }}>{statusMeta?.label}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Email: <Text style={{ color: C.text }}>{user.email}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Teléfono: <Text style={{ color: C.text }}>{user.telefono ?? 'N/A'}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Último acceso: <Text style={{ color: C.text }}>{fmtDate(user.lastLoginAt)}</Text></Text>
                    </View>
                  </SectionCard>
                ) : null}

                {activeTab === 'seguridad' ? (
                  <SectionCard title="Seguridad" subtitle="Role/Permission y eventos críticos del acceso.">
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Rol actual: <Text style={{ color: C.text }}>{roleMeta?.label}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>MFA: <Text style={{ color: C.text }}>{user.mfaEnabled ? 'Activo' : 'No configurado'}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Bloqueo: <Text style={{ color: C.text }}>{user.isLocked ? `Hasta ${fmtDate(user.lockedUntil)}` : 'No'}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Cambio obligatorio de contraseña: <Text style={{ color: C.text }}>{user.mustChangePassword ? 'Sí' : 'No'}</Text></Text>
                    </View>
                    {canWrite ? (
                      <TouchableOpacity style={{ marginTop: 14, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: C.accent }} onPress={askPasswordReset}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Generar reset seguro</Text>
                      </TouchableOpacity>
                    ) : null}
                  </SectionCard>
                ) : null}

                {activeTab === 'sesiones' ? (
                  <SectionCard title="Dispositivos y sesiones" subtitle="Dominio Session/Device: actividad por dispositivo y cierres controlados.">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                      <View>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{getDeviceCount(sessions)} dispositivos activos</Text>
                        <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Límite permitido: {user.maxDevices} sesiones simultáneas.</Text>
                        <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Duración: {user.sessionDurationDays} días · Política: {user.sessionLimitPolicy === 'replace_oldest' ? 'Cerrar la más antigua' : 'Bloquear nuevo acceso'}</Text>
                      </View>
                      {canWrite ? (
                        <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.roseSoft, borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)' }} onPress={askRevokeAllSessions}>
                          <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>Cerrar todas</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {sessions.length === 0 ? (
                      <Text style={{ color: C.textDim, fontSize: 12 }}>No hay sesiones registradas para este usuario.</Text>
                    ) : (
                      sessions.map((session) => (
                        <View key={session.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{session.deviceId}</Text>
                            <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Canal: {session.audience} · Inicio: {fmtDate(session.createdAt)} · Expira: {fmtDate(session.expiresAt)}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: session.status === 'active' ? C.greenSoft : session.status === 'revoked' ? C.roseSoft : 'rgba(245,158,11,0.16)' }}>
                              <Text style={{ color: session.status === 'active' ? C.green : session.status === 'revoked' ? C.rose : C.amber, fontSize: 11, fontWeight: '700' }}>{session.status}</Text>
                            </View>
                            {canWrite ? (
                              <TouchableOpacity style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, opacity: session.status === 'active' ? 1 : 0.5 }} disabled={session.status !== 'active'} onPress={() => askRevokeSession(session)}>
                                <FontAwesome name="power-off" size={13} color={session.status === 'active' ? C.rose : C.muted} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </SectionCard>
                ) : null}

                {activeTab === 'comercial' ? (
                  <SectionCard title="Plan y contrato" subtitle="Dominio Account/Subscription: catálogo, contrato y capacidad comercial.">
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Plan actual: <Text style={{ color: C.text }}>{plan?.nombre ?? user.plan}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Contrato / código: <Text style={{ color: C.text }}>{user.contrato ?? 'N/A'}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Sesiones simultáneas: <Text style={{ color: C.text }}>{user.maxDevices}</Text></Text>
                      <Text style={{ color: C.textDim, fontSize: 12 }}>Plan desde catálogo: <Text style={{ color: C.text }}>{selectedCatalogPlan?.nombre ?? 'Sin coincidencia'}</Text></Text>
                    </View>
                    {plan ? (
                      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                        <Text style={{ color: C.textDim, fontSize: 12 }}>Dispositivos: <Text style={{ color: C.text }}>{plan.maxDevices}</Text></Text>
                        <Text style={{ color: C.textDim, fontSize: 12 }}>Streams: <Text style={{ color: C.text }}>{plan.maxConcurrentStreams}</Text></Text>
                        <Text style={{ color: C.textDim, fontSize: 12 }}>Perfiles: <Text style={{ color: C.text }}>{plan.maxProfiles}</Text></Text>
                        <Text style={{ color: C.textDim, fontSize: 12 }}>Calidad: <Text style={{ color: C.text }}>{plan.videoQuality}</Text></Text>
                      </View>
                    ) : null}
                  </SectionCard>
                ) : null}
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: C.textDim }}>No hay detalle disponible para este usuario.</Text>
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
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [sessionsByUser, setSessionsByUser] = useState<SessionsByUser>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pageSize, setPageSize] = useState(50);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [recoveryUser, setRecoveryUser] = useState<AdminUser | null>(null);

  const canWrite = hasPermission(profile?.permissions, 'cms:users:write');
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);

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

      const sessionsEntries = await Promise.all(
        usersData.map(async (user) => {
          try {
            const sessions = await adminListUserSessions(accessToken, user.id);
            return [user.id, sessions] as const;
          } catch {
            return [user.id, []] as const;
          }
        }),
      );

      setUsers(usersData);
      setPlans(plansData);
      setSessionsByUser(Object.fromEntries(sessionsEntries));
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
      const userType = getUserType(user);
      const query = search.trim().toLowerCase();

      if (userTypeFilter !== 'all' && userType !== userTypeFilter) return false;
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      if (!query) return true;

      return [
        user.nombre,
        user.email,
        user.telefono ?? '',
        user.contrato ?? '',
        user.plan,
        getRoleMeta(user.role).label,
        getUserTypeMeta(user).label,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [users, search, userTypeFilter, roleFilter, statusFilter]);

  const visibleUsers = filteredUsers.slice(0, pageSize);

  const stats = {
    total: users.length,
    internal: users.filter((user) => user.isCmsUser).length,
    subscribers: users.filter((user) => user.isSubscriber).length,
    suspended: users.filter((user) => user.status === 'suspended').length,
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

  const exportCSV = () => {
    if (Platform.OS !== 'web') return;
    const header = 'Nombre,Tipo,Rol,Estado,Plan,Sesiones,Dispositivos,Email,Telefono,Contrato,UltimoAcceso\n';
    const rows = filteredUsers
      .map((user) => {
        const sessions = sessionsByUser[user.id] ?? [];
        return [
          user.nombre,
          getUserTypeMeta(user).label,
          getRoleMeta(user.role).label,
          getStatusMeta(user.status).label,
          user.plan,
          `${user.sesiones}/${user.maxDevices}`,
          getDeviceSummary(sessions),
          user.email,
          user.telefono ?? '',
          user.contrato ?? '',
          fmtDate(user.lastLoginAt),
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'usuarios-luki-play.csv';
    link.click();
    URL.revokeObjectURL(url);
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

  const handleDeactivate = (user: AdminUser) => {
    if (!accessToken || !canWrite) return;
    openConfirm({
      title: 'Desactivar usuario',
      message: `Se desactivará a ${user.nombre}. Esta acción es reversible, pero bloqueará su operación actual.`,
      confirmLabel: 'Desactivar',
      tone: 'danger',
      onConfirm: async () => {
        const updated = await adminUpdateUserStatus(accessToken, user.id, 'inactive');
        updateUserInList(updated);
        setFeedback({ type: 'success', message: 'Usuario desactivado correctamente.' });
      },
    });
  };

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Usuarios', path: '/cms/users' }, { label: 'Gestión OTT' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <View style={{ maxWidth: 680 }}>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>Usuarios</Text>
            <Text style={{ color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              Consola unificada para identidad, negocio OTT, sesiones por dispositivo y autorización administrativa.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.greenSoft, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.32)' }} onPress={exportCSV}>
              <FontAwesome name="download" size={13} color={C.green} />
              <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>Exportar</Text>
            </TouchableOpacity>
            {canWrite ? (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => { setEditingUser(null); setShowFormModal(true); }}>
                <FontAwesome name="plus" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Crear usuario</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {feedback ? (
          <View style={{ marginBottom: 16, borderRadius: 12, padding: 12, backgroundColor: feedback.type === 'success' ? C.greenSoft : C.roseSoft, borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.24)' : 'rgba(244,63,94,0.24)' }}>
            <Text style={{ color: feedback.type === 'success' ? C.green : C.rose, fontSize: 13, fontWeight: '700' }}>{feedback.message}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { label: 'Total', value: stats.total, icon: 'users', tone: C.accentLight, bg: C.accentSoft, warn: false },
            { label: 'Internos', value: stats.internal, icon: 'shield', tone: C.green, bg: C.greenSoft, warn: false },
            { label: 'Abonados', value: stats.subscribers, icon: 'play-circle', tone: C.cyan, bg: C.cyanSoft, warn: false },
            { label: 'Suspendidos', value: stats.suspended, icon: 'exclamation-triangle', tone: C.rose, bg: C.roseSoft, warn: stats.suspended > stats.total * 0.3 },
          ].map((card) => (
            <View key={card.label} style={{
              flex: 1, minWidth: 180, backgroundColor: C.surface, borderRadius: 12, padding: 16,
              borderWidth: card.warn ? 2 : 1,
              borderColor: card.warn ? 'rgba(244,63,94,0.5)' : C.border,
              ...(card.warn ? { shadowColor: '#F43F5E', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } } : {}),
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name={card.icon as never} size={16} color={card.tone} />
                </View>
                {card.warn ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.roseSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <FontAwesome name="warning" size={10} color={C.rose} />
                    <Text style={{ color: C.rose, fontSize: 10, fontWeight: '700' }}>Alto</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>{card.value}</Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border, marginBottom: 16, zIndex: 50, elevation: 50 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search — prominent, left */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, flex: 1, minWidth: 240 }}>
              <FontAwesome name="search" size={13} color={C.muted} />
              <TextInput style={{ flex: 1, color: C.text, paddingVertical: 10, paddingHorizontal: 10, fontSize: 13, ...webInput }} placeholder="Buscar nombre, email, rol, plan..." placeholderTextColor={C.muted} value={search} onChangeText={setSearch} />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <FontAwesome name="times-circle" size={14} color={C.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dropdown-style compact filters */}
            <DropdownFilter
              label="Tipo"
              value={userTypeFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'subscriber', label: 'Abonados' },
                { value: 'system', label: 'Internos' },
              ]}
              onSelect={(v) => setUserTypeFilter(v as UserTypeFilter)}
            />

            <DropdownFilter
              label="Rol"
              value={roleFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'superadmin', label: 'Superadmin' },
                { value: 'soporte', label: 'Soporte' },
                { value: 'cliente', label: 'Cliente' },
              ]}
              onSelect={(v) => setRoleFilter(v as RoleFilter)}
            />

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

            {/* Page size compact */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[25, 50, 100].map((size) => (
                <TouchableOpacity key={size} style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: pageSize === size ? C.accent : C.lift, borderWidth: 1, borderColor: pageSize === size ? C.accent : C.border }} onPress={() => setPageSize(size)}>
                  <Text style={{ color: pageSize === size ? '#160035' : C.textDim, fontSize: 11, fontWeight: '700' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Active filter count + clear */}
            {(userTypeFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all' || search) ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: C.roseSoft, borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)' }}
                onPress={() => { setSearch(''); setUserTypeFilter('all'); setRoleFilter('all'); setStatusFilter('all'); }}
              >
                <FontAwesome name="times" size={10} color={C.rose} />
                <Text style={{ color: C.rose, fontSize: 11, fontWeight: '700' }}>Limpiar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={{ color: C.muted, marginTop: 14, fontSize: 14 }}>Cargando usuarios…</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <FontAwesome name="user-times" size={36} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>Sin resultados</Text>
            <Text style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>Ajusta filtros o crea un nuevo usuario si tienes permisos.</Text>
          </View>
        ) : (
          <>
            {/* Bulk action bar */}
            {selectedIds.size > 0 && canWrite ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, backgroundColor: C.accentSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.accentBorder }}>
                <Text style={{ color: C.accent, fontSize: 13, fontWeight: '800' }}>{selectedIds.size} seleccionados</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: 'rgba(16,185,129,0.24)' }}
                  onPress={() => {
                    if (!accessToken) return;
                    openConfirm({
                      title: 'Activar usuarios',
                      message: `Se activarán ${selectedIds.size} usuarios seleccionados.`,
                      confirmLabel: 'Activar',
                      tone: 'primary',
                      onConfirm: async () => {
                        for (const id of selectedIds) {
                          const updated = await adminUpdateUserStatus(accessToken, id, 'active');
                          updateUserInList(updated);
                        }
                        setSelectedIds(new Set());
                        setFeedback({ type: 'success', message: `${selectedIds.size} usuarios activados.` });
                      },
                    });
                  }}
                >
                  <FontAwesome name="check" size={11} color={C.green} />
                  <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>Activar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.roseSoft, borderWidth: 1, borderColor: 'rgba(244,63,94,0.24)' }}
                  onPress={() => {
                    if (!accessToken) return;
                    openConfirm({
                      title: 'Suspender usuarios',
                      message: `Se suspenderán ${selectedIds.size} usuarios seleccionados.`,
                      confirmLabel: 'Suspender',
                      tone: 'danger',
                      onConfirm: async () => {
                        for (const id of selectedIds) {
                          const updated = await adminUpdateUserStatus(accessToken, id, 'suspended');
                          updateUserInList(updated);
                        }
                        setSelectedIds(new Set());
                        setFeedback({ type: 'success', message: `${selectedIds.size} usuarios suspendidos.` });
                      },
                    });
                  }}
                >
                  <FontAwesome name="ban" size={11} color={C.rose} />
                  <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>Suspender</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}
                  onPress={() => setSelectedIds(new Set())}
                >
                  <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Table header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.lift, borderRadius: 8, marginBottom: 4 }}>
              {canWrite ? (
                <TouchableOpacity
                  style={{ width: 32, alignItems: 'center' }}
                  onPress={() => {
                    if (selectedIds.size === visibleUsers.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(visibleUsers.map((u) => u.id)));
                    }
                  }}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 4, borderWidth: 2,
                    borderColor: selectedIds.size > 0 ? C.accent : C.muted,
                    backgroundColor: selectedIds.size === visibleUsers.length ? C.accent : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selectedIds.size === visibleUsers.length ? <FontAwesome name="check" size={10} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
              ) : null}
              {[
                { label: 'CONTRATO', flex: 1.2 },
                { label: 'NOMBRE', flex: 2 },
                { label: 'ROL', flex: 1 },
                { label: 'ESTADO', flex: 1 },
                { label: 'PLAN', flex: 1 },
                { label: 'SESIONES', flex: 0.7 },
                { label: 'EMAIL', flex: 1.6 },
                { label: '', flex: 0.4 },
              ].map((col) => (
                <View key={col.label || 'menu'} style={{ flex: col.flex, paddingHorizontal: 4 }}>
                  <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 }}>{col.label}</Text>
                </View>
              ))}
            </View>

            {/* Table rows */}
            {visibleUsers.map((user) => {
              const roleMeta = getRoleMeta(user.role);
              const statusMeta = getStatusMeta(user.status);
              const isSelected = selectedIds.has(user.id);
              const isMenuOpen = actionMenuUserId === user.id;

              return (
                <View key={user.id} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
                  backgroundColor: isSelected ? C.accentSoft : C.surface,
                  borderRadius: 8, marginBottom: 3, borderWidth: 1,
                  borderColor: isSelected ? C.accentBorder : C.border,
                }}>
                  {/* Checkbox */}
                  {canWrite ? (
                    <TouchableOpacity
                      style={{ width: 32, alignItems: 'center' }}
                      onPress={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(user.id)) next.delete(user.id);
                          else next.add(user.id);
                          return next;
                        });
                      }}
                    >
                      <View style={{
                        width: 18, height: 18, borderRadius: 4, borderWidth: 2,
                        borderColor: isSelected ? C.accent : C.muted,
                        backgroundColor: isSelected ? C.accent : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected ? <FontAwesome name="check" size={10} color="#fff" /> : null}
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {/* CONTRATO */}
                  <View style={{ flex: 1.2, paddingHorizontal: 4 }}>
                    <Text style={{ color: user.contrato ? C.text : C.muted, fontSize: 12, fontWeight: user.contrato ? '600' : '400' }} numberOfLines={1}>{user.contrato || '—'}</Text>
                  </View>

                  {/* NOMBRE (avatar + name + type badge) */}
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: avatarColor(user.nombre), alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{initials(user.nombre)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{user.nombre}</Text>
                      <Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{getUserTypeMeta(user).label}</Text>
                    </View>
                  </View>

                  {/* ROL */}
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: roleMeta.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
                      <Text style={{ color: roleMeta.color, fontSize: 11, fontWeight: '700' }}>{roleMeta.label}</Text>
                    </View>
                  </View>

                  {/* ESTADO */}
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: statusMeta.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' }}>
                      <Text style={{ color: statusMeta.color, fontSize: 11, fontWeight: '700' }}>{statusMeta.label}</Text>
                    </View>
                  </View>

                  {/* PLAN */}
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <View style={{ backgroundColor: C.cyanSoft, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                      <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700' }}>{user.plan}</Text>
                    </View>
                  </View>

                  {/* SESIONES */}
                  <View style={{ flex: 0.7, paddingHorizontal: 4 }}>
                    <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>{user.sesiones}/{user.maxDevices}</Text>
                  </View>

                  {/* EMAIL */}
                  <View style={{ flex: 1.6, paddingHorizontal: 4 }}>
                    <Text style={{ color: C.textDim, fontSize: 11 }} numberOfLines={1}>{user.email}</Text>
                  </View>

                  {/* Action menu "..." */}
                  <View style={{ flex: 0.4, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isMenuOpen ? C.lift : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => setActionMenuUserId(isMenuOpen ? null : user.id)}
                    >
                      <FontAwesome name="ellipsis-h" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {!loading && filteredUsers.length > 0 ? (
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            Mostrando {Math.min(visibleUsers.length, filteredUsers.length)} de {filteredUsers.length} usuarios
          </Text>
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
      {recoveryUser ? <RecoveryModal user={recoveryUser} accessToken={accessToken} onClose={() => setRecoveryUser(null)} onFeedback={(fb) => { setFeedback(fb); }} onUserUpdated={updateUserInList} /> : null}

      {/* Action menu modal */}
      {actionMenuUserId ? (() => {
        const menuUser = users.find((u) => u.id === actionMenuUserId);
        if (!menuUser) return null;
        const actions = [
          { icon: 'eye', label: 'Ver detalle', color: C.accentLight, action: () => { setDetailUserId(menuUser.id); setShowDetailModal(true); } },
          ...(canWrite ? [
            { icon: 'pencil', label: 'Editar', color: C.cyan, action: () => { setEditingUser(menuUser); setShowFormModal(true); } },
            { icon: 'lock', label: 'Recuperar contraseña', color: '#fbbf24', action: () => setRecoveryUser(menuUser) },
            { icon: 'power-off', label: 'Desactivar', color: C.rose, action: () => handleDeactivate(menuUser) },
          ] : []),
        ];
        return (
          <Modal visible transparent animationType="none" onRequestClose={() => setActionMenuUserId(null)}>
            <TouchableOpacity activeOpacity={1} onPress={() => setActionMenuUserId(null)} style={{ flex: 1 }}>
              <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 260, justifyContent: 'center', paddingRight: 24 }}>
                <View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#0D0020', shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: -4, height: 8 } }}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.lift }}>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>{menuUser.nombre}</Text>
                    <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{menuUser.email}</Text>
                  </View>
                  {actions.map((item, i) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => { setActionMenuUserId(null); item.action(); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        paddingHorizontal: 16, paddingVertical: 13,
                        borderBottomWidth: i < actions.length - 1 ? 1 : 0, borderBottomColor: C.border,
                      }}
                    >
                      <FontAwesome name={item.icon as never} size={13} color={item.color} />
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        );
      })() : null}
    </CmsShell>
  );
}
