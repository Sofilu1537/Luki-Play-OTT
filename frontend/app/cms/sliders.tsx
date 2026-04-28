import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { API_BASE_URL } from '../../services/api/config';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminCreateSlider,
  adminDeleteSlider,
  adminListSliders,
  adminReorderSliders,
  adminUploadSliderImage,
  AdminSlider,
  AdminSliderPayload,
  adminToggleSlider,
  adminUpdateSlider,
  SliderActionType,
} from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

function emptyForm(): AdminSliderPayload {
  return {
    titulo: '',
    subtitulo: null,
    imagen: '',
    imagenMobile: null,
    activo: true,
    actionType: 'NONE',
    actionValue: null,
    startDate: null,
    endDate: null,
    planIds: [],
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
  const { isDark, theme } = useTheme();
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
    backgroundColor: theme.liftBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
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
      imagenMobile: slider.imagenMobile,
      activo: slider.activo,
      actionType: slider.actionType,
      actionValue: slider.actionValue,
      startDate: slider.startDate,
      endDate: slider.endDate,
      planIds: slider.planIds,
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

  async function handlePickImage() {
    if (Platform.OS !== 'web' || !accessToken) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(
          `${API_BASE_URL}/admin/sliders/upload-imagen`,
          { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: fd },
        );
        if (res.ok) {
          const { url } = (await res.json()) as { url: string };
          updateField('imagen', url);
        } else {
          setFormError('Error al subir la imagen. Intenta de nuevo.');
        }
      } catch {
        setFormError('Error al subir la imagen. Intenta de nuevo.');
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    if (!accessToken) return;
    if (!form.titulo.trim()) {
      setFormError('El titulo del slider es requerido.');
      return;
    }
    if (form.subtitulo && !form.subtitulo.trim()) {
      setFormError('El subtitulo no puede estar en blanco si se especifica.');
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
      const payload: AdminSliderPayload = {
        ...form,
        titulo: form.titulo.trim(),
        subtitulo: form.subtitulo?.trim() || null,
        imagen: form.imagen.trim(),
      };
      if (editingSlider) {
        await adminUpdateSlider(accessToken, editingSlider.id, payload);
        setFeedback({ type: 'success', message: 'Slider actualizado correctamente.' });
      } else {
        await adminCreateSlider(accessToken, payload);
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
          borderColor: theme.border,
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
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden' }}
            onPress={openCreateModal}
          >
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: theme.accent }} />
            </View>
            <FontAwesome name="plus" size={13} color="#1A1A2E" />
            <Text style={{ color: '#1A1A2E', fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Nuevo Slider</Text>
          </TouchableOpacity>
        </View>

        {feedback ? (
          <View style={{ borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)', backgroundColor: feedback.type === 'success' ? theme.successSoft : theme.dangerSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text style={{ color: feedback.type === 'success' ? theme.success : theme.danger, fontSize: 12, fontWeight: '700' }}>{feedback.message}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total banners', value: stats.total,   icon: 'image'        as const, color: theme.text,    bg: `${theme.text}18`    },
            { label: 'Publicados',    value: stats.activos, icon: 'check-circle' as const, color: theme.success,  bg: theme.successSoft    },
            { label: 'Borradores',    value: stats.draft,   icon: 'pencil'       as const, color: theme.warning,  bg: theme.warningSoft    },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, minWidth: 180, backgroundColor: theme.cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
              </View>
              <Text style={{ color: item.color, fontSize: 22, fontWeight: '800' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={theme.accent} size="large" />
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
                    borderColor: isDropTarget ? theme.accentBorder : theme.border,
                    backgroundColor: theme.cardBg,
                    opacity: isDragging ? 0.58 : 1,
                    transform: [{ scale: isDragging ? 0.98 : 1 }],
                    shadowColor: '#000',
                    shadowOpacity: 0.28,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 12,
                  }}
                >
                  <View style={{ position: 'relative', aspectRatio: 16 / 9, backgroundColor: '#160035' }}>
                    <Image source={{ uri: slider.imagen }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,7,18,0.20)' }} />
                    <View style={{ position: 'absolute', left: 16, right: 16, top: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: slider.activo ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)', borderWidth: 1, borderColor: slider.activo ? 'rgba(16,185,129,0.26)' : 'rgba(245,158,11,0.26)' }}>
                        <Text style={{ color: slider.activo ? theme.success : theme.warning, fontSize: 10, fontWeight: '800' }}>
                          {slider.activo ? 'PUBLICADO' : 'BORRADOR'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {renderActionButton(slider.activo ? 'eye-slash' : 'eye', slider.activo ? theme.warning : theme.success, 'rgba(22,0,53,0.72)', () => handleToggle(slider))}
                        {renderActionButton('pencil', theme.success, 'rgba(22,0,53,0.72)', () => openEditModal(slider))}
                        {renderActionButton('trash', theme.danger, 'rgba(22,0,53,0.72)', () => handleDelete(slider))}
                      </View>
                    </View>
                    <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(13,0,32,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>{slider.orden}</Text>
                      </View>
                      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>
                        {slider.titulo}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                        {slider.subtitulo}
                      </Text>
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>BANNER HERO</Text>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{slider.titulo}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FontAwesome name="arrows" size={12} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>Drag &amp; drop</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 720, backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>{editingSlider ? 'Editar slider' : 'Crear slider'}</Text>
                <Text style={{ color: theme.textSec, fontSize: 12, marginTop: 4 }}>Gestiona banners visuales del hero principal del player.</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome name="times" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              <Text style={{ color: theme.textSec, fontSize: 12 }}>TITULO</Text>
              <TextInput style={formInputStyle} value={form.titulo} onChangeText={(value) => updateField('titulo', value)} placeholder="Ej: Estrenos destacados" placeholderTextColor={theme.textMuted} />

              <Text style={{ color: theme.textSec, fontSize: 12 }}>SUBTITULO</Text>
              <TextInput style={formInputStyle} value={form.subtitulo ?? ''} onChangeText={(value) => updateField('subtitulo', value || null)} placeholder="Ej: Lo mejor del catálogo esta semana" placeholderTextColor={theme.textMuted} />

              <Text style={{ color: theme.textSec, fontSize: 12 }}>IMAGEN DEL BANNER (1200×628px recomendado)</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput style={[formInputStyle, { flex: 1 }]} value={form.imagen} onChangeText={(value) => updateField('imagen', value)} placeholder="https://.../banner.jpg o /uploads/sliders/..." placeholderTextColor={theme.textMuted} autoCapitalize="none" />
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                    style={{ paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    {uploadingImage
                      ? <ActivityIndicator size="small" color={theme.accent} />
                      : <FontAwesome name="upload" size={14} color={theme.textSec} />
                    }
                    <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Subir</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={{ color: theme.textSec, fontSize: 12 }}>ACCIÓN AL TOCAR EL BANNER</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['NONE', 'PLAY_CHANNEL', 'NAVIGATE_CATEGORY', 'SHOW_PLAN', 'OPEN_URL'] as SliderActionType[]).map((action) => (
                  <TouchableOpacity
                    key={action}
                    onPress={() => updateField('actionType', action)}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: form.actionType === action ? theme.accent : theme.border, backgroundColor: form.actionType === action ? 'rgba(91,91,214,0.12)' : theme.liftBg }}
                  >
                    <Text style={{ color: form.actionType === action ? theme.accent : theme.textSec, fontSize: 11, fontWeight: '700' }}>
                      {action === 'NONE' ? 'Sin acción' : action === 'PLAY_CHANNEL' ? '▶ Canal' : action === 'NAVIGATE_CATEGORY' ? '🗂 Categoría' : action === 'SHOW_PLAN' ? '⭐ Plan' : '🔗 URL'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {form.actionType !== 'NONE' && (
                <>
                  <Text style={{ color: theme.textSec, fontSize: 12 }}>
                    {form.actionType === 'PLAY_CHANNEL' ? 'ID DEL CANAL' : form.actionType === 'NAVIGATE_CATEGORY' ? 'ID DE LA CATEGORÍA' : form.actionType === 'SHOW_PLAN' ? 'ID DEL PLAN (opcional)' : 'URL DESTINO'}
                  </Text>
                  <TextInput
                    style={formInputStyle}
                    value={form.actionValue ?? ''}
                    onChangeText={(value) => updateField('actionValue', value || null)}
                    placeholder={form.actionType === 'OPEN_URL' ? 'https://...' : 'ID del recurso'}
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                  />
                </>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: form.activo ? theme.successSoft : theme.liftBg, borderWidth: 1, borderColor: form.activo ? 'rgba(16,185,129,0.28)' : theme.border }} onPress={() => updateField('activo', !form.activo)}>
                  <FontAwesome name={form.activo ? 'toggle-on' : 'toggle-off'} size={16} color={form.activo ? theme.success : theme.textSec} />
                  <Text style={{ color: form.activo ? theme.success : theme.textSec, fontSize: 12, fontWeight: '700' }}>{form.activo ? 'Publicado' : 'Borrador'}</Text>
                </TouchableOpacity>
              </View>

              {form.imagen?.trim() ? (
                <View style={{ marginTop: 6, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ aspectRatio: 16 / 7, backgroundColor: '#160035' }}>
                    <Image source={{ uri: form.imagen.trim() }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', left: 14, right: 14, bottom: 14 }}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }} numberOfLines={2}>{form.titulo || 'Titulo del slider'}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4 }} numberOfLines={2}>{form.subtitulo || 'Subtitulo del slider'}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {formError ? <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>{formError}</Text> : null}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }} onPress={closeModal}>
                <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.accent, opacity: busy ? 0.7 : 1 }} onPress={handleSave} disabled={busy}>
                {busy ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>{editingSlider ? 'Guardar cambios' : 'Crear slider'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CmsShell>
  );
}