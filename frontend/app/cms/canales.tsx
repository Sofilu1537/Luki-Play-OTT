import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { useCategoriasStore } from '../../services/categoriasStore';
import type { AdminCanal, AdminCanalPayload } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

const CAT_COLORS: Record<string, string> = {
  Noticias: '#0EA5E9', Deportes: '#10B981', Cine: '#F59E0B',
  Infantil: '#EC4899', Música: '#8B5CF6', General: '#64748B',
};

function catColor(nombre: string) {
  return CAT_COLORS[nombre] ?? '#64748B';
}

function emptyForm(): AdminCanalPayload {
  return {
    nombre: '',
    logo: '',
    streamUrl: '',
    detalle: '',
    categoryId: '',
    categoria: '',
    tipo: 'live',
    requiereControlParental: false,
    activo: true,
  };
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function CmsCanales() {
  const { profile } = useCmsStore();
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Store subscriptions
  // ---------------------------------------------------------------------------
  const { channels, createChannel, updateChannel, toggleChannelStatus, deleteChannel } = useChannelStore();
  const categorias = useCategoriasStore((s) => s.categorias);
  const activeCategories = useMemo(() => categorias.filter((c) => c.activo), [categorias]);

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCanal, setEditingCanal] = useState<AdminCanal | null>(null);
  const [form, setForm] = useState<AdminCanalPayload>(emptyForm());
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return channels
      .filter((c) => {
        if (categoryFilter !== 'all' && c.categoria !== categoryFilter) return false;
        if (!query) return true;
        return (
          c.nombre.toLowerCase().includes(query)
          || c.categoria.toLowerCase().includes(query)
          || c.detalle.toLowerCase().includes(query)
          || c.streamUrl.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.actualizadoEn ?? b.creadoEn).getTime() - new Date(a.actualizadoEn ?? a.creadoEn).getTime());
  }, [channels, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: channels.length,
    activos: channels.filter((c) => c.activo).length,
    parentales: channels.filter((c) => c.requiereControlParental).length,
  }), [channels]);

  // Filter chips: "Todos" + one per active category that has at least one channel
  const categoryChips = useMemo(() => {
    const usedNames = new Set(channels.map((c) => c.categoria));
    const chips = activeCategories.filter((c) => usedNames.has(c.nombre)).map((c) => c.nombre);
    return ['all', ...chips];
  }, [channels, activeCategories]);

  if (!profile) return null;

  // ---------------------------------------------------------------------------
  // Handlers (synchronous — store manages persistence)
  // ---------------------------------------------------------------------------
  function openCreateModal() {
    setEditingCanal(null);
    setForm(emptyForm());
    setFormError('');
    setModalVisible(true);
  }

  function openEditModal(canal: AdminCanal) {
    setEditingCanal(canal);
    setForm({
      nombre: canal.nombre,
      logo: canal.logo,
      streamUrl: canal.streamUrl,
      detalle: canal.detalle,
      categoryId: canal.categoryId ?? '',
      categoria: canal.categoria,
      tipo: 'live',
      requiereControlParental: canal.requiereControlParental,
      activo: canal.activo,
    });
    setFormError('');
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCanal(null);
    setForm(emptyForm());
    setFormError('');
  }

  function updateField<K extends keyof AdminCanalPayload>(field: K, value: AdminCanalPayload[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function selectCategory(cat: { id: string; nombre: string }) {
    setForm((f) => ({ ...f, categoryId: cat.id, categoria: cat.nombre }));
  }

  async function pickLogoFromFile() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setFormError('La carga desde archivo solo está disponible en web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        updateField('logo', result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function handleSave() {
    if (!form.nombre.trim()) { setFormError('El nombre del canal es requerido.'); return; }
    if (!form.streamUrl.trim() || !isValidUrl(form.streamUrl.trim())) { setFormError('La URL del canal debe ser válida (http/https).'); return; }
    if (!form.detalle.trim()) { setFormError('El detalle del canal es requerido.'); return; }
    if (!form.categoryId) { setFormError('Debes seleccionar una categoría para el canal.'); return; }

    setFormError('');
    setFeedback(null);
    try {
      if (editingCanal) {
        updateChannel(editingCanal.id, {
          ...form,
          nombre: form.nombre.trim(),
          streamUrl: form.streamUrl.trim(),
          detalle: form.detalle.trim(),
        });
        setFeedback({ type: 'success', message: 'Canal actualizado correctamente.' });
      } else {
        createChannel({
          ...form,
          nombre: form.nombre.trim(),
          streamUrl: form.streamUrl.trim(),
          detalle: form.detalle.trim(),
        });
        setFeedback({ type: 'success', message: 'Canal registrado correctamente.' });
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el canal.');
    }
  }

  function handleToggle(canal: AdminCanal) {
    try {
      toggleChannelStatus(canal.id);
      setFeedback({ type: 'success', message: `Canal ${canal.activo ? 'dado de baja' : 'activado'} correctamente.` });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'No se pudo cambiar el estado del canal.' });
    }
  }

  function handleDelete(canal: AdminCanal) {
    const confirmed = Platform.OS !== 'web' || typeof window === 'undefined'
      ? true
      : window.confirm(`¿Eliminar el canal "${canal.nombre}"?`);
    if (!confirmed) return;
    deleteChannel(canal.id);
    setFeedback({ type: 'success', message: 'Canal eliminado correctamente.' });
  }

  function resetFilters() {
    setCategoryFilter('all');
    setSearch('');
  }

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const formInputStyle = {
    backgroundColor: C.lift,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    ...webInput,
  };

  const isCompactResults = filtered.length > 0 && filtered.length <= 2;

  return (
    <CmsShell breadcrumbs={[{ label: 'Canales' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <View>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>Canales</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{stats.total} canales registrados · {stats.activos} activos</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
            onPress={openCreateModal}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Canal</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback */}
        {feedback ? (
          <View style={{ marginBottom: 14, borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)', backgroundColor: feedback.type === 'success' ? C.greenSoft : C.roseSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: feedback.type === 'success' ? C.green : C.rose, fontSize: 12, fontWeight: '700' }}>{feedback.message}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 120 }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>TOTALES</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>{stats.total}</Text>
          </View>
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 120 }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>ACTIVOS</Text>
            <Text style={{ color: C.green, fontSize: 18, fontWeight: '900' }}>{stats.activos}</Text>
          </View>
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 120 }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>PARENTALES</Text>
            <Text style={{ color: C.amber, fontSize: 18, fontWeight: '900' }}>{stats.parentales}</Text>
          </View>
        </View>

        {/* Search + filter */}
        <View style={{ marginBottom: 18 }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '800' }}>Catálogo de canales</Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Búsqueda rápida y filtros por categoría.</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 10 }}>
            <FontAwesome name="search" size={13} color={C.muted} />
            <TextInput
              style={{ flex: 1, color: C.text, paddingVertical: 12, paddingHorizontal: 10, fontSize: 13, ...webInput }}
              placeholder="Buscar canal, categoría o URL..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {(search || categoryFilter !== 'all') ? (
              <TouchableOpacity onPress={resetFilters} style={{ paddingLeft: 8, paddingVertical: 8 }}>
                <FontAwesome name="times-circle" size={15} color={C.muted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {categoryChips.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 12 }}>
              {categoryChips.map((cat) => {
                const selected = categoryFilter === cat;
                const label = cat === 'all' ? 'Todos' : cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: selected ? C.accentSoft : C.surface, borderWidth: 1, borderColor: selected ? C.accentBorder : C.border }}
                    onPress={() => setCategoryFilter(cat)}
                  >
                    <Text style={{ color: selected ? C.accentLight : C.textDim, fontSize: 12, fontWeight: '800' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        {/* Empty state */}
        {channels.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 40, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={26} color={C.accentLight} />
            </View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>Aún no hay canales registrados</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 340 }}>
              Crea tu primer canal con nombre, URL de stream, categoría y configuración parental. Aparecerá automáticamente en el Monitor.
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11, marginTop: 4 }}
              onPress={openCreateModal}
            >
              <FontAwesome name="plus" size={13} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Crear primer canal</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20, alignItems: 'center' }}>
            <FontAwesome name="tv" size={22} color={C.muted} />
            <Text style={{ color: C.text, fontSize: 14, fontWeight: '700', marginTop: 10 }}>Sin canales para mostrar</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>Ajusta los filtros o crea un nuevo canal.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            {filtered.map((canal) => {
              const color = catColor(canal.categoria);
              return (
                <View
                  key={canal.id}
                  style={{ backgroundColor: C.surface, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: C.border, minWidth: isCompactResults ? 260 : 200, flexGrow: 0, flexShrink: 0, flexBasis: isCompactResults ? 260 : 220, maxWidth: isCompactResults ? 340 : 280 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, backgroundColor: `${color}22`, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {canal.logo ? (
                        <View style={{ width: '100%', height: '100%' }}>
                          {/* @ts-ignore */}
                          <img src={canal.logo} alt={canal.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </View>
                      ) : (
                        <FontAwesome name="tv" size={20} color={color} />
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.24)' }} onPress={() => handleToggle(canal)}>
                        <FontAwesome name={canal.activo ? 'power-off' : 'play'} size={11} color={C.green} />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(180,144,255,0.24)' }} onPress={() => openEditModal(canal)}>
                        <FontAwesome name="pencil" size={11} color={C.cyan} />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }} onPress={() => handleDelete(canal)}>
                        <FontAwesome name="trash" size={11} color={C.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>{canal.nombre}</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 8 }} numberOfLines={2}>{canal.detalle}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: `${color}22`, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{canal.categoria || 'Sin categoría'}</Text>
                    </View>
                    <View style={{ backgroundColor: canal.activo ? C.greenSoft : C.roseSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: canal.activo ? C.green : C.rose, fontSize: 10, fontWeight: '700' }}>
                        {canal.activo ? 'ACTIVO' : 'DE BAJA'}
                      </Text>
                    </View>
                    {canal.requiereControlParental ? (
                      <View style={{ backgroundColor: 'rgba(245,158,11,0.18)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ color: C.amber, fontSize: 10, fontWeight: '700' }}>PARENTAL</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 3 }}>Tipo: LIVE</Text>
                  <Text style={{ color: C.muted, fontSize: 10 }} numberOfLines={1}>{canal.streamUrl}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 760, maxHeight: '90%', backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>

            {/* Modal header */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{editingCanal ? 'Editar canal' : 'Registrar canal'}</Text>
                <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Registro con URL, logo, categoría, estado y control parental.</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome name="times" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ color: C.textDim, fontSize: 12 }}>NOMBRE DEL CANAL</Text>
              <TextInput style={formInputStyle} value={form.nombre} onChangeText={(v) => updateField('nombre', v)} placeholder="Ej: Noticias 24" placeholderTextColor={C.muted} />

              <Text style={{ color: C.textDim, fontSize: 12 }}>URL DEL CANAL (STREAM)</Text>
              <TextInput style={formInputStyle} value={form.streamUrl} onChangeText={(v) => updateField('streamUrl', v)} placeholder="https://stream.example.com/canal" placeholderTextColor={C.muted} autoCapitalize="none" />

              <Text style={{ color: C.textDim, fontSize: 12 }}>LOGO DEL CANAL (URL o ARCHIVO)</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextInput style={{ ...formInputStyle, flex: 1 }} value={form.logo} onChangeText={(v) => updateField('logo', v)} placeholder="https://.../logo.png" placeholderTextColor={C.muted} autoCapitalize="none" />
                <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }} onPress={pickLogoFromFile}>
                  <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cargar imagen</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: C.textDim, fontSize: 12 }}>DETALLE</Text>
              <TextInput style={{ ...formInputStyle, minHeight: 88, textAlignVertical: 'top' }} value={form.detalle} onChangeText={(v) => updateField('detalle', v)} placeholder="Describe programación, enfoque y audiencia." placeholderTextColor={C.muted} multiline numberOfLines={3} />

              {/* Category selector — populated from categoriasStore */}
              <Text style={{ color: C.textDim, fontSize: 12 }}>CATEGORÍA <Text style={{ color: C.rose }}>*</Text></Text>
              {activeCategories.length === 0 ? (
                <View style={{ backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 14 }}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>No hay categorías activas. Ve a la sección Categorías para crear una.</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {activeCategories.map((cat) => {
                    const selected = form.categoryId === cat.id;
                    const color = catColor(cat.nombre);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: selected ? `${color}22` : C.lift, borderWidth: 1, borderColor: selected ? color : C.border }}
                        onPress={() => selectCategory(cat)}
                      >
                        <Text style={{ color: selected ? color : C.textDim, fontSize: 12, fontWeight: '700' }}>{cat.nombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {form.categoryId === '' && (
                <Text style={{ color: C.muted, fontSize: 11, marginTop: -4 }}>Selecciona una categoría para continuar.</Text>
              )}

              {/* Toggles */}
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: form.activo ? C.greenSoft : C.lift, borderWidth: 1, borderColor: form.activo ? 'rgba(16,185,129,0.28)' : C.border }} onPress={() => updateField('activo', !form.activo)}>
                  <FontAwesome name={form.activo ? 'toggle-on' : 'toggle-off'} size={16} color={form.activo ? C.green : C.textDim} />
                  <Text style={{ color: form.activo ? C.green : C.textDim, fontSize: 12, fontWeight: '700' }}>{form.activo ? 'Activo' : 'De baja'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: form.requiereControlParental ? C.roseSoft : C.lift, borderWidth: 1, borderColor: form.requiereControlParental ? 'rgba(244,63,94,0.28)' : C.border }} onPress={() => updateField('requiereControlParental', !form.requiereControlParental)}>
                  <FontAwesome name={form.requiereControlParental ? 'lock' : 'unlock'} size={14} color={form.requiereControlParental ? C.rose : C.textDim} />
                  <Text style={{ color: form.requiereControlParental ? C.rose : C.textDim, fontSize: 12, fontWeight: '700' }}>Control parental</Text>
                </TouchableOpacity>
              </View>

              {formError ? <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>{formError}</Text> : null}
            </ScrollView>

            {/* Modal footer */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift }} onPress={closeModal}>
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: C.accent }} onPress={handleSave}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>{editingCanal ? 'Guardar cambios' : 'Registrar canal'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CmsShell>
  );
}
