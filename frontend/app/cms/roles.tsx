import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { AdminUser, AdminUserPayload, adminCreateUser, adminListUsers, adminUpdateUser } from '../../services/api/adminApi';
import { useCmsStore } from '../../services/cmsStore';

type CmsRole = 'superadmin' | 'admin' | 'soporte';
type TabKey = 'roles' | 'usuarios';

type CmsModule = {
  key: string;
  label: string;
  description: string;
};

const CMS_MODULES: CmsModule[] = [
  { key: 'cms:dashboard', label: 'Dashboard', description: 'Vista general del estado del CMS.' },
  { key: 'cms:users', label: 'Usuarios', description: 'Gestión de clientes y usuarios internos.' },
  { key: 'cms:componentes', label: 'Componentes', description: 'Configuración de bloques visuales.' },
  { key: 'cms:planes', label: 'Planes', description: 'Administración de planes comerciales.' },
  { key: 'cms:canales', label: 'Canales', description: 'Alta y edición de canales OTT.' },
  { key: 'cms:categorias', label: 'Categorías', description: 'Taxonomía y clasificación del catálogo.' },
  { key: 'cms:sliders', label: 'Sliders', description: 'Banners y contenido promocional.' },
  { key: 'cms:monitor', label: 'Monitor', description: 'Estado operativo y salud de la plataforma.' },
  { key: 'cms:notificaciones-admin', label: 'Notif. administrador', description: 'Mensajería operativa interna.' },
  { key: 'cms:analitica', label: 'Analítica', description: 'Indicadores y métricas de negocio.' },
  { key: 'cms:propaganda', label: 'Propaganda', description: 'Promoción y campañas comerciales.' },
  { key: 'cms:notificaciones-abonado', label: 'Notif. abonado', description: 'Comunicación hacia clientes.' },
  { key: 'cms:roles', label: 'Roles', description: 'Asignación de roles y permisos.' },
];

const ADMIN_DEFAULT_PERMISSIONS = CMS_MODULES.filter((module) => module.key !== 'cms:roles').map((module) => module.key);
const SOPORTE_DEFAULT_PERMISSIONS = ['cms:dashboard', 'cms:users', 'cms:canales', 'cms:monitor', 'cms:analitica'];

const ROLE_META: Record<CmsRole, { label: string; color: string; bg: string; summary: string }> = {
  superadmin: {
    label: 'Superadmin',
    color: C.rose,
    bg: C.roseSoft,
    summary: 'Control total del CMS y gobierno de permisos.',
  },
  admin: {
    label: 'Admin',
    color: C.accent,
    bg: C.accentSoft,
    summary: 'Opera el CMS con permisos funcionales por módulo.',
  },
  soporte: {
    label: 'Soporte',
    color: C.green,
    bg: C.greenSoft,
    summary: 'Atención operativa con acceso limitado a módulos críticos.',
  },
};

function getRolePermissions(role: CmsRole, customPermissions?: string[]) {
  if (role === 'superadmin') return ['cms:*'];
  if (role === 'admin') return customPermissions && customPermissions.length > 0 ? customPermissions : ADMIN_DEFAULT_PERMISSIONS;
  if (role === 'soporte') return SOPORTE_DEFAULT_PERMISSIONS;
  return SOPORTE_DEFAULT_PERMISSIONS;
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18 }}>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
      {subtitle ? <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4, marginBottom: 14 }}>{subtitle}</Text> : <View style={{ height: 14 }} />}
      {children}
    </View>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: color, backgroundColor: bg ?? 'rgba(255,255,255,0.04)' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function fieldBase(webInput: object) {
  return {
    backgroundColor: C.lift,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    ...webInput,
  };
}

function Toggle({
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.6 : 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: enabled ? C.accentBorder : C.border,
        backgroundColor: enabled ? C.accentSoft : C.lift,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>{description}</Text>
        </View>
        <View
          style={{
            width: 46,
            height: 26,
            borderRadius: 999,
            backgroundColor: enabled ? C.accent : C.dimmed,
            borderWidth: 1,
            borderColor: enabled ? C.accent : C.border,
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: '#fff',
              alignSelf: enabled ? 'flex-end' : 'flex-start',
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}

function CmsUserModal({
  visible,
  editingUser,
  onClose,
  onSave,
}: {
  visible: boolean;
  editingUser: AdminUser | null;
  onClose: () => void;
  onSave: (payload: AdminUserPayload) => Promise<void>;
}) {
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const initialRole = editingUser?.role === 'superadmin' || editingUser?.role === 'admin' || editingUser?.role === 'soporte'
    ? editingUser.role
    : 'admin';
  const [email, setEmail] = useState(editingUser?.email ?? '');
  const [nombre, setNombre] = useState(editingUser?.nombre ?? '');
  const [role, setRole] = useState<CmsRole>(initialRole);
  const [status, setStatus] = useState<AdminUser['status']>(editingUser?.status ?? 'pending');
  const [permissions, setPermissions] = useState<string[]>(getRolePermissions(initialRole, editingUser?.permissions));

  useEffect(() => {
    const nextRole = editingUser?.role === 'superadmin' || editingUser?.role === 'admin' || editingUser?.role === 'soporte'
      ? editingUser.role
      : 'admin';
    setEmail(editingUser?.email ?? '');
    setNombre(editingUser?.nombre ?? '');
    setRole(nextRole);
    setStatus(editingUser?.status ?? 'pending');
    setPermissions(getRolePermissions(nextRole, editingUser?.permissions));
  }, [editingUser, visible]);

  const togglePermission = (permission: string) => {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  };

  const effectivePermissions = getRolePermissions(role, permissions);
  const disableCustomPermissions = role !== 'admin';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(9,2,25,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 980, maxHeight: '88%', backgroundColor: C.panel, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{editingUser ? 'Editar usuario CMS' : 'Crear usuario CMS'}</Text>
              <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Usuarios internos y permisos del sidebar.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="close" size={18} color={C.textDim} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>Nombre</Text>
                <TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre del usuario CMS" placeholderTextColor={C.muted} style={fieldBase(webInput)} />
              </View>
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>Correo</Text>
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="correo@lukiplay.com" placeholderTextColor={C.muted} style={fieldBase(webInput)} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>Rol</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {(['superadmin', 'admin', 'soporte'] as const).map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setRole(item);
                        setPermissions(getRolePermissions(item, permissions));
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: role === item ? ROLE_META[item].bg : C.lift, borderWidth: 1, borderColor: role === item ? ROLE_META[item].color : C.border }}
                    >
                      <Text style={{ color: role === item ? ROLE_META[item].color : C.textDim, fontWeight: '700', fontSize: 12 }}>{ROLE_META[item].label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 260 }}>
                <Text style={{ color: C.textSec, fontSize: 12, marginBottom: 8 }}>Estado</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {(['active', 'pending', 'inactive'] as const).map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setStatus(item)}
                      style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: status === item ? C.accentSoft : C.lift, borderWidth: 1, borderColor: status === item ? C.accent : C.border }}
                    >
                      <Text style={{ color: status === item ? C.accent : C.textDim, fontWeight: '700', fontSize: 12 }}>{item.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Card
              title="Permisos por módulo"
              subtitle={role === 'admin' ? 'Activa o desactiva módulos del sidebar para el rol ADMIN.' : 'SUPERADMIN y SOPORTE usan permisos predefinidos.'}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {CMS_MODULES.map((module) => (
                  <View key={module.key} style={{ minWidth: 260, flexBasis: 300, flexGrow: 1 }}>
                    <Toggle
                      label={module.label}
                      description={module.description}
                      enabled={effectivePermissions.includes('cms:*') || effectivePermissions.includes(module.key)}
                      disabled={disableCustomPermissions || module.key === 'cms:roles'}
                      onToggle={() => togglePermission(module.key)}
                    />
                  </View>
                ))}
              </View>
            </Card>
          </ScrollView>

          <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.textDim, fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave({ nombre, email, role, status, permissions: effectivePermissions })}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{editingUser ? 'Guardar cambios' : 'Crear usuario'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CmsRoles() {
  const { accessToken, profile } = useCmsStore();
  const [tab, setTab] = useState<TabKey>('roles');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<CmsRole>('admin');
  const [roleTemplates, setRoleTemplates] = useState<Record<CmsRole, string[]>>({
    superadmin: ['cms:*'],
    admin: ADMIN_DEFAULT_PERMISSIONS,
    soporte: SOPORTE_DEFAULT_PERMISSIONS,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void adminListUsers(accessToken)
      .then((data) => {
        const cmsOnly = data.filter((user) => user.isCmsUser);
        setUsers(cmsOnly);
        setRoleTemplates({
          superadmin: ['cms:*'],
          admin: cmsOnly.find((user) => user.role === 'admin')?.permissions?.length
            ? cmsOnly.find((user) => user.role === 'admin')!.permissions
            : ADMIN_DEFAULT_PERMISSIONS,
          soporte: cmsOnly.find((user) => user.role === 'soporte')?.permissions?.length
            ? cmsOnly.find((user) => user.role === 'soporte')!.permissions
            : SOPORTE_DEFAULT_PERMISSIONS,
        });
      })
      .catch(() => setUsers([]));
  }, [accessToken]);

  const cmsUsers = useMemo(() => users.filter((user) => user.isCmsUser), [users]);
  const selectedPermissions = roleTemplates[selectedRole] ?? getRolePermissions(selectedRole, cmsUsers.find((user) => user.role === selectedRole)?.permissions);
  const isSuperadmin = profile?.role === 'superadmin';
  const canEditSelectedRole = isSuperadmin && (selectedRole === 'admin' || selectedRole === 'soporte');

  const toggleRolePermission = (permission: string) => {
    if (!canEditSelectedRole) return;
    setRoleTemplates((current) => {
      const currentPermissions = current[selectedRole] ?? [];
      const nextPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter((item) => item !== permission)
        : [...currentPermissions, permission];

      return {
        ...current,
        [selectedRole]: nextPermissions,
      };
    });
  };

  const applyTemplateToRoleUsers = async () => {
    if (!accessToken || !canEditSelectedRole) return;
    const permissions = roleTemplates[selectedRole] ?? [];
    const roleUsers = cmsUsers.filter((user) => user.role === selectedRole);

    const updatedUsers = await Promise.all(
      roleUsers.map((user) =>
        adminUpdateUser(accessToken, user.id, {
          role: user.role,
          email: user.email,
          nombre: user.nombre,
          status: user.status,
          permissions,
        }),
      ),
    );

    setUsers((current) =>
      current.map((user) => updatedUsers.find((updated) => updated.id === user.id) ?? user),
    );
    setFeedback(`Permisos actualizados para el rol ${ROLE_META[selectedRole].label}.`);
  };

  const handleSaveUser = async (payload: AdminUserPayload) => {
    if (!accessToken) return;
    const normalizedPayload: AdminUserPayload = {
      ...payload,
      status: payload.status ?? 'pending',
      role: payload.role ?? 'admin',
      permissions: getRolePermissions(payload.role ?? 'admin', payload.permissions),
    };

    const saved = editingUser
      ? await adminUpdateUser(accessToken, editingUser.id, normalizedPayload)
      : await adminCreateUser(accessToken, normalizedPayload);

    const nextUser = { ...saved, isCmsUser: true, isSubscriber: false, plan: 'Usuario CMS', planId: null };
    setUsers((current) => editingUser ? current.map((item) => item.id === nextUser.id ? nextUser : item) : [nextUser, ...current]);
    setFeedback(editingUser ? 'Usuario CMS actualizado.' : 'Usuario CMS creado.');
    setShowModal(false);
    setEditingUser(null);
  };

  return (
    <CmsShell breadcrumbs={[{ label: 'CMS', path: '/cms/dashboard' }, { label: 'Roles' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <View style={{ maxWidth: 760 }}>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: '800' }}>Roles y permisos</Text>
            <Text style={{ color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
              Módulo de gobierno para perfiles internos del CMS. Usuarios clientes y abonados quedan fuera de esta consola.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <Chip label={`Perfil actual: ${profile?.role?.toUpperCase() ?? 'SIN SESION'}`} color={C.accent} bg={C.accentSoft} />
            <Chip label={isSuperadmin ? 'Puede gestionar roles' : 'Solo lectura'} color={isSuperadmin ? C.green : C.rose} bg={isSuperadmin ? C.greenSoft : C.roseSoft} />
          </View>
        </View>

        {feedback ? (
          <View style={{ borderRadius: 12, padding: 12, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: 'rgba(16,185,129,0.24)' }}>
            <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>{feedback}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { key: 'roles', label: 'Modelo de roles' },
            { key: 'usuarios', label: 'Usuarios CMS' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTab(item.key as TabKey)}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === item.key ? C.accentSoft : C.lift, borderWidth: 1, borderColor: tab === item.key ? C.accent : C.border }}
            >
              <Text style={{ color: tab === item.key ? C.accent : C.textDim, fontWeight: '800', fontSize: 12 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'roles' ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {(['superadmin', 'admin', 'soporte'] as const).map((role) => {
                const meta = ROLE_META[role];
                return (
                  <Pressable
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={{ flexBasis: 240, flexGrow: 1, borderRadius: 18, borderWidth: 1, borderColor: selectedRole === role ? meta.color : C.border, backgroundColor: selectedRole === role ? meta.bg : C.surface, padding: 18 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{meta.label}</Text>
                      <Chip label={role.toUpperCase()} color={meta.color} bg={meta.bg} />
                    </View>
                    <Text style={{ color: C.textDim, fontSize: 12, lineHeight: 18 }}>{meta.summary}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Card title="Permisos del rol seleccionado" subtitle="Diseño recomendado: SUPERADMIN total, ADMIN configurable, SOPORTE acotado, CLIENTE sin acceso.">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <Text style={{ color: C.textDim, fontSize: 12 }}>
                  {canEditSelectedRole
                    ? 'Puedes encender o apagar módulos y luego aplicar el cambio.'
                    : 'Superadmin es fijo; Admin y Soporte son editables.'}
                </Text>
                {canEditSelectedRole ? (
                  <TouchableOpacity
                    onPress={() => void applyTemplateToRoleUsers()}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: C.accent }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Aplicar al rol</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {CMS_MODULES.map((module) => {
                  const enabled = selectedPermissions.includes('cms:*') || selectedPermissions.includes(module.key);
                  return (
                    <View key={module.key} style={{ minWidth: 260, flexBasis: 300, flexGrow: 1 }}>
                      <Toggle
                        label={module.label}
                        description={module.description}
                        enabled={enabled}
                        disabled={!canEditSelectedRole || module.key === 'cms:roles'}
                        onToggle={() => toggleRolePermission(module.key)}
                      />
                    </View>
                  );
                })}
              </View>
            </Card>

            <Card title="Flujo de creación y otorgamiento" subtitle="Alineado a buenas prácticas para usuarios internos del CMS.">
              <View style={{ gap: 12 }}>
                {[
                  '1. El módulo Usuarios mantiene solo clientes y abonados; los usuarios internos viven en Roles.',
                  '2. SUPERADMIN crea el usuario CMS con correo corporativo y estado pendiente.',
                  '3. Se asigna un rol base: SUPERADMIN, ADMIN o SOPORTE.',
                  '4. Si el rol es ADMIN, se conceden permisos por módulo con switches ON/OFF del sidebar.',
                  '5. El primer acceso debe forzar cambio de contraseña y validar el alcance visible del menú.',
                ].map((item) => (
                  <View key={item} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <FontAwesome name="check-circle" size={14} color={C.accent} style={{ marginTop: 2 }} />
                    <Text style={{ color: C.textSec, fontSize: 13, flex: 1 }}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : (
          <Card title="Usuarios CMS" subtitle="Creación y edición de usuarios internos con rol y permisos de navegación.">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <Chip label={`Internos: ${cmsUsers.length}`} color={C.green} bg={C.greenSoft} />
                <Chip label={`Admins: ${cmsUsers.filter((user) => user.role === 'admin').length}`} color={C.accent} bg={C.accentSoft} />
              </View>
              {isSuperadmin ? (
                <TouchableOpacity
                  onPress={() => {
                    setEditingUser(null);
                    setShowModal(true);
                  }}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Crear usuario CMS</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={{ gap: 10 }}>
              {cmsUsers.map((user) => {
                const meta = ROLE_META[user.role as CmsRole];
                const permissionCount = getRolePermissions(user.role as CmsRole, user.permissions).length;
                return (
                  <View key={user.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift, padding: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <View style={{ flex: 1, minWidth: 260 }}>
                        <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>{user.nombre}</Text>
                        <Text style={{ color: C.textDim, fontSize: 12, marginTop: 2 }}>{user.email}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={meta.label} color={meta.color} bg={meta.bg} />
                        <Chip label={`${permissionCount} módulos`} color={C.cyan} bg={C.cyanSoft} />
                        <Chip label={user.status.toUpperCase()} color={user.status === 'active' ? C.green : C.accent} bg={user.status === 'active' ? C.greenSoft : C.accentSoft} />
                        {isSuperadmin ? (
                          <TouchableOpacity
                            onPress={() => {
                              setEditingUser(user);
                              setShowModal(true);
                            }}
                            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}
                          >
                            <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>Editar</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {getRolePermissions(user.role as CmsRole, user.permissions).map((permission) => (
                        <Chip key={`${user.id}-${permission}`} label={permission} color={meta.color} bg="rgba(255,255,255,0.03)" />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}
      </ScrollView>

      <CmsUserModal
        visible={showModal}
        editingUser={editingUser}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />
    </CmsShell>
  );
}
