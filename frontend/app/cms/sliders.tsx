import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminCreateSlider,
  adminDeleteSlider,
  adminListSliders,
  adminReorderSliders,
  AdminSlider,
  AdminSliderPayload,
  adminToggleSlider,
  adminUpdateSlider,
} from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

function emptyForm(): AdminSliderPayload {
  return {
    titulo: '',
    subtitulo: '',
    imagen: '',
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

function sanitizeSlider(slider: AdminSlider): AdminSlider {
  return {
    ...slider,
    titulo: slider.titulo?.trim() || 'Slider sin titulo',
    subtitulo: slider.subtitulo?.trim() || 'Completa el subtitulo para destacar este banner.',
    imagen: slider.imagen?.trim() || 'https://placehold.co/1200x400/111827/ffffff?text=Banner',
  };
}

export default function CmsSliders() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [sliders, setSliders] = useState<AdminSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingSlider, setEditingSlider] = useState<AdminSlider | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AdminSliderPayload>(emptyForm());
  const [formError, setFormError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListSliders(accessToken)
      .then((items) => setSliders(items.map(sanitizeSlider).sort((a, b) => a.orden - b.orden)))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const stats = useMemo(() => {
    const total = sliders.length;
    const activos = sliders.filter((item) => item.activo).length;
    const draft = sliders.filter((item) => !item.activo).length;
    return { total, activos, draft };
  }, [sliders]);

  if (!profile) return null;

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const formInputStyle = {
    backgroundColor: C.lift,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    ...webInput,
  };

  async function refreshSliders() {
    if (!accessToken) return;
    const items = await adminListSliders(accessToken);
    setSliders(items.map(sanitizeSlider).sort((a, b) => a.orden - b.orden));
  }

  function openCreateModal() {
    setEditingSlider(null);
    setForm(emptyForm());
    setFormError('');
    setModalVisible(true);
  }

  function openEditModal(slider: AdminSlider) {
    setEditingSlider(slider);
    setForm({
      titulo: slider.titulo,
      subtitulo: slider.subtitulo,
      imagen: slider.imagen,
      activo: slider.activo,
    });
    setFormError('');
    setModalVisible(true);
  }

  function closeModal() {
    if (busy) return;
    setModalVisible(false);
    setEditingSlider(null);
    setForm(emptyForm());
    setFormError('');
  }

  function updateField<K extends keyof AdminSliderPayload>(field: K, value: AdminSliderPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    if (!accessToken) return;
    if (!form.titulo.trim()) {
      setFormError('El titulo del slider es requerido.');
      return;
    }
    if (!form.subtitulo.trim()) {
      setFormError('El subtitulo del slider es requerido.');
      return;
    }
    if (!form.imagen.trim() || !isValidUrl(form.imagen.trim())) {
      setFormError('La imagen debe ser una URL valida (http/https).');
      return;
    }

    setBusy(true);
    setFormError('');
    setFeedback(null);
    try {
      if (editingSlider) {
        await adminUpdateSlider(accessToken, editingSlider.id, {
          ...form,
          titulo: form.titulo.trim(),
          subtitulo: form.subtitulo.trim(),
          imagen: form.imagen.trim(),
        });
        setFeedback({ type: 'success', message: 'Slider actualizado correctamente.' });
      } else {
        await adminCreateSlider(accessToken, {
          ...form,
          titulo: form.titulo.trim(),
          subtitulo: form.subtitulo.trim(),
          imagen: form.imagen.trim(),
        });
        setFeedback({ type: 'success', message: 'Slider creado correctamente.' });
      }
      await refreshSliders();
      closeModal();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el slider.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(slider: AdminSlider) {
    if (!accessToken) return;
    setBusy(true);
    try {
      await adminToggleSlider(accessToken, slider.id);
      await refreshSliders();
      setFeedback({ type: 'success', message: `Slider ${slider.activo ? 'desactivado' : 'activado'} correctamente.` });
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo cambiar el estado del slider.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(slider: AdminSlider) {
    if (!accessToken) return;
    const confirmed = Platform.OS !== 'web' || typeof window === 'undefined'
      ? true
      : window.confirm(`¿Eliminar el slider ${slider.titulo}?`);

    if (!confirmed) return;

    setBusy(true);
    try {
      await adminDeleteSlider(accessToken, slider.id);
      await refreshSliders();
      setFeedback({ type: 'success', message: 'Slider eliminado correctamente.' });
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo eliminar el slider.' });
    } finally {
      setBusy(false);
    }
  }

  async function persistOrder(nextSliders: AdminSlider[]) {
    if (!accessToken) return;
    try {
      const ordered = await adminReorderSliders(accessToken, nextSliders.map((item) => item.id));
      setSliders(ordered.map(sanitizeSlider).sort((a, b) => a.orden - b.orden));
      setFeedback({ type: 'success', message: 'Orden de sliders actualizado.' });
    } catch (error: unknown) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar el orden.' });
      await refreshSliders();
    }
  }

  function reorderLocal(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const sourceIndex = sliders.findIndex((item) => item.id === sourceId);
    const targetIndex = sliders.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...sliders];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    const normalized = next.map((item, index) => ({ ...item, orden: index + 1 }));
    setSliders(normalized);
    persistOrder(normalized);
  }

  function renderActionButton(icon: React.ComponentProps<typeof FontAwesome>['name'], color: string, backgroundColor: string, onPress: () => void) {
    return (
      <TouchableOpacity
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.border,
        }}
        onPress={onPress}
      >
        <FontAwesome name={icon} size={13} color={color} />
      </TouchableOpacity>
    );
  }

  return (
    <CmsShell breadcrumbs={[{ label: 'Sliders' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <View>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>Sliders / Banners</Text>
            <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>
              Curaduría visual del hero del player con enfoque OTT y control editorial.
            </Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
            onPress={openCreateModal}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Slider</Text>
          </TouchableOpacity>
        </View>

        {feedback ? (
          <View style={{ borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)', backgroundColor: feedback.type === 'success' ? C.greenSoft : C.roseSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: feedback.type === 'success' ? C.green : C.rose, fontSize: 12, fontWeight: '700' }}>{feedback.message}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ minWidth: 150, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>TOTAL BANNERS</Text>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{stats.total}</Text>
          </View>
          <View style={{ minWidth: 150, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>PUBLICADOS</Text>
            <Text style={{ color: C.green, fontSize: 22, fontWeight: '900' }}>{stats.activos}</Text>
          </View>
          <View style={{ minWidth: 150, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>BORRADORES</Text>
            <Text style={{ color: C.amber, fontSize: 22, fontWeight: '900' }}>{stats.draft}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 6 }}>Vista editorial</Text>
          <Text style={{ color: C.textDim, fontSize: 12, lineHeight: 18 }}>
            Reordena banners arrastrando las cards en web. El título y subtítulo se renderizan sobre la imagen para simular la experiencia del hero en una plataforma de streaming.
          </Text>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
            {sliders.map((slider) => {
              const isDragging = draggingId === slider.id;
              const isDropTarget = hoveredDropId === slider.id && draggingId !== slider.id;
              const webDragProps = Platform.OS === 'web'
                ? {
                    draggable: true,
                    onDragStart: () => {
                      setDraggingId(slider.id);
                      setHoveredDropId(null);
                    },
                    onDragEnd: () => {
                      setDraggingId(null);
                      setHoveredDropId(null);
                    },
                    onDragOver: (event: any) => {
                      event.preventDefault();
                      if (draggingId && draggingId !== slider.id) {
                        setHoveredDropId(slider.id);
                      }
                    },
                    onDrop: (event: any) => {
                      event.preventDefault();
                      if (draggingId) {
                        reorderLocal(draggingId, slider.id);
                      }
                      setDraggingId(null);
                      setHoveredDropId(null);
                    },
                  }
                : {};

              return (
                <View
                  key={slider.id}
                  {...(webDragProps as any)}
                  style={{
                    width: '100%',
                    maxWidth: 372,
                    minWidth: 280,
                    borderRadius: 22,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDropTarget ? C.accentBorder : C.border,
                    backgroundColor: C.surface,
                    opacity: isDragging ? 0.58 : 1,
                    transform: [{ scale: isDragging ? 0.98 : 1 }],
                    shadowColor: '#000',
                    shadowOpacity: 0.28,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 12,
                  }}
                >
                  <View style={{ position: 'relative', aspectRatio: 16 / 9, backgroundColor: '#0F172A' }}>
                    <Image source={{ uri: slider.imagen }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,7,18,0.20)' }} />
                    <View style={{ position: 'absolute', left: 16, right: 16, top: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: slider.activo ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)', borderWidth: 1, borderColor: slider.activo ? 'rgba(16,185,129,0.26)' : 'rgba(245,158,11,0.26)' }}>
                        <Text style={{ color: slider.activo ? C.green : C.amber, fontSize: 10, fontWeight: '800' }}>
                          {slider.activo ? 'PUBLICADO' : 'BORRADOR'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {renderActionButton(slider.activo ? 'eye-slash' : 'eye', slider.activo ? C.amber : C.green, 'rgba(15,23,42,0.72)', () => handleToggle(slider))}
                        {renderActionButton('pencil', C.cyan, 'rgba(15,23,42,0.72)', () => openEditModal(slider))}
                        {renderActionButton('trash', C.rose, 'rgba(15,23,42,0.72)', () => handleDelete(slider))}
                      </View>
                    </View>
                    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(5,11,23,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>{slider.orden}</Text>
                      </View>
                      <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', lineHeight: 26, marginBottom: 6 }} numberOfLines={2}>
                        {slider.titulo}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                        {slider.subtitulo}
                      </Text>
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.textDim, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>BANNER HERO</Text>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{slider.titulo}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FontAwesome name="arrows" size={12} color={C.muted} />
                      <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700' }}>Drag & drop</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(7,10,20,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 720, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{editingSlider ? 'Editar slider' : 'Crear slider'}</Text>
                <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>Gestiona banners visuales del hero principal del player.</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome name="times" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ color: C.textDim, fontSize: 12 }}>TITULO</Text>
              <TextInput style={formInputStyle} value={form.titulo} onChangeText={(value) => updateField('titulo', value)} placeholder="Ej: Estrenos destacados" placeholderTextColor={C.muted} />

              <Text style={{ color: C.textDim, fontSize: 12 }}>SUBTITULO</Text>
              <TextInput style={formInputStyle} value={form.subtitulo} onChangeText={(value) => updateField('subtitulo', value)} placeholder="Ej: Lo mejor del catálogo esta semana" placeholderTextColor={C.muted} />

              <Text style={{ color: C.textDim, fontSize: 12 }}>IMAGEN DEL BANNER</Text>
              <TextInput style={formInputStyle} value={form.imagen} onChangeText={(value) => updateField('imagen', value)} placeholder="https://.../banner.jpg" placeholderTextColor={C.muted} autoCapitalize="none" />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: form.activo ? C.greenSoft : C.lift, borderWidth: 1, borderColor: form.activo ? 'rgba(16,185,129,0.28)' : C.border }} onPress={() => updateField('activo', !form.activo)}>
                  <FontAwesome name={form.activo ? 'toggle-on' : 'toggle-off'} size={16} color={form.activo ? C.green : C.textDim} />
                  <Text style={{ color: form.activo ? C.green : C.textDim, fontSize: 12, fontWeight: '700' }}>{form.activo ? 'Publicado' : 'Borrador'}</Text>
                </TouchableOpacity>
              </View>

              {form.imagen?.trim() ? (
                <View style={{ marginTop: 6, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
                  <View style={{ aspectRatio: 16 / 7, backgroundColor: '#0F172A' }}>
                    <Image source={{ uri: form.imagen.trim() }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }} numberOfLines={2}>{form.titulo || 'Titulo del slider'}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4 }} numberOfLines={2}>{form.subtitulo || 'Subtitulo del slider'}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {formError ? <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>{formError}</Text> : null}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift }} onPress={closeModal}>
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent, opacity: busy ? 0.7 : 1 }} onPress={handleSave} disabled={busy}>
                {busy ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>{editingSlider ? 'Guardar cambios' : 'Crear slider'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CmsShell>
  );
}