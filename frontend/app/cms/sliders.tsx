import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, Modal, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../services/api/config';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminCreateSlider, adminDeleteSlider, adminListSliders,
  adminReorderSliders, AdminSlider, AdminSliderPayload,
  adminToggleSlider, adminUpdateSlider, SliderActionType,
} from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyForm(): AdminSliderPayload {
  return {
    titulo: '', subtitulo: null, imagen: '', imagenMobile: null,
    activo: true, actionType: 'NONE', actionValue: null,
    startDate: null, endDate: null, planIds: [],
  };
}

function isValidImageSrc(v: string) {
  if (v.startsWith('/uploads/')) return true;
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function resolveImg(src: string) {
  return src.startsWith('/') ? `${API_BASE_URL}${src}` : src;
}

function sanitize(slider: AdminSlider): AdminSlider {
  return {
    ...slider,
    titulo:    slider.titulo?.trim()    || 'Sin título',
    subtitulo: slider.subtitulo?.trim() || null,
    imagen:    slider.imagen?.trim()    || '',
  };
}

const ACTION_META: Record<SliderActionType, { label: string; icon: string; color: string }> = {
  NONE:              { label: 'Sin acción',  icon: 'ban',          color: '#6B7280' },
  PLAY_CHANNEL:      { label: 'Ver canal',   icon: 'play-circle',  color: '#10B981' },
  NAVIGATE_CATEGORY: { label: 'Categoría',   icon: 'th-large',     color: '#6366F1' },
  SHOW_PLAN:         { label: 'Ver plan',    icon: 'star',         color: '#F59E0B' },
  OPEN_URL:          { label: 'Abrir URL',   icon: 'external-link',color: '#3B82F6' },
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  visible, title, message, onConfirm, onCancel, busy,
}: {
  visible: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; busy: boolean;
}) {
  const { theme } = useTheme();
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 24, gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <FontAwesome name="trash" size={18} color={theme.danger} />
          </View>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: theme.textSec, fontSize: 13, lineHeight: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
              <Text style={{ color: theme.textSec, fontWeight: '700', fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} disabled={busy} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.danger, alignItems: 'center', opacity: busy ? 0.7 : 1 }}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Eliminar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

function ImageUploadZone({
  value, onChange, loading, onPick, theme,
}: {
  value: string; onChange: (v: string) => void; loading: boolean;
  onPick: () => void; theme: any;
}) {
  const hasImage = value.trim() && isValidImageSrc(value.trim());
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <View style={{ gap: 8 }}>
      {/* Drop zone / preview */}
      <TouchableOpacity
        onPress={onPick}
        disabled={loading}
        activeOpacity={0.8}
        style={{
          borderRadius: 12, overflow: 'hidden', borderWidth: hasImage ? 0 : 2,
          borderColor: theme.border, borderStyle: 'dashed' as any,
          backgroundColor: hasImage ? 'transparent' : theme.liftBg,
          aspectRatio: 16 / 7, alignItems: 'center', justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <>
            <Image source={{ uri: resolveImg(value.trim()) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0)', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: 'rgba(13,0,32,0.72)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome name="pencil" size={13} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {loading ? 'Subiendo...' : 'Cambiar imagen'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: 10 }}>
            {loading
              ? <ActivityIndicator size="large" color={theme.accent} />
              : <>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${theme.accent}22`, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="cloud-upload" size={22} color={theme.accent} />
                  </View>
                  <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                    {Platform.OS === 'web' ? 'Haz clic para subir una imagen' : 'Seleccionar imagen'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>
                    PNG, JPG, WEBP · Recomendado 1200×628px
                  </Text>
                </>
            }
          </View>
        )}
      </TouchableOpacity>

      {/* URL manual */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <Text style={{ color: theme.textMuted, fontSize: 11 }}>o pega una URL</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>
      <TextInput
        style={{ backgroundColor: theme.liftBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border, color: theme.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, ...webInput }}
        value={value}
        onChangeText={onChange}
        placeholder="https://cdn.ejemplo.com/banner.jpg"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Slider Row ───────────────────────────────────────────────────────────────

function SliderRow({
  slider, index, total, theme, isDragging, isDropTarget,
  onEdit, onDuplicate, onToggle, onDelete, webDragProps,
}: {
  slider: AdminSlider; index: number; total: number; theme: any;
  isDragging: boolean; isDropTarget: boolean;
  onEdit: () => void; onDuplicate: () => void;
  onToggle: () => void; onDelete: () => void;
  webDragProps: object;
}) {
  const actionMeta = ACTION_META[slider.actionType];
  const hasImage = slider.imagen && isValidImageSrc(slider.imagen);

  return (
    <View
      {...(webDragProps as any)}
      style={{
        flexDirection: 'row', alignItems: 'stretch',
        backgroundColor: theme.cardBg,
        borderRadius: 14, overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDropTarget ? theme.accentBorder : isDragging ? theme.accent : theme.border,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 10,
      }}
    >
      {/* Drag handle + position */}
      <View style={{ width: 48, backgroundColor: theme.liftBg, alignItems: 'center', justifyContent: 'center', gap: 6, borderRightWidth: 1, borderRightColor: theme.border }}>
        <FontAwesome name="bars" size={14} color={theme.textMuted} style={{ cursor: 'grab' } as any} />
        <View style={{ backgroundColor: `${theme.accent}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800' }}>{index + 1}/{total}</Text>
        </View>
      </View>

      {/* Thumbnail */}
      <View style={{ width: 140, aspectRatio: 16 / 9, backgroundColor: '#160035', position: 'relative' }}>
        {hasImage ? (
          <Image source={{ uri: resolveImg(slider.imagen) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <FontAwesome name="image" size={24} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>Sin imagen</Text>
          </View>
        )}
        {/* Status dot overlay */}
        <View style={{ position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: slider.activo ? '#10B981' : '#F59E0B' }} />
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
            {slider.activo ? 'LIVE' : 'DRAFT'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center', gap: 4 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
          {slider.titulo}
        </Text>
        {slider.subtitulo && (
          <Text style={{ color: theme.textSec, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>
            {slider.subtitulo}
          </Text>
        )}
        {/* Action badge */}
        {slider.actionType !== 'NONE' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${actionMeta.color}18`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${actionMeta.color}30` }}>
              <FontAwesome name={actionMeta.icon as any} size={10} color={actionMeta.color} />
              <Text style={{ color: actionMeta.color, fontSize: 10, fontWeight: '700' }}>
                {actionMeta.label}
                {slider.actionValue ? `: ${slider.actionValue.slice(0, 20)}` : ''}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={{ paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', gap: 6, borderLeftWidth: 1, borderLeftColor: theme.border }}>
        <ActionIconBtn icon="pencil"     color={theme.textSec}  tooltip="Editar"      onPress={onEdit} />
        <ActionIconBtn icon="copy"       color={theme.info}     tooltip="Duplicar"    onPress={onDuplicate} />
        <ActionIconBtn icon={slider.activo ? 'eye-slash' : 'eye'} color={slider.activo ? theme.warning : theme.success} tooltip={slider.activo ? 'Desactivar' : 'Publicar'} onPress={onToggle} />
        <ActionIconBtn icon="trash"      color={theme.danger}   tooltip="Eliminar"    onPress={onDelete} />
      </View>
    </View>
  );
}

function ActionIconBtn({ icon, color, tooltip, onPress }: {
  icon: any; color: string; tooltip: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={tooltip}
      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${color}25` }}
    >
      <FontAwesome name={icon} size={12} color={color} />
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CmsSliders() {
  const { theme } = useTheme();
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();

  const [sliders, setSliders]           = useState<AdminSlider[]>([]);
  const [loading, setLoading]           = useState(true);
  const [busy, setBusy]                 = useState(false);
  const [feedback, setFeedback]         = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingSlider, setEditingSlider] = useState<AdminSlider | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm]                 = useState<AdminSliderPayload>(emptyForm());
  const [formError, setFormError]       = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSlider | null>(null);
  const [deleteBusy, setDeleteBusy]     = useState(false);
  const feedbackTimer                   = useRef<ReturnType<typeof setTimeout>>();
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  useEffect(() => { if (!profile) router.replace('/cms/login' as never); }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    adminListSliders(accessToken)
      .then((items) => setSliders(items.map(sanitize).sort((a, b) => a.orden - b.orden)))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const stats = useMemo(() => ({
    total:   sliders.length,
    activos: sliders.filter((s) => s.activo).length,
    draft:   sliders.filter((s) => !s.activo).length,
  }), [sliders]);

  if (!profile) return null;

  // ── Helpers ──

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  }

  async function refresh() {
    if (!accessToken) return;
    const items = await adminListSliders(accessToken);
    setSliders(items.map(sanitize).sort((a, b) => a.orden - b.orden));
  }

  function updateField<K extends keyof AdminSliderPayload>(field: K, value: AdminSliderPayload[K]) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  // ── Handlers ──

  function openCreate() {
    setEditingSlider(null); setForm(emptyForm()); setFormError(''); setModalVisible(true);
  }

  function openEdit(slider: AdminSlider) {
    setEditingSlider(slider);
    setForm({
      titulo: slider.titulo, subtitulo: slider.subtitulo, imagen: slider.imagen,
      imagenMobile: slider.imagenMobile, activo: slider.activo,
      actionType: slider.actionType, actionValue: slider.actionValue,
      startDate: slider.startDate, endDate: slider.endDate, planIds: slider.planIds,
    });
    setFormError(''); setModalVisible(true);
  }

  function closeModal() {
    if (busy) return;
    setModalVisible(false); setEditingSlider(null); setForm(emptyForm()); setFormError('');
  }

  async function handlePickImage() {
    if (Platform.OS !== 'web' || !accessToken) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/admin/sliders/upload-imagen`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: fd,
        });
        if (res.ok) { const { url } = (await res.json()) as { url: string }; updateField('imagen', url); }
        else setFormError('Error al subir. Intenta de nuevo.');
      } catch { setFormError('Error al subir. Intenta de nuevo.'); }
      finally { setUploadingImage(false); }
    };
    input.click();
  }

  async function handleSave() {
    if (!accessToken) return;
    if (!form.titulo.trim()) { setFormError('El título es requerido.'); return; }
    if (!form.imagen.trim() || !isValidImageSrc(form.imagen.trim())) {
      setFormError('Sube una imagen o pega una URL válida.'); return;
    }
    setBusy(true); setFormError('');
    try {
      const payload: AdminSliderPayload = {
        ...form, titulo: form.titulo.trim(),
        subtitulo: form.subtitulo?.trim() || null, imagen: form.imagen.trim(),
      };
      if (editingSlider) {
        await adminUpdateSlider(accessToken, editingSlider.id, payload);
        showFeedback('success', 'Banner actualizado correctamente.');
      } else {
        await adminCreateSlider(accessToken, payload);
        showFeedback('success', 'Banner creado y publicado.');
      }
      await refresh(); closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally { setBusy(false); }
  }

  async function handleDuplicate(slider: AdminSlider) {
    if (!accessToken) return; setBusy(true);
    try {
      await adminCreateSlider(accessToken, {
        titulo: `${slider.titulo} (copia)`, subtitulo: slider.subtitulo,
        imagen: slider.imagen, imagenMobile: slider.imagenMobile,
        activo: false, actionType: slider.actionType,
        actionValue: slider.actionValue, startDate: null, endDate: null,
        planIds: slider.planIds,
      });
      await refresh(); showFeedback('success', 'Banner duplicado como borrador.');
    } catch { showFeedback('error', 'No se pudo duplicar.'); }
    finally { setBusy(false); }
  }

  async function handleToggle(slider: AdminSlider) {
    if (!accessToken) return; setBusy(true);
    try {
      await adminToggleSlider(accessToken, slider.id); await refresh();
      showFeedback('success', `Banner ${slider.activo ? 'desactivado' : 'publicado'}.`);
    } catch { showFeedback('error', 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget || !accessToken) return; setDeleteBusy(true);
    try {
      await adminDeleteSlider(accessToken, deleteTarget.id); await refresh();
      showFeedback('success', 'Banner eliminado.');
      setDeleteTarget(null);
    } catch { showFeedback('error', 'No se pudo eliminar.'); }
    finally { setDeleteBusy(false); }
  }

  function reorderLocal(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const si = sliders.findIndex((s) => s.id === sourceId);
    const ti = sliders.findIndex((s) => s.id === targetId);
    if (si === -1 || ti === -1) return;
    const next = [...sliders];
    const [moved] = next.splice(si, 1);
    next.splice(ti, 0, moved);
    const normalized = next.map((s, i) => ({ ...s, orden: i + 1 }));
    setSliders(normalized);
    adminReorderSliders(accessToken!, normalized.map((s) => s.id))
      .then(() => showFeedback('success', 'Orden guardado.'))
      .catch(() => { showFeedback('error', 'No se pudo guardar el orden.'); refresh(); });
  }

  const formInputStyle = {
    backgroundColor: theme.liftBg, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
    color: theme.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, ...webInput,
  };

  // ── Render ──

  return (
    <CmsShell breadcrumbs={[{ label: 'Banners' }]}>

      {/* Toast feedback */}
      {feedback && (
        <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 999, maxWidth: 340, backgroundColor: feedback.type === 'success' ? theme.successSoft : theme.dangerSoft, borderWidth: 1, borderColor: feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FontAwesome name={feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'} size={16} color={feedback.type === 'success' ? theme.success : theme.danger} />
          <Text style={{ color: feedback.type === 'success' ? theme.success : theme.danger, fontSize: 13, fontWeight: '700', flex: 1 }}>{feedback.message}</Text>
          <TouchableOpacity onPress={() => setFeedback(null)}>
            <FontAwesome name="times" size={13} color={feedback.type === 'success' ? theme.success : theme.danger} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 20 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>Banners</Text>
            <Text style={{ color: theme.textSec, fontSize: 13, marginTop: 2 }}>
              Gestiona los banners del carrusel principal de la app
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreate}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <FontAwesome name="plus" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Nuevo banner</Text>
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Total',       value: stats.total,   color: theme.textSec,  dot: theme.textSec  },
            { label: 'Publicados',  value: stats.activos, color: theme.success,  dot: '#10B981'       },
            { label: 'Borradores',  value: stats.draft,   color: theme.warning,  dot: '#F59E0B'       },
          ].map((s) => (
            <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.cardBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.dot }} />
              <Text style={{ color: s.color, fontSize: 13, fontWeight: '800' }}>{s.value}</Text>
              <Text style={{ color: theme.textSec, fontSize: 12 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textSec, marginTop: 14, fontSize: 13 }}>Cargando banners...</Text>
          </View>
        ) : sliders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: `${theme.accent}18`, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="image" size={32} color={theme.accent} />
            </View>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Sin banners aún</Text>
            <Text style={{ color: theme.textSec, fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
              Crea tu primer banner para que aparezca en el carrusel del home de la app.
            </Text>
            <TouchableOpacity
              onPress={openCreate}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 11, marginTop: 6 }}
            >
              <FontAwesome name="plus" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Crear primer banner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 }}>
              ARRASTRA LAS FILAS PARA REORDENAR
            </Text>
            {sliders.map((slider, index) => {
              const isDragging   = draggingId === slider.id;
              const isDropTarget = hoveredDropId === slider.id && draggingId !== slider.id;
              const webDragProps = Platform.OS === 'web' ? {
                draggable: true,
                onDragStart: () => { setDraggingId(slider.id); setHoveredDropId(null); },
                onDragEnd:   () => { setDraggingId(null); setHoveredDropId(null); },
                onDragOver:  (e: any) => { e.preventDefault(); if (draggingId && draggingId !== slider.id) setHoveredDropId(slider.id); },
                onDrop:      (e: any) => { e.preventDefault(); if (draggingId) reorderLocal(draggingId, slider.id); setDraggingId(null); setHoveredDropId(null); },
              } : {};
              return (
                <SliderRow
                  key={slider.id}
                  slider={slider} index={index} total={sliders.length} theme={theme}
                  isDragging={isDragging} isDropTarget={isDropTarget}
                  onEdit={() => openEdit(slider)}
                  onDuplicate={() => handleDuplicate(slider)}
                  onToggle={() => handleToggle(slider)}
                  onDelete={() => setDeleteTarget(slider)}
                  webDragProps={webDragProps}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Edit / Create Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 800, backgroundColor: theme.cardBg, borderRadius: 20, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', maxHeight: '90%' }}>

            {/* Modal header */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${theme.accent}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="image" size={16} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>
                    {editingSlider ? 'Editar banner' : 'Nuevo banner'}
                  </Text>
                  <Text style={{ color: theme.textSec, fontSize: 12, marginTop: 2 }}>
                    {editingSlider ? `Modificando: ${editingSlider.titulo}` : 'Aparecerá en el carrusel del home'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.liftBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                <FontAwesome name="times" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {/* Two-column layout on wide screens */}
              <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>

                {/* Left: form fields */}
                <View style={{ flex: 1, minWidth: 280, gap: 16 }}>

                  {/* Título */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>TÍTULO *</Text>
                    <TextInput style={formInputStyle} value={form.titulo} onChangeText={(v) => updateField('titulo', v)} placeholder="Ej: Estrenos de abril" placeholderTextColor={theme.textMuted} />
                  </View>

                  {/* Subtítulo */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>SUBTÍTULO</Text>
                    <TextInput style={[formInputStyle, { minHeight: 60 }]} value={form.subtitulo ?? ''} onChangeText={(v) => updateField('subtitulo', v || null)} placeholder="Descripción breve del banner" placeholderTextColor={theme.textMuted} multiline />
                  </View>

                  {/* Imagen */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>IMAGEN DEL BANNER *</Text>
                    <ImageUploadZone
                      value={form.imagen} onChange={(v) => updateField('imagen', v)}
                      loading={uploadingImage} onPick={handlePickImage} theme={theme}
                    />
                  </View>

                  {/* Estado */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>ESTADO</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[{ value: true, label: 'Publicado', icon: 'eye', color: theme.success, soft: theme.successSoft },
                        { value: false, label: 'Borrador',  icon: 'pencil', color: theme.warning, soft: theme.warningSoft }].map((opt) => (
                        <TouchableOpacity
                          key={String(opt.value)}
                          onPress={() => updateField('activo', opt.value)}
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: form.activo === opt.value ? opt.color : theme.border, backgroundColor: form.activo === opt.value ? opt.soft : theme.liftBg }}
                        >
                          <FontAwesome name={opt.icon as any} size={13} color={form.activo === opt.value ? opt.color : theme.textMuted} />
                          <Text style={{ color: form.activo === opt.value ? opt.color : theme.textSec, fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Acción */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>ACCIÓN AL TOCAR</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(Object.entries(ACTION_META) as [SliderActionType, typeof ACTION_META[SliderActionType]][]).map(([key, meta]) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => updateField('actionType', key)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: form.actionType === key ? meta.color : theme.border, backgroundColor: form.actionType === key ? `${meta.color}18` : theme.liftBg }}
                        >
                          <FontAwesome name={meta.icon as any} size={11} color={form.actionType === key ? meta.color : theme.textMuted} />
                          <Text style={{ color: form.actionType === key ? meta.color : theme.textSec, fontSize: 12, fontWeight: '700' }}>{meta.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {form.actionType !== 'NONE' && (
                      <View style={{ gap: 6, marginTop: 4 }}>
                        <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                          {form.actionType === 'PLAY_CHANNEL' ? 'ID DEL CANAL' : form.actionType === 'NAVIGATE_CATEGORY' ? 'ID DE CATEGORÍA' : form.actionType === 'SHOW_PLAN' ? 'ID DEL PLAN' : 'URL DESTINO'}
                        </Text>
                        <TextInput
                          style={formInputStyle}
                          value={form.actionValue ?? ''}
                          onChangeText={(v) => updateField('actionValue', v || null)}
                          placeholder={form.actionType === 'OPEN_URL' ? 'https://...' : 'Ingresa el ID'}
                          placeholderTextColor={theme.textMuted}
                          autoCapitalize="none"
                        />
                      </View>
                    )}
                  </View>

                </View>

                {/* Right: live preview */}
                {form.imagen?.trim() && isValidImageSrc(form.imagen.trim()) && (
                  <View style={{ width: 260, gap: 10 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>VISTA PREVIA</Text>
                    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                      <View style={{ aspectRatio: 16 / 9, backgroundColor: '#160035' }}>
                        <Image source={{ uri: resolveImg(form.imagen.trim()) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', marginBottom: 2 }} numberOfLines={2}>
                            {form.titulo || 'Título del banner'}
                          </Text>
                          {form.subtitulo && (
                            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, lineHeight: 15 }} numberOfLines={2}>
                              {form.subtitulo}
                            </Text>
                          )}
                          {form.actionType !== 'NONE' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#FFB800', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                              <FontAwesome name={ACTION_META[form.actionType].icon as any} size={9} color="#1A1A2E" />
                              <Text style={{ color: '#1A1A2E', fontSize: 9, fontWeight: '800' }}>{ACTION_META[form.actionType].label}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>
                      Así se verá en el carrusel del home
                    </Text>
                  </View>
                )}
              </View>

              {formError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, backgroundColor: theme.dangerSoft, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)' }}>
                  <FontAwesome name="exclamation-circle" size={14} color={theme.danger} />
                  <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700', flex: 1 }}>{formError}</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal footer */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={closeModal} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }}>
                <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={busy} style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: busy ? 0.7 : 1 }}>
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome name="check" size={12} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                  {editingSlider ? 'Guardar cambios' : 'Crear banner'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Eliminar este banner?"
        message={`"${deleteTarget?.titulo}" se eliminará permanentemente y dejará de aparecer en la app.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        busy={deleteBusy}
      />

    </CmsShell>
  );
}
