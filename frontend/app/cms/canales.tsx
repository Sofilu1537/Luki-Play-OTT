import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Platform, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { useCategoriasStore } from '../../services/categoriasStore';
import type { AdminCanal, AdminCanalPayload } from '../../services/api/adminApi';
import { resolveLogoUrl } from '../../services/api/config';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { StatCard } from '../../components/cms/CmsComponents';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ────────────────────────────────────────────────────
type ChannelStatus = AdminCanal['status'];
type HealthStatus = AdminCanal['healthStatus'];
type StreamProto = AdminCanal['streamProtocol'];
type Resolution = AdminCanal['resolution'];
type ViewMode = 'table' | 'grid';
type ActiveTab = 'general' | 'stream' | 'access';

// ─── Status Config ────────────────────────────────────────────
const STATUS_CONFIG: Record<ChannelStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Activo', color: '#17D1C6', bg: 'rgba(23,209,198,0.12)' },
  SCHEDULED: { label: 'Programado', color: '#FF7900', bg: 'rgba(255,121,0,0.12)' },
  MAINTENANCE: { label: 'Mantenimiento', color: '#FF7900', bg: 'rgba(255,121,0,0.12)' },
  INACTIVE: { label: 'Inactivo', color: '#D1105A', bg: 'rgba(209,16,90,0.14)' },
};

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; icon: string }> = {
  HEALTHY: { label: 'Saludable', color: '#17D1C6', icon: 'check-circle' },
  DEGRADED: { label: 'Degradado', color: '#FF7900', icon: 'exclamation-circle' },
  OFFLINE: { label: 'Offline', color: '#888', icon: 'times-circle' },
  MAINTENANCE: { label: 'Mant.', color: '#1E96FC', icon: 'cog' },
};

const RESOLUTIONS: Resolution[] = ['480p', '720p', '1080p', '4K'];
const PROTOCOLS: StreamProto[] = ['HLS', 'DASH', 'HLS_DASH'];

// ─── Helpers ──────────────────────────────────────────────────
function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isValidUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function emptyForm(): AdminCanalPayload {
  return {
    nombre: '', slug: '', streamUrl: '', backupUrl: '', logoUrl: '',
    categoryId: '', epgSourceId: '',
    status: 'ACTIVE', streamProtocol: 'HLS', resolution: '1080p',
    bitrateKbps: 5000, isDrmProtected: false,
    geoRestriction: '', sortOrder: 99, planIds: [],
    requiereControlParental: false,
  };
}

// ─── StatusBadge Component ────────────────────────────────────
function StatusBadge({ status, isLive }: { status: ChannelStatus; isLive: boolean }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
      {isLive && status === 'ACTIVE' && (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color }} />
      )}
      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
        {isLive && status === 'ACTIVE' ? 'EN VIVO' : cfg.label.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── HealthBadge Component ────────────────────────────────────
function HealthBadge({ health }: { health: HealthStatus }) {
  const cfg = HEALTH_CONFIG[health];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <FontAwesome name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={{ color: cfg.color, fontSize: 11, fontWeight: '600' }}>{cfg.label}</Text>
    </View>
  );
}

// ─── FormField Component ──────────────────────────────────────
function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  const { isDark, theme } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: isDark ? 'rgba(250,246,231,0.4)' : '#240046', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: '#D1105A' }}>*</Text>}
      </Text>
      {children}
      {hint && <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>{hint}</Text>}
    </View>
  );
}

// ─── Channel Detail Modal ─────────────────────────────────────
function ChannelDetailModal({ channel, onClose, onEdit, categories }: {
  channel: AdminCanal;
  onClose: () => void;
  onEdit: (ch: AdminCanal) => void;
  categories: { id: string; nombre: string }[];
}) {
  const { isDark, theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  const catName = channel.category?.nombre ?? categories.find((c) => c.id === channel.categoryId)?.nombre ?? '—';

  function copyUrl() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(channel.streamUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const infoRows = [
    { label: 'Protocolo', value: channel.streamProtocol },
    { label: 'Resolución', value: channel.resolution },
    { label: 'Bitrate', value: `${channel.bitrateKbps.toLocaleString()} kbps` },
    { label: 'DRM', value: channel.isDrmProtected ? 'Widevine/FairPlay' : 'Sin DRM' },
    { label: 'Categoría', value: catName },
    { label: 'Geo', value: channel.geoRestriction || 'Sin restricción' },
    { label: 'Uptime', value: `${channel.uptimePercent}%` },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(5,5,12,0.8)' }} onPress={onClose}>
        <Pressable
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, maxWidth: '95%', backgroundColor: theme.cardBg, borderLeftWidth: 1, borderLeftColor: theme.border }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView>
            {/* Header */}
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="television" size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700' }}>{channel.nombre}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>/{channel.slug}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={() => { onClose(); onEdit(channel); }}>
                  <FontAwesome name="pencil" size={13} color={theme.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
                  <FontAwesome name="times" size={13} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview 16:9 */}
            <View style={{ margin: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={36} color="rgba(255,255,255,0.1)" />
              {channel.isLive && (<Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 }}>Preview requiere HLS.js</Text>)}
              <View style={{ position: 'absolute', top: 10, left: 10 }}>
                <StatusBadge status={channel.status} isLive={channel.isLive} />
              </View>
              {channel.isLive && (
                <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <FontAwesome name="eye" size={10} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{channel.viewerCount.toLocaleString()}</Text>
                </View>
              )}
            </View>

            {/* Stream URL */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Stream URL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ flex: 1, color: theme.textSec, fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} numberOfLines={2}>
                  {channel.streamUrl}
                </Text>
                <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: copied ? 'rgba(23,209,198,0.15)' : 'transparent' }} onPress={copyUrl}>
                  <FontAwesome name={copied ? 'check' : 'copy'} size={12} color={copied ? '#17D1C6' : theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info grid */}
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {infoRows.map((row) => (
                <View key={row.label} style={{ width: '47%', padding: 12, borderRadius: 10, backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{row.label}</Text>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{row.value}</Text>
                </View>
              ))}
              <View style={{ width: '47%', padding: 12, borderRadius: 10, backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Salud</Text>
                <HealthBadge health={channel.healthStatus} />
              </View>
            </View>

            {/* Plans */}
            {channel.planIds.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Planes con acceso</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {channel.planIds.map((pid) => (
                    <View key={pid} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: theme.accentSoft, borderWidth: 1, borderColor: theme.accentBorder }}>
                      <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '600' }}>{pid}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timestamps */}
            <View style={{ marginHorizontal: 20, marginBottom: 24, padding: 14, borderRadius: 10, backgroundColor: theme.liftBg, borderWidth: 1, borderColor: theme.border }}>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 4 }}>
                Creado: <Text style={{ color: theme.textSec }}>{new Date(channel.createdAt).toLocaleDateString('es-EC')}</Text>
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                Actualizado: <Text style={{ color: theme.textSec }}>{new Date(channel.updatedAt).toLocaleDateString('es-EC')}</Text>
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Create/Edit Modal ────────────────────────────────────────
function ChannelFormModal({ channel, onSave, onClose, categories, accessToken }: {
  channel: AdminCanal | null;
  onSave: (form: AdminCanalPayload) => void;
  onClose: () => void;
  categories: { id: string; nombre: string; esContenidoAdulto?: boolean }[];
  accessToken: string;
}) {
  const isEdit = !!channel;
  const { isDark, theme } = useTheme();
  const [form, setForm] = useState<AdminCanalPayload>(() =>
    channel ? {
      nombre: channel.nombre, slug: channel.slug, streamUrl: channel.streamUrl, backupUrl: channel.backupUrl ?? '', logoUrl: channel.logoUrl ?? '',
      categoryId: channel.categoryId, epgSourceId: channel.epgSourceId ?? '', status: channel.status, streamProtocol: channel.streamProtocol,
      resolution: channel.resolution, bitrateKbps: channel.bitrateKbps, isDrmProtected: channel.isDrmProtected,
      geoRestriction: channel.geoRestriction ?? '', sortOrder: channel.sortOrder, planIds: channel.planIds, requiereControlParental: channel.requiereControlParental,
    } : emptyForm()
  );
  const [formError, setFormError] = useState('');
  const [urlStatus, setUrlStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [logoUploading, setLogoUploading] = useState(false);
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-validate stream URL with debounce — transparent to user
  useEffect(() => {
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    if (!form.streamUrl) { setUrlStatus('idle'); return; }
    if (!isValidUrl(form.streamUrl)) { setUrlStatus('fail'); upd('status', 'INACTIVE'); return; }
    setUrlStatus('checking');
    urlDebounceRef.current = setTimeout(() => {
      fetch(form.streamUrl, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(5000) })
        .then(() => { setUrlStatus('ok'); upd('status', 'ACTIVE'); })
        .catch(() => { setUrlStatus('fail'); upd('status', 'INACTIVE'); });
    }, 1200);
    return () => { if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current); };
  }, [form.streamUrl]);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = {
    backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.9)',
    borderRadius: 8, borderWidth: 1,
    borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)',
    color: isDark ? theme.text : '#240046',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, ...webInput,
  };

  function upd<K extends keyof AdminCanalPayload>(key: K, val: AdminCanalPayload[K]) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'nombre' && !isEdit) next.slug = autoSlug(val as string);
      return next;
    });
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId);


  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    import('../../services/api/adminApi').then(({ adminUploadChannelLogo }) =>
      adminUploadChannelLogo(accessToken, file)
    ).then((url) => {
      upd('logoUrl', url);
      setLogoUploading(false);
    }).catch(() => {
      setLogoUploading(false);
      setFormError('Error al subir el logo. Intenta de nuevo.');
    });
  }

  function validate(): boolean {
    if (!form.nombre.trim()) { setFormError('El nombre es requerido.'); return false; }
    if (!form.streamUrl.trim() || !isValidUrl(form.streamUrl)) { setFormError('URL del stream inválida (requiere http/https).'); return false; }
    if (!form.categoryId) { setFormError('Debes seleccionar una categoría.'); return false; }
    setFormError('');
    return true;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,5,12,0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 520, maxHeight: '92%', backgroundColor: theme.cardBg, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#18003a' : '#240046' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{isEdit ? 'Editar canal' : 'Nuevo canal'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 }}>
                {isEdit ? `Editando: ${channel!.nombre}` : 'Configura los datos del canal OTT.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="times" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>

            {/* Nombre */}
            <FormField label="Nombre del canal" required>
              <TextInput
                style={inputStyle}
                value={form.nombre}
                onChangeText={(v) => upd('nombre', v)}
                placeholder="ESPN Ecuador"
                placeholderTextColor={theme.textMuted}
              />
            </FormField>

            {/* Logo */}
            <FormField label="Logo del canal" hint="PNG o JPG, máx. 2 MB">
              <View style={{ gap: 10 }}>
                {form.logoUrl ? (
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore – web-only img element
                  <img src={resolveLogoUrl(form.logoUrl)} alt="Logo preview" style={{ height: 64, objectFit: 'contain', borderRadius: 8, background: '#1A1A2E', padding: 6 }} />
                ) : null}
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  {Platform.OS === 'web' ? (
                    <View>
                      {/* @ts-ignore */}
                      <input
                        type="file"
                        accept="image/*"
                        id="logo-upload"
                        style={{ display: 'none' }}
                        onChange={handleLogoFileChange}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (typeof document !== 'undefined') {
                            (document.getElementById('logo-upload') as HTMLInputElement | null)?.click();
                          }
                        }}
                        style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      >
                        {logoUploading
                          ? <FontAwesome name="spinner" size={12} color={theme.accent} />
                          : <FontAwesome name="upload" size={12} color={theme.accent} />}
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>
                          {logoUploading ? 'Subiendo...' : 'Seleccionar imagen'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {form.logoUrl ? (
                    <TouchableOpacity onPress={() => upd('logoUrl', '')} style={{ paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>Quitar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </FormField>

            {/* Stream URL + Validate */}
            <FormField label="URL del stream" required hint="HLS (.m3u8) o DASH (.mpd)">
              <View style={{ gap: 8 }}>
                <TextInput
                  style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}
                  value={form.streamUrl}
                onChangeText={(v) => upd('streamUrl', v)}
                  placeholder="https://cdn.example.com/stream/playlist.m3u8"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                />
                {urlStatus === 'checking' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <FontAwesome name="circle-o-notch" size={11} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>Verificando...</Text>
                  </View>
                )}
                {urlStatus === 'ok' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: '#0D3B26' }}>
                      <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '800' }}>ACTIVO</Text>
                    </View>
                    <Text style={{ color: '#4ADE80', fontSize: 11 }}>El stream responde correctamente</Text>
                  </View>
                )}
                {urlStatus === 'fail' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: '#3B0D0D' }}>
                      <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '800' }}>INACTIVO</Text>
                    </View>
                    <Text style={{ color: '#F87171', fontSize: 11 }}>El stream no responde</Text>
                  </View>
                )}
              </View>
            </FormField>

            {/* Categoría */}
            <FormField label="Categoría" required>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
                {categories.map((cat) => {
                  const sel = form.categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        upd('categoryId', cat.id);
                        // If new category is not adult, disable parental control
                        if (!cat.esContenidoAdulto) upd('requiereControlParental', false);
                      }}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: sel ? theme.accent : theme.border, backgroundColor: sel ? theme.accentSoft : theme.liftBg }}
                    >
                      <Text style={{ color: sel ? theme.accent : theme.textSec, fontSize: 12, fontWeight: '700' }}>{cat.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </FormField>

            {/* Control Parental — only when category is adult content */}
            {selectedCategory?.esContenidoAdulto === true && (
              <TouchableOpacity
                onPress={() => upd('requiereControlParental', !form.requiereControlParental)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: form.requiereControlParental ? theme.accentBorder : theme.border, backgroundColor: form.requiereControlParental ? theme.accentSoft : theme.liftBg }}
              >
                <FontAwesome name={form.requiereControlParental ? 'lock' : 'unlock'} size={13} color={form.requiereControlParental ? theme.accent : theme.textSec} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: form.requiereControlParental ? theme.accent : theme.textSec, fontSize: 12, fontWeight: '700' }}>Control parental</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                    Esta categoría contiene contenido adulto. Habilita el control parental para acceder desde Luki Play.
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {formError ? <Text style={{ color: '#D1105A', fontSize: 12, fontWeight: '700' }}>{formError}</Text> : null}
          </ScrollView>

          {/* Footer */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)' }}>
              <Text style={{ color: isDark ? theme.textSec : '#240046', fontSize: 13, fontWeight: '700', fontFamily: 'Montserrat-SemiBold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (validate()) onSave(form); }} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10, backgroundColor: isDark ? theme.accent : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: isDark ? theme.accentBorder : 'rgba(130,130,130,0.34)' }}>
              <Text style={{ color: isDark ? '#1A1A2E' : '#240046', fontSize: 13, fontWeight: '800', fontFamily: 'Montserrat-SemiBold' }}>{isEdit ? 'Guardar cambios' : 'Crear canal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════
export default function CmsCanales() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();

  const {
    channels, isLoading,
    loadChannels, createChannelApi, updateChannelApi, deleteChannelApi, toggleChannelStatusApi,
  } = useChannelStore();
  const categorias = useCategoriasStore((s) => s.categorias);
  const fetchCategorias = useCategoriasStore((s) => s.fetchFromApi);
  const activeCategories = useMemo(() => categorias.filter((c) => c.activo), [categorias]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ChannelStatus>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<AdminCanal | null>(null);
  const [detailChannel, setDetailChannel] = useState<AdminCanal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile]);

  // Fetch channels from the backend on mount (keeps localStorage as startup cache)
  useEffect(() => {
    if (accessToken) {
      loadChannels(accessToken);
      // Load all categories (including inactive) so they're available in the channel form
      if (categorias.length === 0) fetchCategorias(accessToken);
    }
  }, [accessToken]);

  // Derived data
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channels.filter((ch) => {
      if (filterStatus !== 'all' && ch.status !== filterStatus) return false;
      if (filterCategory !== 'all' && ch.categoryId !== filterCategory) return false;
      if (q) return ch.nombre.toLowerCase().includes(q) || ch.slug.includes(q);
      return true;
    });
  }, [channels, search, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total: channels.length,
    live: channels.filter((c) => c.isLive).length,
    viewers: channels.reduce((s, c) => s + c.viewerCount, 0),
    healthy: channels.filter((c) => c.healthStatus === 'HEALTHY').length,
  }), [channels]);

  if (!profile) return null;

  const canDelete = profile.role === 'superadmin' || (profile.permissions ?? []).some((p) => p === 'cms:*' || p === 'cms:content:write');

  // Handlers
  function openCreate() {
    setEditingChannel(null);
    setShowForm(true);
  }

  function openEdit(ch: AdminCanal) {
    setEditingChannel(ch);
    setShowForm(true);
    setDetailChannel(null);
  }

  async function handleSave(formData: AdminCanalPayload) {
    if (!accessToken) return;
    try {
      // A channel with a "ch-local-" ID was never persisted to the DB (stale localStorage)
      const isLocalId = editingChannel?.id?.startsWith('ch-local-');
      if (editingChannel && !isLocalId) {
        await updateChannelApi(accessToken, editingChannel.id, formData);
        setFeedback({ type: 'success', message: 'Canal actualizado.' });
      } else {
        await createChannelApi(accessToken, formData);
        setFeedback({ type: 'success', message: 'Canal creado correctamente.' });
      }
      setShowForm(false);
      setEditingChannel(null);
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error al guardar.' });
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    try {
      await deleteChannelApi(accessToken, id);
      setDeleteConfirm(null);
      setFeedback({ type: 'success', message: 'Canal eliminado.' });
    } catch (err: unknown) {
      setDeleteConfirm(null);
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Error al eliminar.' });
    }
  }

  const { isDark, theme } = useTheme();

  return (
    <CmsShell breadcrumbs={[{ label: 'Canales' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* ── Header Section ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={openCreate}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden',
              borderWidth: isDark ? 0 : 1,
              borderColor: isDark ? 'transparent' : 'rgba(130,130,130,0.18)',
              backgroundColor: isDark ? 'transparent' : '#fff',
            }}
          >
            {isDark ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
                <View style={{ flex: 1, backgroundColor: theme.accent }} />
              </View>
            ) : null}
            <FontAwesome name="plus" size={13} color={isDark ? '#1A1A2E' : '#240046'} />
            <Text style={{ color: isDark ? '#1A1A2E' : '#240046', fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Nuevo canal</Text>
          </TouchableOpacity>
        </View>

        {/* ── Feedback Banner ── */}
        {feedback && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, marginBottom: 16, backgroundColor: feedback.type === 'success' ? 'rgba(23,209,198,0.12)' : 'rgba(209,16,90,0.14)', borderWidth: 1, borderColor: feedback.type === 'success' ? '#17D1C6' : '#D1105A' }}>
            <FontAwesome name={feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'} size={14} color={feedback.type === 'success' ? '#17D1C6' : '#D1105A'} />
            <Text style={{ color: feedback.type === 'success' ? '#17D1C6' : '#D1105A', fontSize: 13, flex: 1 }}>{feedback.message}</Text>
          </View>
        )}

        {/* ── Stat Cards (Skill Pattern) ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="Total canales" value={stats.total} icon="television" color="#B07CC6" />
          <StatCard label="En vivo ahora" value={stats.live} icon="bolt" color="#17D1C6" />
          <StatCard label="Viewers totales" value={stats.viewers.toLocaleString()} icon="eye" color="#1E96FC" />
        </View>

        {/* ── Filters Bar (Single line) ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', marginBottom: 20, zIndex: 50, elevation: 50, shadowColor: '#240046', shadowOpacity: isDark ? 0 : 0.08, shadowRadius: isDark ? 0 : 20, shadowOffset: { width: 0, height: 6 } }}>
          {/* Search */}
          <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.8)', borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.26)', paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
            <FontAwesome name="search" size={13} color={isDark ? theme.textMuted : '#240046'} />
            <TextInput style={{ flex: 1, color: isDark ? theme.text : '#240046', fontSize: 13, ...webInput }} value={search} onChangeText={setSearch} placeholder="Buscar por nombre o slug..." placeholderTextColor={isDark ? theme.textMuted : 'rgba(36,0,70,0.5)'} />
          </View>

          {/* Category Filter Dropdown */}
          {Platform.OS === 'web' && (
            <View style={{ borderRadius: 8, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.26)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.8)', overflow: 'hidden' }}>
              {/* @ts-ignore */}
              <select value={filterCategory} onChange={(e: any) => setFilterCategory(e.target.value)} style={{ padding: '7px 12px', background: isDark ? theme.liftBg : 'rgba(255,255,255,0.8)', border: 'none', color: isDark ? theme.textSec : '#240046', fontSize: 12, fontFamily: 'Montserrat-SemiBold', outline: 'none', cursor: 'pointer', minWidth: 150, colorScheme: isDark ? 'dark' : 'light' } as any}>
                <option value="all">Todas las categorías</option>
                {categorias.map((cat) => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
              </select>
            </View>
          )}

          {/* View Toggle */}
          <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
            {(['table', 'grid'] as ViewMode[]).map((m) => (
              <TouchableOpacity key={m} onPress={() => setViewMode(m)} style={{ width: 34, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: viewMode === m ? theme.accentSoft : 'transparent' }}>
                <FontAwesome name={m === 'table' ? 'list' : 'th-large'} size={13} color={viewMode === m ? theme.accent : theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Empty State ── */}
        {channels.length === 0 ? (
          <View style={{ backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', padding: 48, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={26} color={theme.accent} />
            </View>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>Sin canales registrados</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>Crea tu primer canal con URL HLS/DASH, categoría y configuración OTT.</Text>
            <TouchableOpacity onPress={openCreate} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: isDark ? theme.accent : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: isDark ? theme.accentBorder : 'rgba(130,130,130,0.34)', marginTop: 4 }}>
              <FontAwesome name="plus" size={13} color={isDark ? '#1A1A2E' : '#240046'} />
              <Text style={{ color: isDark ? '#1A1A2E' : '#240046', fontWeight: '800', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Crear primer canal</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)', borderRadius: 12, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', padding: 24, alignItems: 'center' }}>
            <FontAwesome name="television" size={24} color={theme.textMuted} />
            <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '700', marginTop: 10 }}>Sin canales para mostrar</Text>
            <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 12, marginTop: 4 }}>Ajusta los filtros de búsqueda</Text>
          </View>

        ) : viewMode === 'table' ? (
          /* ── Table View ── */
          <View style={{ backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', overflow: 'hidden' }}>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.26)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.8)' }}>
              {['CANAL', 'CATEGORÍA', 'ESTADO', 'VIEWERS', ''].map((h, i) => (
                <Text key={i} style={{ flex: [2.2, 1, 0.8, 0.6, 0.6][i], color: theme.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: i === 4 ? 'right' : 'left' }}>
                  {h}
                </Text>
              ))}
            </View>

            {/* Table Rows */}
            {filtered.map((ch, i) => {
              const catName = ch.category?.nombre ?? activeCategories.find((c) => c.id === ch.categoryId)?.nombre ?? '—';
              return (
                <TouchableOpacity
                  key={ch.id}
                  onPress={() => setDetailChannel(ch)}
                  style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: theme.border }}
                >
                  {/* Canal */}
                  <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {ch.logoUrl ? (
                      // @ts-ignore – web-only img
                      <img src={resolveLogoUrl(ch.logoUrl)} alt={ch.nombre} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain', background: 'rgba(120,60,180,0.1)', border: '1px solid rgba(120,60,180,0.25)', padding: 3, flexShrink: 0 }} />
                    ) : (
                      <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.accentBorder }}>
                        <FontAwesome name="television" size={14} color={theme.accent} />
                      </View>
                    )}
                    <View>
                      <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '600' }}>{ch.nombre}</Text>
                      <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>/{ch.slug}</Text>
                    </View>
                  </View>
                  {/* Categoría */}
                  <View style={{ flex: 1 }}>
                    <View style={{ backgroundColor: 'rgba(176,124,198,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                      <Text style={{ color: '#B07CC6', fontSize: 10, fontWeight: '700' }}>{catName}</Text>
                    </View>
                  </View>
                  {/* Estado */}
                  <View style={{ flex: 0.8 }}>
                    <StatusBadge status={ch.status} isLive={ch.isLive} />
                  </View>
                  {/* Viewers */}
                  <Text style={{ flex: 0.6, color: ch.isLive ? theme.text : theme.textMuted, fontSize: 12, fontWeight: ch.isLive ? '700' : '400' }}>
                    {ch.isLive ? ch.viewerCount.toLocaleString() : '—'}
                  </Text>
                  {/* Acciones */}
                  <View style={{ flex: 0.6, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); openEdit(ch); }}
                      style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FontAwesome name="pencil" size={11} color={theme.textSec} />
                    </TouchableOpacity>
                    {canDelete && (
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); setDeleteConfirm(ch.id); }}
                      style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', backgroundColor: isDark ? theme.liftBg : 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FontAwesome name="trash" size={11} color="#D1105A" />
                    </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        ) : (
          /* ── Grid View ── */
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {filtered.map((ch) => {
              const catName = ch.category?.nombre ?? activeCategories.find((c) => c.id === ch.categoryId)?.nombre ?? '—';
              return (
                <TouchableOpacity
                  key={ch.id}
                  onPress={() => setDetailChannel(ch)}
                  style={{ width: 260, backgroundColor: isDark ? theme.cardBg : 'rgba(255,255,255,0.92)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? theme.border : 'rgba(130,130,130,0.34)', overflow: 'hidden' }}
                >
                  {/* Preview 16:9 */}
                  <View style={{ aspectRatio: 16 / 9, backgroundColor: '#0a0a12', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {ch.logoUrl
                      // @ts-ignore – web-only img
                      ? <img src={resolveLogoUrl(ch.logoUrl)} alt={ch.nombre} style={{ maxHeight: 52, maxWidth: 130, objectFit: 'contain', opacity: 0.9 }} />
                      : <FontAwesome name="television" size={28} color="rgba(255,255,255,0.1)" />
                    }
                    <View style={{ position: 'absolute', top: 8, left: 8 }}>
                      <StatusBadge status={ch.status} isLive={ch.isLive} />
                    </View>
                    {ch.isLive && (
                      <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <FontAwesome name="eye" size={9} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{ch.viewerCount.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: isDark ? theme.text : '#240046', fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>{ch.nombre}</Text>
                      <HealthBadge health={ch.healthStatus} />
                    </View>
                    <Text style={{ color: isDark ? theme.textMuted : '#240046', fontSize: 11 }}>{catName} · {ch.resolution} · {ch.streamProtocol}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); if (accessToken) toggleChannelStatusApi(accessToken, ch.id); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
                      >
                        <FontAwesome name={ch.status === 'ACTIVE' ? 'power-off' : 'play'} size={11} color={ch.status === 'ACTIVE' ? '#17D1C6' : theme.textSec} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); openEdit(ch); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
                      >
                        <FontAwesome name="pencil" size={11} color={theme.textSec} />
                      </TouchableOpacity>
                      {canDelete && (
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); setDeleteConfirm(ch.id); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
                      >
                        <FontAwesome name="trash" size={11} color="#D1105A" />
                      </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ── Delete Confirmation ── */}
      {deleteConfirm && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(5,5,12,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 380, backgroundColor: theme.cardBg, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 28, alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(209,16,90,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FontAwesome name="trash" size={20} color="#D1105A" />
              </View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>¿Eliminar canal?</Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                Esta acción no se puede deshacer. El canal será eliminado del catálogo.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setDeleteConfirm(null)} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ color: theme.textSec, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(deleteConfirm)} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10, backgroundColor: '#D1105A' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Create/Edit Modal ── */}
      {showForm && (
        <ChannelFormModal
          channel={editingChannel}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingChannel(null); }}
          categories={categorias.map((c) => ({ id: c.id, nombre: c.nombre, esContenidoAdulto: c.esContenidoAdulto }))}
          accessToken={accessToken ?? ''}
        />
      )}

      {/* ── Detail Modal ── */}
      {detailChannel && (
        <ChannelDetailModal
          channel={detailChannel}
          onClose={() => setDetailChannel(null)}
          onEdit={openEdit}
          categories={activeCategories}
        />
      )}
    </CmsShell>
  );
}
