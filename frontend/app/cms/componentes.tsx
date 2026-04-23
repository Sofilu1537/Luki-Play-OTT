import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminListComponentes,
  adminToggleComponente,
  adminSyncComponenteCategorias,
  adminReorderComponentes,
  adminCreateComponente,
  adminUpdateComponente,
  adminDeleteComponente,
  adminListCategorias,
  AdminComponente,
  AdminCategoria,
  CreateComponentePayload,
} from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import CmsShell from '../../components/cms/CmsShell';
import { StatCard } from '../../components/cms/CmsComponents';
import { useTheme } from '../../hooks/useTheme';

const TIPO_COLORS: Record<string, string> = {
  VOD: '#8B5CF6',
  DESTACADOS: '#F59E0B',
  LIVE: '#EF4444',
  SERIES: '#0EA5E9',
  RADIO: '#10B981',
  PPV: '#EC4899',
  KIDS: '#F472B6',
  DEPORTES: '#22D3EE',
  MUSICA: '#A78BFA',
  NOTICIAS: '#64748B',
};

export default function CmsComponentes() {
  const { isDark, theme } = useTheme();
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [componentes, setComponentes] = useState<AdminComponente[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Category management state
  const [allCategorias, setAllCategorias] = useState<AdminCategoria[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Reorder state
  const [isReordering, setIsReordering] = useState(false);
  const [orderedList, setOrderedList] = useState<AdminComponente[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // CRUD state
  const TIPO_KEYS = Object.keys(TIPO_COLORS);
  const EMPTY_FORM: CreateComponentePayload = { nombre: '', descripcion: '', icono: '', tipo: TIPO_KEYS[0], activo: true };
  const [formVisible, setFormVisible] = useState(false);
  const [editingComp, setEditingComp] = useState<AdminComponente | null>(null);
  const [form, setForm] = useState<CreateComponentePayload>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminComponente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      adminListComponentes(accessToken),
      adminListCategorias(accessToken),
    ]).then(([comps, cats]) => {
      setComponentes(comps);
      setAllCategorias(cats);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const openCategoryManager = (comp: AdminComponente) => {
    setManagingId(comp.id);
    setManagingCategories((comp.categories ?? []).map((c) => c.id));
  };

  const toggleCategory = (catId: string) => {
    setManagingCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const saveCategories = async () => {
    if (!accessToken || !managingId) return;
    setIsSyncing(true);
    try {
      await adminSyncComponenteCategorias(accessToken, managingId, managingCategories);
      setComponentes((prev) =>
        prev.map((c) =>
          c.id === managingId
            ? { ...c, categories: allCategorias.filter((cat) => managingCategories.includes(cat.id)) }
            : c,
        ),
      );
      setManagingId(null);
    } catch (e) {
      console.error('Sync categories failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const openCreate = () => {
    setEditingComp(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormVisible(true);
  };

  const openEdit = (comp: AdminComponente) => {
    setEditingComp(comp);
    setForm({ nombre: comp.nombre, descripcion: comp.descripcion, icono: comp.icono, tipo: comp.tipo, activo: comp.activo });
    setFormError('');
    setFormVisible(true);
  };

  const closeForm = () => { setFormVisible(false); setEditingComp(null); };

  const saveForm = async () => {
    if (!accessToken) return;
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (!form.tipo) { setFormError('Selecciona un tipo.'); return; }
    setFormError('');
    setIsSaving(true);
    try {
      if (editingComp) {
        const updated = await adminUpdateComponente(accessToken, editingComp.id, form);
        setComponentes((prev) => prev.map((c) => c.id === updated.id ? { ...updated, categories: c.categories } : c));
      } else {
        const created = await adminCreateComponente(accessToken, form);
        setComponentes((prev) => [...prev, { ...created, categories: [] }].sort((a, b) => a.orden - b.orden));
      }
      closeForm();
    } catch (e: any) {
      setFormError(e?.message ?? 'Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!accessToken || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminDeleteComponente(accessToken, deleteTarget.id);
      setComponentes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const enterReorderMode = () => {
    setSearch('');
    setManagingId(null);
    setOrderedList([...componentes].sort((a, b) => a.orden - b.orden));
    setIsReordering(true);
  };

  const cancelReorder = () => setIsReordering(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setOrderedList((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moveDown = (index: number) => {
    setOrderedList((prev) => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const saveOrder = async () => {
    if (!accessToken) return;
    setIsSavingOrder(true);
    try {
      const updated = await adminReorderComponentes(accessToken, orderedList.map((c) => c.id));
      setComponentes(updated);
      setIsReordering(false);
    } catch (e) {
      console.error('Reorder failed', e);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!accessToken || toggling) return;
    setToggling(id);
    try {
      const updated = await adminToggleComponente(accessToken, id);
      setComponentes((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (e) {
      console.error('Toggle failed', e);
    } finally {
      setToggling(null);
    }
  };

  if (!profile) return null;

  const activeCount = componentes.filter((c) => c.activo).length;
  const inactiveCount = componentes.filter((c) => !c.activo).length;

  const filtered = componentes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.tipo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q)
    );
  });

  const webInput =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <CmsShell breadcrumbs={[{ label: 'Componentes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* ── Top-right action buttons ── */}
        {!isReordering && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
            {/* Ordenar — outline accent */}
            <TouchableOpacity
              onPress={enterReorderMode}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: 'transparent',
                borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                borderWidth: 1, borderColor: `${theme.accent}66`,
              }}
            >
              <FontAwesome name="sort" size={13} color={theme.accent} />
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Ordenar</Text>
            </TouchableOpacity>
            {/* Nuevo componente — solid accent */}
            <TouchableOpacity
              onPress={openCreate}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10,
                borderWidth: isDark ? 0 : 1,
                borderColor: isDark ? 'transparent' : 'rgba(130,130,130,0.18)',
                backgroundColor: isDark ? 'transparent' : '#fff',
                overflow: 'hidden',
              }}
            >
              {isDark ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
                  <View style={{ flex: 1, backgroundColor: theme.accent }} />
                </View>
              ) : null}
              <FontAwesome name="plus" size={13} color={isDark ? '#1A1A2E' : '#240046'} />
              <Text style={{ color: isDark ? '#1A1A2E' : '#240046', fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Nuevo componente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Stats cards ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Componentes Activos',   value: activeCount,        icon: 'check-circle' as const, color: theme.success, bg: theme.successSoft },
            { label: 'Componentes Inactivos', value: inactiveCount,      icon: 'times-circle' as const, color: theme.danger,  bg: theme.dangerSoft  },
            { label: 'Total Componentes',     value: componentes.length, icon: 'th-large'     as const, color: theme.info,    bg: theme.infoSoft    },
          ].map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} bg={item.bg} />
          ))}
        </View>

        {/* ── Toolbar ── */}
        <View style={{
          backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)',
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)',
          marginBottom: 18,
          shadowColor: '#240046',
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: isDark ? 0 : 20,
          shadowOffset: { width: 0, height: 6 },
          ...(Platform.OS === 'web' && !isDark ? { boxShadow: '0 4px 20px rgba(45,0,96,0.08)' } as any : {}),
        }}>
          {isReordering ? (
            /* ── Modo ordenar ── */
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <FontAwesome name="sort" size={14} color={theme.accent} />
                <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 14, fontFamily: 'Montserrat-SemiBold', fontWeight: '700' }}>
                  Modo ordenar — arrastra o usa las flechas
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={cancelReorder} style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)' }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveOrder}
                  disabled={isSavingOrder}
                  style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: theme.accent, opacity: isSavingOrder ? 0.6 : 1 }}
                >
                  {isSavingOrder
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Montserrat-Bold', fontWeight: '700' }}>Guardar orden</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Modo normal: búsqueda ── */
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                <FontAwesome name="search" size={12} color={isDark ? theme.textMuted : '#240046'} />
                <TextInput
                  style={{ flex: 1, color: isDark ? theme.text : '#240046', paddingVertical: 10, paddingHorizontal: 10, fontSize: 16, fontFamily: 'Montserrat-SemiBold', ...webInput }}
                  placeholder="Buscar por nombre o tipo..."
                  placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.4)'}
                  value={search}
                  onChangeText={setSearch}
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <FontAwesome name="times-circle" size={14} color={isDark ? theme.textMuted : '#240046'} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        </View>

        {/* ── Lista de componentes ── */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: isDark ? theme.textMuted : '#240046', marginTop: 14, fontSize: 15, fontFamily: 'Montserrat-Regular' }}>Cargando componentes…</Text>
          </View>
        ) : !isReordering && filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <FontAwesome name="th-large" size={36} color={isDark ? theme.textMuted : '#240046'} />
            <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 17, marginTop: 12, fontFamily: 'Montserrat-SemiBold' }}>Sin resultados</Text>
            <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, marginTop: 6, fontFamily: 'Montserrat-Regular' }}>Ajusta la búsqueda para encontrar componentes.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {(isReordering ? orderedList : filtered).map((comp, index) => {
              const color = TIPO_COLORS[comp.tipo] ?? '#64748B';
              const isToggling = toggling === comp.id;
              const listLen = isReordering ? orderedList.length : filtered.length;
              return (
                <View
                  key={comp.id}
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: 14,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: isReordering
                      ? (isDark ? theme.softUiBorderDark : `${theme.accent}30`)
                      : comp.activo ? (isDark ? theme.softUiBorderDark : theme.softUiBorder) : (isDark ? theme.border : 'rgba(130,130,130,0.18)'),
                    opacity: isReordering ? 1 : comp.activo ? 1 : 0.65,
                    shadowColor: theme.cardShadow,
                    shadowOpacity: isDark ? 0.28 : 0.13,
                    shadowRadius: isDark ? 14 : 10,
                    shadowOffset: { width: isDark ? 6 : 4, height: isDark ? 6 : 4 },
                    elevation: isDark ? 8 : 4,
                    ...(Platform.OS === 'web' && !isDark ? { boxShadow: theme.softUiShadow } as any : {}),
                    ...(Platform.OS === 'web' &&  isDark ? { boxShadow: theme.softUiShadowDark } as any : {}),
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Left: icon + info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 }}>
                      {/* Reorder mode: position number */}
                      {isReordering && (
                        <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: theme.accent, fontSize: 18, fontWeight: '800', fontFamily: 'Montserrat-Bold' }}>{index + 1}</Text>
                        </View>
                      )}
                      <View style={{
                        width: 48, height: 48,
                        backgroundColor: `${color}22`,
                        borderRadius: 12,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: `${color}40`,
                      }}>
                        <FontAwesome name={comp.icono as any} size={22} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        {/* Name + badges row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 16, fontWeight: '700', fontFamily: 'Montserrat-Bold' }}>
                            {comp.nombre}
                          </Text>
                          <View style={{ backgroundColor: `${color}22`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color, fontSize: 9, fontWeight: '800', letterSpacing: 1, fontFamily: 'Montserrat-Bold' }}>
                              {comp.tipo}
                            </Text>
                          </View>
                          {!isReordering && (
                            <View style={{ backgroundColor: comp.activo ? theme.successSoft : theme.dangerSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text style={{ color: comp.activo ? theme.success : theme.danger, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Montserrat-Bold' }}>
                                {comp.activo ? 'ACTIVO' : 'INACTIVO'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 12, lineHeight: 18, fontFamily: 'Montserrat-Regular' }} numberOfLines={2}>
                          {comp.descripcion}
                        </Text>
                      </View>
                    </View>

                    {/* Right: reorder arrows OR toggle switch */}
                    {isReordering ? (
                      <View style={{ flexDirection: 'column', gap: 4, paddingLeft: 12 }}>
                        <TouchableOpacity
                          onPress={() => moveUp(index)}
                          disabled={index === 0}
                          style={{
                            width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: index === 0 ? (isDark ? theme.border : 'rgba(130,130,130,0.10)') : `${theme.accent}18`,
                            borderWidth: 1,
                            borderColor: index === 0 ? (isDark ? theme.border : 'rgba(130,130,130,0.2)') : `${theme.accent}40`,
                            opacity: index === 0 ? 0.4 : 1,
                          }}
                        >
                          <FontAwesome name="chevron-up" size={13} color={index === 0 ? theme.textMuted : theme.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveDown(index)}
                          disabled={index === listLen - 1}
                          style={{
                            width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: index === listLen - 1 ? (isDark ? theme.border : 'rgba(130,130,130,0.10)') : `${theme.accent}18`,
                            borderWidth: 1,
                            borderColor: index === listLen - 1 ? (isDark ? theme.border : 'rgba(130,130,130,0.2)') : `${theme.accent}40`,
                            opacity: index === listLen - 1 ? 0.4 : 1,
                          }}
                        >
                          <FontAwesome name="chevron-down" size={13} color={index === listLen - 1 ? theme.textMuted : theme.accent} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', gap: 5, paddingLeft: 12 }}>
                        {isToggling ? (
                          <ActivityIndicator color={color} size="small" />
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleToggle(comp.id)}
                            style={{
                              width: 52, height: 28, borderRadius: 14,
                              backgroundColor: comp.activo ? theme.successSoft : theme.dangerSoft,
                              justifyContent: 'center', paddingHorizontal: 2,
                              borderWidth: 1,
                              borderColor: comp.activo ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)',
                            }}
                          >
                            <View style={{
                              width: 22, height: 22, borderRadius: 11,
                              backgroundColor: comp.activo ? theme.success : theme.danger,
                              alignSelf: comp.activo ? 'flex-end' : 'flex-start',
                              shadowColor: comp.activo ? theme.success : theme.danger,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.5, shadowRadius: 6,
                            }} />
                          </TouchableOpacity>
                        )}
                        <Text style={{ color: comp.activo ? theme.success : theme.danger, fontSize: 9, fontWeight: '700', fontFamily: 'Montserrat-Bold' }}>
                          {comp.activo ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Category manager + actions — only in normal mode */}
                  {!isReordering && (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <TouchableOpacity
                          onPress={() => managingId === comp.id ? setManagingId(null) : openCategoryManager(comp)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            backgroundColor: isDark ? theme.infoSoft : theme.infoSoft,
                            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
                            borderWidth: 1, borderColor: `${theme.info}30`,
                          }}
                        >
                          <FontAwesome name="tags" size={11} color={theme.info} />
                          <Text style={{ color: theme.info, fontSize: 11, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' }}>
                            Categorías{(comp.categories?.length ?? 0) > 0 ? ` (${comp.categories!.length})` : ''}
                          </Text>
                          <FontAwesome name={managingId === comp.id ? 'chevron-up' : 'chevron-down'} size={9} color={theme.info} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                          onPress={() => openEdit(comp)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            backgroundColor: isDark ? `${theme.accent}18` : `${theme.accent}12`,
                            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
                            borderWidth: 1, borderColor: `${theme.accent}30`,
                          }}
                        >
                          <FontAwesome name="pencil" size={11} color={theme.accent} />
                          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setDeleteTarget(comp)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            backgroundColor: isDark ? theme.dangerSoft : theme.dangerSoft,
                            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
                            borderWidth: 1, borderColor: `${theme.danger}30`,
                          }}
                        >
                          <FontAwesome name="trash" size={11} color={theme.danger} />
                          <Text style={{ color: theme.danger, fontSize: 11, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' }}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>

                      {managingId === comp.id && (
                        <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: isDark ? theme.border : 'rgba(130,130,130,0.18)', paddingTop: 14 }}>
                          <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Montserrat-Bold' }}>
                            Categorías asignadas
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                            {allCategorias.map((cat) => {
                              const selected = managingCategories.includes(cat.id);
                              return (
                                <TouchableOpacity
                                  key={cat.id}
                                  onPress={() => toggleCategory(cat.id)}
                                  style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                    paddingHorizontal: 10, paddingVertical: 6,
                                    borderRadius: 8, borderWidth: 1,
                                    backgroundColor: selected ? `${color}18` : (isDark ? theme.liftBg : '#fff'),
                                    borderColor: selected ? `${color}50` : (isDark ? theme.border : 'rgba(130,130,130,0.3)'),
                                  }}
                                >
                                  <FontAwesome name={selected ? 'check-square' : 'square-o'} size={13} color={selected ? color : (isDark ? theme.textMuted : '#240046')} />
                                  <Text style={{ color: selected ? (isDark ? theme.text : '#240046') : (isDark ? theme.textMuted : '#240046'), fontSize: 13, fontWeight: selected ? '700' : '400', fontFamily: selected ? 'Montserrat-SemiBold' : 'Montserrat-Regular' }}>
                                    {cat.nombre}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                            <TouchableOpacity
                              onPress={() => setManagingId(null)}
                              style={{ paddingHorizontal: 16, borderRadius: 8, paddingVertical: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', alignItems: 'center' }}
                            >
                              <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={saveCategories}
                              disabled={isSyncing}
                              style={{ paddingHorizontal: 16, backgroundColor: color, borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: isSyncing ? 0.6 : 1 }}
                            >
                              {isSyncing
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-Bold' }}>Guardar</Text>
                              }
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Create / Edit Modal ── */}
      <Modal visible={formVisible} transparent animationType="fade" onRequestClose={closeForm}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 560, backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#18003a' : '#240046' }}>
              <View>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: 'Montserrat-Bold' }}>
                  {editingComp ? 'Editar componente' : 'Nuevo componente'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3, fontFamily: 'Montserrat-Regular' }}>
                  {editingComp ? 'Modifica los datos del componente OTT.' : 'Define un nuevo componente visible para los abonados.'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeForm}>
                <FontAwesome name="times" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }}>
              <View style={{ padding: 20, gap: 14 }}>

                {/* Nombre */}
                <View>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Montserrat-Bold' }}>
                    Nombre <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                  <TextInput
                    value={form.nombre}
                    onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                    placeholder="Ej: VOD Principal, Deportes Live…"
                    placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.4)'}
                    style={{ backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.9)', borderRadius: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', color: isDark ? theme.text : '#240046', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Montserrat-SemiBold', ...webInput }}
                  />
                </View>

                {/* Tipo */}
                <View>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Montserrat-Bold' }}>
                    Tipo <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(TIPO_COLORS).map(([tipo, col]) => {
                      const selected = form.tipo === tipo;
                      return (
                        <TouchableOpacity
                          key={tipo}
                          onPress={() => setForm((f) => ({ ...f, tipo }))}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: selected ? `${col}22` : (isDark ? theme.liftBg : '#fff'), borderColor: selected ? `${col}60` : (isDark ? theme.border : 'rgba(130,130,130,0.3)') }}
                        >
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
                          <Text style={{ color: selected ? (isDark ? theme.text : '#240046') : (isDark ? theme.textSec : '#240046'), fontSize: 12, fontFamily: selected ? 'Montserrat-Bold' : 'Montserrat-Regular', fontWeight: selected ? '700' : '400' }}>{tipo}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Ícono */}
                <View>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Montserrat-Bold' }}>Ícono</Text>
                  {(() => {
                    const ICON_OPTIONS: Record<string, { name: string; label: string }[]> = {
                      VOD:        [{ name: 'movie-open',            label: 'Película'  }, { name: 'play-circle',          label: 'Play'      }, { name: 'television-play',      label: 'TV Play'   }, { name: 'video',                label: 'Video'     }, { name: 'filmstrip',            label: 'Filmstrip' }],
                      DESTACADOS: [{ name: 'star-circle',           label: 'Estrella'  }, { name: 'trophy-variant',       label: 'Trofeo'    }, { name: 'fire',                 label: 'Fuego'     }, { name: 'lightning-bolt',       label: 'Rayo'      }, { name: 'bookmark-star',        label: 'Destacado' }],
                      LIVE:       [{ name: 'broadcast',             label: 'En vivo'   }, { name: 'access-point',         label: 'Señal'     }, { name: 'antenna',              label: 'Antena'    }, { name: 'television-classic',   label: 'TV'        }, { name: 'record-circle',        label: 'REC'       }],
                      SERIES:     [{ name: 'layers',                label: 'Series'    }, { name: 'view-list',            label: 'Lista'     }, { name: 'format-list-bulleted', label: 'Episodios' }, { name: 'television-box',       label: 'TV Box'    }, { name: 'filmstrip-box-multiple', label: 'Multi'   }],
                      RADIO:      [{ name: 'radio',                 label: 'Radio'     }, { name: 'headphones',           label: 'Auricular' }, { name: 'microphone',           label: 'Micro'     }, { name: 'music-note',           label: 'Nota'      }, { name: 'podcast',              label: 'Podcast'   }],
                      PPV:        [{ name: 'ticket-confirmation',   label: 'Ticket'    }, { name: 'lock',                 label: 'Lock'      }, { name: 'credit-card',          label: 'Pago'      }, { name: 'key-variant',          label: 'Llave'     }, { name: 'currency-usd',         label: 'Premium'   }],
                      KIDS:       [{ name: 'baby-face-outline',     label: 'Niños'     }, { name: 'emoticon-happy',       label: 'Feliz'     }, { name: 'puzzle',               label: 'Puzzle'    }, { name: 'controller-classic',   label: 'Juego'     }, { name: 'star-shooting',        label: 'Magia'     }],
                      DEPORTES:   [{ name: 'soccer',                label: 'Fútbol'    }, { name: 'trophy',               label: 'Trofeo'    }, { name: 'run',                  label: 'Atletismo' }, { name: 'stadium',              label: 'Estadio'   }, { name: 'basketball',           label: 'Basket'    }],
                      MUSICA:     [{ name: 'music-circle',          label: 'Música'    }, { name: 'headphones',           label: 'Auricular' }, { name: 'guitar-acoustic',      label: 'Guitarra'  }, { name: 'piano',                label: 'Piano'     }, { name: 'equalizer',            label: 'Ecualizador'}],
                      NOTICIAS:   [{ name: 'newspaper-variant',     label: 'Diario'    }, { name: 'earth',                label: 'Global'    }, { name: 'rss',                  label: 'RSS'       }, { name: 'bullhorn',             label: 'Anuncio'   }, { name: 'text-box-multiple',    label: 'Artículos' }],
                    };
                    const color = TIPO_COLORS[form.tipo] ?? '#8B5CF6';
                    const icons = ICON_OPTIONS[form.tipo] ?? ICON_OPTIONS.VOD;
                    const allIcons = icons.some(i => i.name === (form.icono || icons[0].name))
                      ? icons
                      : [{ name: form.icono, label: 'Actual' }, ...icons];
                    return (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {allIcons.map(({ name, label }) => {
                          const selected = (form.icono || icons[0].name) === name;
                          return (
                            <TouchableOpacity
                              key={name}
                              onPress={() => setForm((f) => ({ ...f, icono: name }))}
                              style={{
                                alignItems: 'center', gap: 5,
                                paddingHorizontal: 12, paddingVertical: 10,
                                borderRadius: 10, borderWidth: 1,
                                backgroundColor: selected ? `${color}22` : (isDark ? theme.liftBg : 'rgba(255,255,255,0.85)'),
                                borderColor: selected ? `${color}60` : (isDark ? theme.border : 'rgba(130,130,130,0.28)'),
                                minWidth: 62,
                              }}
                            >
                              <MaterialCommunityIcons name={name as any} size={22} color={selected ? color : (isDark ? theme.textSec : '#240046')} />
                              <Text style={{ color: selected ? (isDark ? theme.text : '#240046') : (isDark ? theme.textMuted : '#240046'), fontSize: 10, fontFamily: selected ? 'Montserrat-Bold' : 'Montserrat-Regular', fontWeight: selected ? '700' : '400', textAlign: 'center' }}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>

                {/* Descripción */}
                <View>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Montserrat-Bold' }}>Descripción</Text>
                  <TextInput
                    value={form.descripcion}
                    onChangeText={(v) => setForm((f) => ({ ...f, descripcion: v }))}
                    placeholder="Describe qué verá el abonado en esta sección…"
                    placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.4)'}
                    multiline
                    numberOfLines={3}
                    style={{ backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.9)', borderRadius: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', color: isDark ? theme.text : '#240046', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Montserrat-Regular', minHeight: 80, textAlignVertical: 'top', ...webInput }}
                  />
                </View>

                {/* Activo toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', fontFamily: 'Montserrat-Bold' }}>Activo al crear</Text>
                  <TouchableOpacity
                    onPress={() => setForm((f) => ({ ...f, activo: !f.activo }))}
                    style={{ width: 52, height: 28, borderRadius: 14, backgroundColor: form.activo ? theme.successSoft : theme.dangerSoft, justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1, borderColor: form.activo ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)' }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: form.activo ? theme.success : theme.danger, alignSelf: form.activo ? 'flex-end' : 'flex-start' }} />
                  </TouchableOpacity>
                </View>

                {formError ? (
                  <View style={{ backgroundColor: theme.dangerSoft, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: `${theme.danger}30` }}>
                    <Text style={{ color: theme.danger, fontSize: 12, fontFamily: 'Montserrat-SemiBold' }}>{formError}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={closeForm} disabled={isSaving} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)' }}>
                <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveForm}
                disabled={isSaving}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: isSaving ? theme.textMuted : theme.accent, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                {isSaving ? <ActivityIndicator size={12} color="#fff" /> : null}
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', fontFamily: 'Montserrat-Bold' }}>
                  {isSaving ? 'Guardando…' : editingComp ? 'Guardar cambios' : 'Crear componente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete confirm Modal ── */}
      <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: `${theme.danger}40`, overflow: 'hidden' }}>
            <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome name="trash" size={24} color={theme.danger} />
              </View>
              <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 17, fontWeight: '800', fontFamily: 'Montserrat-Bold', textAlign: 'center' }}>¿Eliminar componente?</Text>
              <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontFamily: 'Montserrat-Regular', textAlign: 'center', lineHeight: 20 }}>
                Se eliminará <Text style={{ fontFamily: 'Montserrat-Bold' }}>"{deleteTarget?.nombre}"</Text> permanentemente. Esta acción no se puede deshacer.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.border }}
              >
                <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 14, fontFamily: 'Montserrat-SemiBold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={isDeleting}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
              >
                {isDeleting ? <ActivityIndicator size={14} color={theme.danger} /> : null}
                <Text style={{ color: theme.danger, fontSize: 14, fontWeight: '800', fontFamily: 'Montserrat-Bold' }}>
                  {isDeleting ? 'Eliminando…' : 'Eliminar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </CmsShell>
  );
}
