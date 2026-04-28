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
import { StatCard } from '../../components/cms/CmsComponents';
import { useTheme } from '../../hooks/useTheme';

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const ACTION_META: Record<SliderActionType, { label: string; icon: string; color: string }> = {
  NONE:              { label: 'Sin acción',  icon: 'ban',           color: '#6B7280' },
  PLAY_CHANNEL:      { label: 'Ver canal',   icon: 'play-circle',   color: '#10B981' },
  NAVIGATE_CATEGORY: { label: 'Categoría',   icon: 'th-large',      color: '#6366F1' },
  SHOW_PLAN:         { label: 'Ver plan',    icon: 'star',          color: '#F59E0B' },
  OPEN_URL:          { label: 'Abrir URL',   icon: 'external-link', color: '#3B82F6' },
};

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

function sanitize(s: AdminSlider): AdminSlider {
  return {
    ...s,
    titulo:    s.titulo?.trim()    || 'Sin título',
    subtitulo: s.subtitulo?.trim() || null,
    imagen:    s.imagen?.trim()    || '',
  };
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'ahora';
  if (mins < 60)  return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Toggle switch
function Switch({ value, onToggle, disabled }: { value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      style={{
        width: 36, height: 20, borderRadius: 10,
        backgroundColor: value ? '#22C55E' : 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        paddingHorizontal: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{
        width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff',
        alignSelf: value ? 'flex-end' : 'flex-start',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2,
      }} />
    </TouchableOpacity>
  );
}

// Status badge
function StatusBadge({ activo }: { activo: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: activo ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1,
      borderColor: activo ? 'rgba(34,197,94,0.30)' : 'rgba(107,114,128,0.25)',
    }}>
      <View style={{
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: activo ? '#22C55E' : '#6B7280',
        ...(activo ? { shadowColor: '#22C55E', shadowOpacity: 0.9, shadowRadius: 3 } : {}),
      }} />
      <Text style={{
        color: activo ? '#22C55E' : '#9CA3AF',
        fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
      }}>
        {activo ? 'LIVE' : 'DRAFT'}
      </Text>
    </View>
  );
}

// Context menu (···)
function ContextMenu({
  visible, onClose, items, theme,
}: {
  visible: boolean;
  onClose: () => void;
  items: { label: string; icon: string; color: string; onPress: () => void; danger?: boolean }[];
  theme: any;
}) {
  if (!visible) return null;
  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        onPress={onClose}
        style={{ position: 'fixed' as any, inset: 0, zIndex: 998 }}
      />
      <View style={{
        position: 'absolute', right: 48, top: 0, zIndex: 999,
        backgroundColor: theme.cardBg,
        borderRadius: 12, borderWidth: 1, borderColor: theme.border,
        minWidth: 160,
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
        overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => { item.onPress(); onClose(); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingHorizontal: 14, paddingVertical: 11,
              borderBottomWidth: i < items.length - 1 ? 1 : 0,
              borderBottomColor: theme.border,
            }}
          >
            <FontAwesome name={item.icon as any} size={12} color={item.color} />
            <Text style={{ color: item.color, fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

// Confirm delete dialog
function ConfirmDialog({
  visible, bannerName, onConfirm, onCancel, busy, theme,
}: {
  visible: boolean; bannerName: string;
  onConfirm: () => void; onCancel: () => void;
  busy: boolean; theme: any;
}) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{
          width: '100%', maxWidth: 400,
          backgroundColor: theme.cardBg, borderRadius: 18,
          borderWidth: 1, borderColor: theme.border, padding: 28, gap: 14,
        }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome name="trash" size={20} color={theme.danger} />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>¿Eliminar banner?</Text>
            <Text style={{ color: theme.textSec, fontSize: 13, lineHeight: 20 }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>"{bannerName}"</Text>
              {' '}se eliminará permanentemente y dejará de aparecer en la app.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
            >
              <Text style={{ color: theme.textSec, fontWeight: '700', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={busy}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: theme.danger, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
            >
              {busy
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Eliminar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Image upload zone
function ImageUploadZone({
  value, onChange, loading, onPick, theme,
}: {
  value: string; onChange: (v: string) => void;
  loading: boolean; onPick: () => void; theme: any;
}) {
  const hasImage = value.trim() && isValidImageSrc(value.trim());
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <View style={{ gap: 10 }}>
      <TouchableOpacity
        onPress={onPick}
        disabled={loading}
        activeOpacity={0.85}
        style={{
          borderRadius: 12, overflow: 'hidden',
          borderWidth: hasImage ? 0 : 2,
          borderColor: theme.border,
          borderStyle: 'dashed' as any,
          backgroundColor: hasImage ? 'transparent' : theme.liftBg,
          aspectRatio: 16 / 7,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <>
            <Image source={{ uri: resolveImg(value.trim()) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <FontAwesome name="camera" size={13} color="#fff" />
                }
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                  {loading ? 'Subiendo...' : 'Cambiar imagen'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', gap: 10, padding: 20 }}>
            {loading
              ? <ActivityIndicator size="large" color={theme.accent} />
              : <>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="cloud-upload" size={24} color={theme.accent} />
                  </View>
                  <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                    {Platform.OS === 'web' ? 'Haz clic para subir' : 'Seleccionar imagen'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>
                    PNG, JPG, WEBP · Recomendado 1200×628px
                  </Text>
                </>
            }
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>o pega una URL</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      </View>

      <TextInput
        style={{
          backgroundColor: theme.liftBg, borderRadius: 10, borderWidth: 1,
          borderColor: theme.border, color: theme.text,
          paddingHorizontal: 12, paddingVertical: 10, fontSize: 12,
          ...webInput,
        }}
        value={value}
        onChangeText={onChange}
        placeholder="https://cdn.ejemplo.com/banner.jpg"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

// Banner row
function BannerRow({
  slider, index, total, theme,
  isDragging, isDropTarget,
  onEdit, onDuplicate, onToggle, onDelete,
  webDragProps, busy,
}: {
  slider: AdminSlider; index: number; total: number; theme: any;
  isDragging: boolean; isDropTarget: boolean;
  onEdit: () => void; onDuplicate: () => void;
  onToggle: () => void; onDelete: () => void;
  webDragProps: object; busy: boolean;
}) {
  const [hovered, setHovered]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasImage = slider.imagen && isValidImageSrc(slider.imagen);

  const rowBg = isDragging
    ? 'rgba(96,38,158,0.45)'
    : hovered
    ? 'rgba(96,38,158,0.18)'
    : theme.cardBg;

  const rowBorder = isDragging
    ? theme.accentBorder
    : isDropTarget
    ? theme.accent
    : hovered
    ? 'rgba(255,184,0,0.20)'
    : theme.border;

  return (
    <View
      {...(webDragProps as any)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
      style={{
        flexDirection: 'row', alignItems: 'stretch',
        backgroundColor: rowBg,
        borderRadius: 14, overflow: 'visible',
        borderWidth: 1, borderColor: rowBorder,
        opacity: isDragging ? 0.6 : 1,
        marginBottom: 8,
        position: 'relative',
        // Drop-target indicator
        ...(isDropTarget ? { borderTopWidth: 2, borderTopColor: theme.accent } : {}),
      }}
    >
      {/* Drag handle */}
      <View
        style={{
          width: 40, alignItems: 'center', justifyContent: 'center', gap: 6,
          borderRightWidth: 1, borderRightColor: theme.border,
          cursor: 'grab' as any,
          opacity: hovered ? 1 : 0.35,
        }}
      >
        <FontAwesome name="bars" size={13} color={theme.textMuted} />
        <View style={{
          backgroundColor: theme.accentSoft, borderRadius: 6,
          paddingHorizontal: 5, paddingVertical: 2,
        }}>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '800' }}>
            {index + 1}/{total}
          </Text>
        </View>
      </View>

      {/* Thumbnail */}
      <View style={{ width: 140, aspectRatio: 16 / 9, backgroundColor: '#160035', flexShrink: 0 }}>
        {hasImage ? (
          <Image
            source={{ uri: resolveImg(slider.imagen) }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <FontAwesome name="image" size={22} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>Sin imagen</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, paddingHorizontal: 18, paddingVertical: 14, justifyContent: 'center', gap: 4, minWidth: 0 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }} numberOfLines={1}>
          {slider.titulo}
        </Text>
        {slider.subtitulo && (
          <Text style={{ color: theme.textSec, fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
            {slider.subtitulo}
          </Text>
        )}
        {slider.actionType !== 'NONE' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: `${ACTION_META[slider.actionType].color}15`,
              borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: `${ACTION_META[slider.actionType].color}28`,
            }}>
              <FontAwesome
                name={ACTION_META[slider.actionType].icon as any}
                size={9} color={ACTION_META[slider.actionType].color}
              />
              <Text style={{ color: ACTION_META[slider.actionType].color, fontSize: 10, fontWeight: '700' }}>
                {ACTION_META[slider.actionType].label}
                {slider.actionValue ? ` · ${slider.actionValue.slice(0, 16)}` : ''}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Status */}
      <View style={{
        paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 8,
        borderLeftWidth: 1, borderLeftColor: theme.border, minWidth: 110,
      }}>
        <StatusBadge activo={slider.activo} />
        <Switch value={slider.activo} onToggle={onToggle} disabled={busy} />
      </View>

      {/* Timestamp */}
      <View style={{
        paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
        borderLeftWidth: 1, borderLeftColor: theme.border, minWidth: 72,
      }}>
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>
          {relativeTime((slider as any).updatedAt)}
        </Text>
      </View>

      {/* Actions */}
      <View style={{
        paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
        borderLeftWidth: 1, borderLeftColor: theme.border,
        position: 'relative',
      }}>
        {/* Edit button — text label */}
        <TouchableOpacity
          onPress={onEdit}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 12, paddingVertical: 8,
            borderRadius: 8, borderWidth: 1, borderColor: theme.border,
            backgroundColor: hovered ? theme.liftBg : 'transparent',
          }}
        >
          <FontAwesome name="pencil" size={11} color={theme.textSec} />
          <Text style={{ color: theme.textSec, fontSize: 12, fontWeight: '700' }}>Editar</Text>
        </TouchableOpacity>

        {/* ··· menu */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setMenuOpen((v) => !v)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: theme.border,
              backgroundColor: menuOpen ? theme.liftBg : 'transparent',
            }}
          >
            <FontAwesome name="ellipsis-v" size={13} color={theme.textMuted} />
          </TouchableOpacity>

          <ContextMenu
            visible={menuOpen}
            onClose={() => setMenuOpen(false)}
            theme={theme}
            items={[
              {
                label: 'Duplicar',
                icon: 'copy',
                color: theme.info,
                onPress: onDuplicate,
              },
              {
                label: slider.activo ? 'Desactivar' : 'Publicar',
                icon: slider.activo ? 'eye-slash' : 'eye',
                color: slider.activo ? theme.warning : theme.success,
                onPress: onToggle,
              },
              {
                label: 'Eliminar',
                icon: 'trash',
                color: theme.danger,
                onPress: onDelete,
                danger: true,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CmsSliders() {
  const { theme } = useTheme();
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();

  const [sliders, setSliders]             = useState<AdminSlider[]>([]);
  const [loading, setLoading]             = useState(true);
  const [busy, setBusy]                   = useState(false);
  const [feedback, setFeedback]           = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editingSlider, setEditingSlider] = useState<AdminSlider | null>(null);
  const [modalVisible, setModalVisible]   = useState(false);
  const [form, setForm]                   = useState<AdminSliderPayload>(emptyForm());
  const [formError, setFormError]         = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [draggingId, setDraggingId]       = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<AdminSlider | null>(null);
  const [deleteBusy, setDeleteBusy]       = useState(false);
  const feedbackTimer                     = useRef<ReturnType<typeof setTimeout>>();
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

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg });
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

  // ── Modal ──

  function openCreate() {
    setEditingSlider(null); setForm(emptyForm()); setFormError(''); setModalVisible(true);
  }

  function openEdit(slider: AdminSlider) {
    setEditingSlider(slider);
    setForm({
      titulo: slider.titulo, subtitulo: slider.subtitulo,
      imagen: slider.imagen, imagenMobile: slider.imagenMobile,
      activo: slider.activo, actionType: slider.actionType,
      actionValue: slider.actionValue, startDate: slider.startDate,
      endDate: slider.endDate, planIds: slider.planIds,
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
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/admin/sliders/upload-imagen`, {
          method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: fd,
        });
        if (res.ok) {
          const { url } = (await res.json()) as { url: string };
          updateField('imagen', url);
        } else {
          setFormError('Error al subir la imagen. Intenta de nuevo.');
        }
      } catch { setFormError('Error al subir la imagen. Intenta de nuevo.'); }
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
        subtitulo: form.subtitulo?.trim() || null,
        imagen: form.imagen.trim(),
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
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar. Intenta de nuevo.');
    } finally { setBusy(false); }
  }

  async function handleDuplicate(slider: AdminSlider) {
    if (!accessToken) return;
    setBusy(true);
    try {
      await adminCreateSlider(accessToken, {
        titulo: `${slider.titulo} (copia)`,
        subtitulo: slider.subtitulo, imagen: slider.imagen,
        imagenMobile: slider.imagenMobile, activo: false,
        actionType: slider.actionType, actionValue: slider.actionValue,
        startDate: null, endDate: null, planIds: slider.planIds,
      });
      await refresh();
      showFeedback('success', 'Banner duplicado como borrador.');
    } catch { showFeedback('error', 'No se pudo duplicar.'); }
    finally { setBusy(false); }
  }

  async function handleToggle(slider: AdminSlider) {
    if (!accessToken) return;
    setBusy(true);
    try {
      await adminToggleSlider(accessToken, slider.id);
      await refresh();
      showFeedback('success', `Banner ${slider.activo ? 'desactivado' : 'publicado'}.`);
    } catch { showFeedback('error', 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget || !accessToken) return;
    setDeleteBusy(true);
    try {
      await adminDeleteSlider(accessToken, deleteTarget.id);
      await refresh();
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

  const inputStyle = {
    backgroundColor: theme.liftBg, borderRadius: 10,
    borderWidth: 1, borderColor: theme.border,
    color: theme.text, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 13, ...webInput,
  };

  // ── Render ──

  return (
    <CmsShell breadcrumbs={[{ label: 'Banners' }]}>

      {/* Toast */}
      {feedback && (
        <View style={{
          position: 'absolute', top: 20, right: 20, zIndex: 9999,
          maxWidth: 360,
          backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.12)' : theme.dangerSoft,
          borderWidth: 1,
          borderColor: feedback.type === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(209,16,90,0.35)',
          borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
        }}>
          <FontAwesome
            name={feedback.type === 'success' ? 'check-circle' : 'times-circle'}
            size={16}
            color={feedback.type === 'success' ? '#22C55E' : theme.danger}
          />
          <Text style={{
            color: feedback.type === 'success' ? '#22C55E' : theme.danger,
            fontSize: 13, fontWeight: '700', flex: 1,
          }}>
            {feedback.msg}
          </Text>
          <TouchableOpacity onPress={() => setFeedback(null)}>
            <FontAwesome name="times" size={12} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 48 }}>

        {/* ── Page Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
              Banners
            </Text>
            <Text style={{ color: theme.textSec, fontSize: 13, lineHeight: 20 }}>
              Gestiona los banners del carrusel principal de la app
            </Text>
          </View>
          <TouchableOpacity
            onPress={openCreate}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: theme.accent, borderRadius: 10,
              paddingHorizontal: 18, paddingVertical: 11,
              shadowColor: theme.accent, shadowOpacity: 0.35, shadowRadius: 10,
            }}
          >
            <FontAwesome name="plus" size={12} color="#1A0040" />
            <Text style={{ color: '#1A0040', fontWeight: '900', fontSize: 14 }}>Nuevo banner</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Bar ── */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard label="Total"      value={stats.total}   icon="image"      color={theme.tag}     />
          <StatCard label="Publicados" value={stats.activos} icon="eye"        color={theme.success} />
          <StatCard label="Borradores" value={stats.draft}   icon="pencil"     color={theme.warning} />
        </View>

        {/* ── Banner List ── */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 80, gap: 14 }}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textSec, fontSize: 13 }}>Cargando banners...</Text>
          </View>
        ) : sliders.length === 0 ? (
          /* Empty state */
          <View style={{
            alignItems: 'center', paddingVertical: 80, gap: 16,
            backgroundColor: theme.cardBg, borderRadius: 18,
            borderWidth: 1, borderColor: theme.border,
            borderStyle: 'dashed' as any,
          }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: theme.accentSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <FontAwesome name="image" size={36} color={theme.accent} />
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800' }}>
                Sin banners aún
              </Text>
              <Text style={{ color: theme.textSec, fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 20 }}>
                Crea tu primer banner para que aparezca en el carrusel del home de la app.
              </Text>
            </View>
            <TouchableOpacity
              onPress={openCreate}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: theme.accent, borderRadius: 10,
                paddingHorizontal: 22, paddingVertical: 12, marginTop: 4,
              }}
            >
              <FontAwesome name="plus" size={12} color="#1A0040" />
              <Text style={{ color: '#1A0040', fontWeight: '900', fontSize: 14 }}>Crear primer banner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Column headers */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 0, paddingBottom: 10, marginBottom: 4,
            }}>
              <View style={{ width: 40 }} />
              <View style={{ width: 140 }} />
              <Text style={{ flex: 1, paddingLeft: 18, color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                BANNER
              </Text>
              <Text style={{ width: 110, textAlign: 'center', color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                ESTADO
              </Text>
              <Text style={{ width: 72, textAlign: 'center', color: theme.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                EDITADO
              </Text>
              <View style={{ width: 120 }} />
            </View>

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
                <BannerRow
                  key={slider.id}
                  slider={slider} index={index} total={sliders.length} theme={theme}
                  isDragging={isDragging} isDropTarget={isDropTarget}
                  busy={busy}
                  onEdit={()       => openEdit(slider)}
                  onDuplicate={()  => handleDuplicate(slider)}
                  onToggle={()     => handleToggle(slider)}
                  onDelete={()     => setDeleteTarget(slider)}
                  webDragProps={webDragProps}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Edit / Create Modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'center', alignItems: 'center', padding: 16,
        }}>
          <View style={{
            width: '100%', maxWidth: 820,
            backgroundColor: theme.cardBg, borderRadius: 22,
            borderWidth: 1, borderColor: theme.border,
            overflow: 'hidden', maxHeight: '92%',
          }}>

            {/* Modal header */}
            <View style={{
              paddingHorizontal: 24, paddingVertical: 18,
              borderBottomWidth: 1, borderBottomColor: theme.border,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: theme.accentSoft,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <FontAwesome name={editingSlider ? 'pencil' : 'plus'} size={15} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>
                    {editingSlider ? 'Editar banner' : 'Nuevo banner'}
                  </Text>
                  <Text style={{ color: theme.textSec, fontSize: 12, marginTop: 1 }}>
                    {editingSlider ? `Modificando: ${editingSlider.titulo}` : 'Aparecerá en el carrusel del home'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FontAwesome name="times" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', gap: 28, flexWrap: 'wrap' }}>

                {/* ── Left: Form ── */}
                <View style={{ flex: 1, minWidth: 280, gap: 18 }}>

                  {/* Título */}
                  <View style={{ gap: 7 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>TÍTULO *</Text>
                    <TextInput
                      style={inputStyle}
                      value={form.titulo}
                      onChangeText={(v) => updateField('titulo', v)}
                      placeholder="Ej: Estrenos de abril"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  {/* Subtítulo */}
                  <View style={{ gap: 7 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>SUBTÍTULO</Text>
                    <TextInput
                      style={[inputStyle, { minHeight: 66 }]}
                      value={form.subtitulo ?? ''}
                      onChangeText={(v) => updateField('subtitulo', v || null)}
                      placeholder="Descripción breve del banner"
                      placeholderTextColor={theme.textMuted}
                      multiline
                    />
                  </View>

                  {/* Imagen */}
                  <View style={{ gap: 7 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>IMAGEN DEL BANNER *</Text>
                    <ImageUploadZone
                      value={form.imagen}
                      onChange={(v) => updateField('imagen', v)}
                      loading={uploadingImage}
                      onPick={handlePickImage}
                      theme={theme}
                    />
                  </View>

                  {/* Estado */}
                  <View style={{ gap: 7 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>ESTADO</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[
                        { value: true,  label: 'Publicado', icon: 'eye',    color: '#22C55E',     soft: 'rgba(34,197,94,0.10)' },
                        { value: false, label: 'Borrador',  icon: 'pencil', color: theme.warning, soft: theme.warningSoft },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={String(opt.value)}
                          onPress={() => updateField('activo', opt.value)}
                          style={{
                            flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
                            paddingHorizontal: 14, paddingVertical: 11,
                            borderRadius: 10, borderWidth: 2,
                            borderColor: form.activo === opt.value ? opt.color : theme.border,
                            backgroundColor: form.activo === opt.value ? opt.soft : theme.liftBg,
                          }}
                        >
                          <FontAwesome name={opt.icon as any} size={13} color={form.activo === opt.value ? opt.color : theme.textMuted} />
                          <Text style={{ color: form.activo === opt.value ? opt.color : theme.textSec, fontWeight: '700', fontSize: 13 }}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Acción */}
                  <View style={{ gap: 7 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>ACCIÓN AL TOCAR</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(Object.entries(ACTION_META) as [SliderActionType, typeof ACTION_META[SliderActionType]][]).map(([key, meta]) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => updateField('actionType', key)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 20, borderWidth: 1.5,
                            borderColor: form.actionType === key ? meta.color : theme.border,
                            backgroundColor: form.actionType === key ? `${meta.color}18` : theme.liftBg,
                          }}
                        >
                          <FontAwesome name={meta.icon as any} size={10} color={form.actionType === key ? meta.color : theme.textMuted} />
                          <Text style={{ color: form.actionType === key ? meta.color : theme.textSec, fontSize: 12, fontWeight: '700' }}>
                            {meta.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {form.actionType !== 'NONE' && (
                      <View style={{ gap: 7, marginTop: 6 }}>
                        <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>
                          {form.actionType === 'PLAY_CHANNEL'      ? 'ID DEL CANAL'
                          : form.actionType === 'NAVIGATE_CATEGORY' ? 'ID DE CATEGORÍA'
                          : form.actionType === 'SHOW_PLAN'         ? 'ID DEL PLAN'
                          :                                           'URL DESTINO'}
                        </Text>
                        <TextInput
                          style={inputStyle}
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

                {/* ── Right: Live preview ── */}
                {form.imagen?.trim() && isValidImageSrc(form.imagen.trim()) && (
                  <View style={{ width: 270, gap: 10 }}>
                    <Text style={{ color: theme.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 }}>VISTA PREVIA</Text>
                    <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                      <View style={{ aspectRatio: 16 / 9, backgroundColor: '#160035' }}>
                        <Image
                          source={{ uri: resolveImg(form.imagen.trim()) }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 3 }} numberOfLines={2}>
                            {form.titulo || 'Título del banner'}
                          </Text>
                          {form.subtitulo && (
                            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                              {form.subtitulo}
                            </Text>
                          )}
                          {form.actionType !== 'NONE' && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
                              backgroundColor: '#FFB800', borderRadius: 20,
                              paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start',
                            }}>
                              <FontAwesome name={ACTION_META[form.actionType].icon as any} size={9} color="#1A0040" />
                              <Text style={{ color: '#1A0040', fontSize: 10, fontWeight: '900' }}>
                                {ACTION_META[form.actionType].label}
                              </Text>
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

              {/* Form error */}
              {formError ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18,
                  padding: 12, backgroundColor: theme.dangerSoft, borderRadius: 10,
                  borderWidth: 1, borderColor: 'rgba(209,16,90,0.30)',
                }}>
                  <FontAwesome name="exclamation-circle" size={14} color={theme.danger} />
                  <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700', flex: 1 }}>{formError}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal footer */}
            <View style={{
              paddingHorizontal: 24, paddingVertical: 16,
              borderTopWidth: 1, borderTopColor: theme.border,
              flexDirection: 'row', justifyContent: 'flex-end', gap: 10,
            }}>
              <TouchableOpacity
                onPress={closeModal}
                style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.liftBg }}
              >
                <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={busy}
                style={{
                  paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10,
                  backgroundColor: theme.accent, flexDirection: 'row', alignItems: 'center', gap: 8,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy
                  ? <ActivityIndicator size="small" color="#1A0040" />
                  : <FontAwesome name="check" size={12} color="#1A0040" />
                }
                <Text style={{ color: '#1A0040', fontSize: 13, fontWeight: '900' }}>
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
        bannerName={deleteTarget?.titulo ?? ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        busy={deleteBusy}
        theme={theme}
      />

    </CmsShell>
  );
}
