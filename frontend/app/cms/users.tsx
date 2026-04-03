import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListUsers, adminCreateUser, adminDeleteUser, AdminUser } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(d: string) {
  if (!d) return '—';
  return d.slice(0, 10);
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  '#5B5BD6', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Add User Modal
// ---------------------------------------------------------------------------

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; email: string; telefono: string; plan: string; contrato: string }) => Promise<void>;
}

function AddUserModal({ visible, onClose, onSave }: AddUserModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [plan, setPlan] = useState('Full');
  const [contrato, setContrato] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  const handleSave = async () => {
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son requeridos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave({ nombre, email, telefono, plan, contrato });
      setNombre(''); setEmail(''); setTelefono(''); setPlan('Full'); setContrato('');
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: 'white' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    ...webInput,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 28,
            width: '100%',
            maxWidth: 480,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Agregar Usuario</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>NOMBRE COMPLETO *</Text>
          <TextInput style={fieldStyle} placeholder="Ej: Juan Pérez" placeholderTextColor="#475569" value={nombre} onChangeText={setNombre} />

          <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>EMAIL *</Text>
          <TextInput style={fieldStyle} placeholder="usuario@email.com" placeholderTextColor="#475569" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>TELÉFONO</Text>
          <TextInput style={fieldStyle} placeholder="Ej: 3001234567" placeholderTextColor="#475569" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>PLAN</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['Full', 'Basic', 'Premium'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
                      backgroundColor: plan === p ? C.accent : C.bg,
                      borderWidth: 1, borderColor: plan === p ? C.accent : C.border,
                    }}
                    onPress={() => setPlan(p)}
                  >
                    <Text style={{ color: plan === p ? 'white' : C.textDim, fontSize: 12, fontWeight: '600' }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>CÓDIGO DE CONTRATO</Text>
          <TextInput style={fieldStyle} placeholder="Ej: CONTRACT-001" placeholderTextColor="#475569" autoCapitalize="characters" value={contrato} onChangeText={setContrato} />

          {error ? <Text style={{ color: '#F87171', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: C.textDim, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CmsUsers() {
  const { profile, accessToken, logout } = useCmsStore();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterContrato, setFilterContrato] = useState(true);
  const [filterSinContrato, setFilterSinContrato] = useState(true);
  const [pageSize, setPageSize] = useState(50);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  // Load users
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    adminListUsers(accessToken)
      .then((data) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  // Filtering
  const filtered = users.filter((u) => {
    const hasContract = !!u.contrato;
    if (hasContract && !filterContrato) return false;
    if (!hasContract && !filterSinContrato) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.contrato ?? '').toLowerCase().includes(q) ||
      (u.telefono ?? '').includes(q)
    );
  });

  const displayed = filtered.slice(0, pageSize);

  // Export to CSV
  const exportCSV = () => {
    if (Platform.OS !== 'web') return;
    const header = 'Nombre,Plan,Fecha Inicio,Fecha Fin,Sesiones,Email,Telefono,Codigo\n';
    const rows = filtered
      .map((u) =>
        [u.nombre, u.plan, u.fechaInicio, u.fechaFin, u.sesiones, u.email, u.telefono ?? '', u.contrato ?? ''].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddUser = async (data: { nombre: string; email: string; telefono: string; plan: string; contrato: string }) => {
    if (!accessToken) return;
    const newUser = await adminCreateUser(accessToken, data);
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (Platform.OS === 'web' && !window.confirm('¿Eliminar este usuario?')) return;
    setDeletingId(id);
    try {
      await adminDeleteUser(accessToken, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <CmsShell breadcrumbs={[{ label: 'Usuarios', path: '/cms/users' }, { label: 'Reporte' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Page title + total */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Usuarios</Text>
          </View>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <View>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>{users.length}</Text>
              <Text style={{ color: C.muted, fontSize: 12 }}>Total Usuarios</Text>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                backgroundColor: '#1E3A5F',
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesome name="user" size={20} color="#60A5FA" />
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#14532D',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: '#166534',
            }}
            onPress={exportCSV}
          >
            <FontAwesome name="download" size={13} color="#4ADE80" />
            <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 13 }}>Descargar Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: C.accent,
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
            onPress={() => setShowAddModal(true)}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Agregar Usuario</Text>
          </TouchableOpacity>
        </View>

        {/* Filters + Search row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: C.surface,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Checkboxes */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => setFilterContrato(!filterContrato)}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  borderWidth: 2,
                  borderColor: filterContrato ? C.accent : C.muted,
                  backgroundColor: filterContrato ? C.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {filterContrato && <FontAwesome name="check" size={10} color="white" />}
              </View>
              <Text style={{ color: C.text, fontSize: 13 }}>Con contrato</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => setFilterSinContrato(!filterSinContrato)}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  borderWidth: 2,
                  borderColor: filterSinContrato ? C.accent : C.muted,
                  backgroundColor: filterSinContrato ? C.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {filterSinContrato && <FontAwesome name="check" size={10} color="white" />}
              </View>
              <Text style={{ color: C.text, fontSize: 13 }}>Sin contrato</Text>
            </TouchableOpacity>
          </View>

          {/* Page size + search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Ver</Text>
              {[25, 50, 100].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6,
                    backgroundColor: pageSize === n ? C.accent : C.bg,
                    borderWidth: 1,
                    borderColor: pageSize === n ? C.accent : C.border,
                  }}
                  onPress={() => setPageSize(n)}
                >
                  <Text style={{ color: pageSize === n ? 'white' : C.textDim, fontSize: 12 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.bg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 10,
                minWidth: 200,
              }}
            >
              <FontAwesome name="search" size={12} color={C.muted} />
              <TextInput
                style={{
                  flex: 1,
                  color: 'white',
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  fontSize: 13,
                  ...webInput,
                }}
                placeholder="Buscar..."
                placeholderTextColor="#475569"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        </View>

        {/* Table */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={{ color: C.muted, marginTop: 14, fontSize: 14 }}>Cargando usuarios…</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 900 }}>
              {/* Table header */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: '#0D1B2E',
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                {[
                  { label: 'ACCIONES', w: 80 },
                  { label: 'NOMBRE', w: 160, sort: true },
                  { label: 'PLAN', w: 80, sort: true },
                  { label: 'FECHA INICIO', w: 110, sort: true },
                  { label: 'FECHA FIN', w: 110, sort: true },
                  { label: '# SESIONES', w: 90, sort: true },
                  { label: 'EMAIL', w: 200 },
                  { label: 'TELÉFONO', w: 120 },
                  { label: 'CÓDIGO', w: 100 },
                ].map((col) => (
                  <View key={col.label} style={{ width: col.w, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 }}>
                      {col.label}
                    </Text>
                    {col.sort && <FontAwesome name="sort" size={9} color={C.muted} />}
                  </View>
                ))}
              </View>

              {displayed.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <FontAwesome name="user-times" size={36} color={C.muted} />
                  <Text style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>Sin resultados</Text>
                </View>
              ) : (
                displayed.map((user) => {
                  const color = avatarColor(user.nombre);
                  return (
                    <View
                      key={user.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        backgroundColor: C.surface,
                        borderRadius: 8,
                        marginBottom: 3,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      {/* Actions */}
                      <View style={{ width: 80, flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => {/* edit */ }}
                        >
                          <FontAwesome name="pencil" size={12} color="#60A5FA" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#3F1515', alignItems: 'center', justifyContent: 'center', opacity: deletingId === user.id ? 0.5 : 1 }}
                          onPress={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id
                            ? <ActivityIndicator size="small" color="#F87171" />
                            : <FontAwesome name="trash" size={12} color="#F87171" />}
                        </TouchableOpacity>
                      </View>

                      {/* Nombre */}
                      <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: color,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>
                            {initials(user.nombre)}
                          </Text>
                        </View>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                          {user.nombre}
                        </Text>
                      </View>

                      {/* Plan */}
                      <View style={{ width: 80 }}>
                        <View
                          style={{
                            backgroundColor: '#1E3A5F',
                            borderRadius: 5,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Text style={{ color: '#60A5FA', fontSize: 11, fontWeight: '700' }}>{user.plan}</Text>
                        </View>
                      </View>

                      {/* Fecha Inicio */}
                      <Text style={{ color: C.textDim, fontSize: 12, width: 110 }}>{fmt(user.fechaInicio)}</Text>

                      {/* Fecha Fin */}
                      <Text style={{ color: C.textDim, fontSize: 12, width: 110 }}>{fmt(user.fechaFin)}</Text>

                      {/* Sesiones */}
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', width: 90, textAlign: 'center' }}>
                        {user.sesiones}
                      </Text>

                      {/* Email */}
                      <Text style={{ color: C.textDim, fontSize: 11, width: 200 }} numberOfLines={1}>
                        {user.email}
                      </Text>

                      {/* Teléfono */}
                      <Text style={{ color: C.textDim, fontSize: 12, width: 120 }}>
                        {user.telefono ?? '—'}
                      </Text>

                      {/* Código */}
                      <Text style={{ color: C.textDim, fontSize: 12, width: 100 }}>
                        {user.contrato ?? '—'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* Pagination info */}
        {!loading && filtered.length > 0 && (
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            Mostrando {Math.min(displayed.length, filtered.length)} de {filtered.length} usuarios
          </Text>
        )}
      </ScrollView>

      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddUser}
      />
    </CmsShell>
  );
}
