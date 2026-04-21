import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Platform, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { useCategoriasStore } from '../../services/categoriasStore';
import type { AdminCanal, AdminCanalPayload } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

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

// ─── StatCard Component ──────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: 140, backgroundColor: C.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome name={icon as any} size={18} color={color} />
      </View>
      <View>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
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
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
        {label} {required && <Text style={{ color: '#D1105A' }}>*</Text>}
      </Text>
      {children}
      {hint && <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{hint}</Text>}
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
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, maxWidth: '95%', backgroundColor: C.surface, borderLeftWidth: 1, borderLeftColor: C.border }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView>
            {/* Header */}
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="television" size={20} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>{channel.nombre}</Text>
                  <Text style={{ color: C.muted, fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>/{channel.slug}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }} onPress={() => { onClose(); onEdit(channel); }}>
                  <FontAwesome name="pencil" size={13} color={C.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
                  <FontAwesome name="times" size={13} color={C.muted} />
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
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Stream URL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ flex: 1, color: C.textDim, fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} numberOfLines={2}>
                  {channel.streamUrl}
                </Text>
                <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: copied ? 'rgba(23,209,198,0.15)' : 'transparent' }} onPress={copyUrl}>
                  <FontAwesome name={copied ? 'check' : 'copy'} size={12} color={copied ? '#17D1C6' : C.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info grid */}
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {infoRows.map((row) => (
                <View key={row.label} style={{ width: '47%', padding: 12, borderRadius: 10, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{row.label}</Text>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{row.value}</Text>
                </View>
              ))}
              <View style={{ width: '47%', padding: 12, borderRadius: 10, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Salud</Text>
                <HealthBadge health={channel.healthStatus} />
              </View>
            </View>

            {/* Plans */}
            {channel.planIds.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Planes con acceso</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {channel.planIds.map((pid) => (
                    <View key={pid} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accentBorder }}>
                      <Text style={{ color: C.accent, fontSize: 11, fontWeight: '600' }}>{pid}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timestamps */}
            <View style={{ marginHorizontal: 20, marginBottom: 24, padding: 14, borderRadius: 10, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>
                Creado: <Text style={{ color: C.textDim }}>{new Date(channel.createdAt).toLocaleDateString('es-EC')}</Text>
              </Text>
              <Text style={{ color: C.muted, fontSize: 11 }}>
                Actualizado: <Text style={{ color: C.textDim }}>{new Date(channel.updatedAt).toLocaleDateString('es-EC')}</Text>
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Create/Edit Modal ────────────────────────────────────────
function ChannelFormModal({ channel, onSave, onClose, categories }: {
  channel: AdminCanal | null;
  onSave: (form: AdminCanalPayload) => void;
  onClose: () => void;
  categories: { id: string; nombre: string }[];
}) {
  const isEdit = !!channel;
  const [form, setForm] = useState<AdminCanalPayload>(() =>
    channel ? {
      nombre: channel.nombre, slug: channel.slug, streamUrl: channel.streamUrl, backupUrl: channel.backupUrl ?? '', logoUrl: channel.logoUrl ?? '',
      categoryId: channel.categoryId, epgSourceId: channel.epgSourceId ?? '', status: channel.status, streamProtocol: channel.streamProtocol,
      resolution: channel.resolution, bitrateKbps: channel.bitrateKbps, isDrmProtected: channel.isDrmProtected,
      geoRestriction: channel.geoRestriction ?? '', sortOrder: channel.sortOrder, planIds: channel.planIds, requiereControlParental: channel.requiereControlParental,
    } : emptyForm()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [formError, setFormError] = useState('');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
  const inputStyle = {
    backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    color: C.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, ...webInput,
  };

  function upd<K extends keyof AdminCanalPayload>(key: K, val: AdminCanalPayload[K]) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'nombre' && !isEdit) next.slug = autoSlug(val as string);
      return next;
    });
  }

  function validate(): boolean {
    if (!form.nombre.trim()) { setFormError('El nombre es requerido.'); return false; }
    if (!form.streamUrl.trim() || !isValidUrl(form.streamUrl)) { setFormError('URL del stream inválida (requiere http/https).'); return false; }
    if (!form.categoryId) { setFormError('Debes seleccionar una categoría.'); return false; }
    if (form.backupUrl && !isValidUrl(form.backupUrl)) { setFormError('URL de respaldo inválida.'); return false; }
    setFormError('');
    return true;
  }

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'television' },
    { id: 'stream', label: 'Stream', icon: 'globe' },
    { id: 'access', label: 'Acceso', icon: 'lock' },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,5,12,0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 680, maxHeight: '92%', backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>

          {/* Header */}
          <View style={{ paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: C.text, fontSize: 17, fontWeight: '800' }}>{isEdit ? 'Editar canal' : 'Nuevo canal'}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                {isEdit ? `Editando: ${channel!.nombre}` : 'Configura el canal HLS/DASH'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="times" size={14} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 22 }}>
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: active ? C.accent : 'transparent' }}>
                  <FontAwesome name={tab.icon as any} size={12} color={active ? C.accent : C.muted} />
                  <Text style={{ color: active ? C.accent : C.muted, fontSize: 12, fontWeight: '700' }}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={{ padding: 22 }}>

            {/* TAB: General */}
            {activeTab === 'general' && (
              <>
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 2 }}>
                    <FormField label="Nombre del canal" required>
                      <TextInput style={inputStyle} value={form.nombre} onChangeText={(v) => upd('nombre', v)} placeholder="ESPN Ecuador" placeholderTextColor={C.muted} />
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Slug (URL)" hint="Auto-generado">
                      <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.slug} onChangeText={(v) => upd('slug', v)} placeholder="espn-ecuador" placeholderTextColor={C.muted} />
                    </FormField>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Categoría" required>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
                        {categories.map((cat) => {
                          const sel = form.categoryId === cat.id;
                          return (
                            <TouchableOpacity key={cat.id} onPress={() => upd('categoryId', cat.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accentSoft : C.lift }}>
                              <Text style={{ color: sel ? C.accent : C.textDim, fontSize: 12, fontWeight: '700' }}>{cat.nombre}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Estado">
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(Object.keys(STATUS_CONFIG) as ChannelStatus[]).map((s) => {
                          const sel = form.status === s;
                          const cfg = STATUS_CONFIG[s];
                          return (
                            <TouchableOpacity key={s} onPress={() => upd('status', s)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: sel ? cfg.color : C.border, backgroundColor: sel ? cfg.bg : C.lift }}>
                              <Text style={{ color: sel ? cfg.color : C.textDim, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </FormField>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 2 }}>
                    <FormField label="Logo URL" hint="PNG transparente, 200×100px recomendado">
                      <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.logoUrl} onChangeText={(v) => upd('logoUrl', v)} placeholder="https://..." placeholderTextColor={C.muted} autoCapitalize="none" />
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Orden">
                      <TextInput style={inputStyle} value={String(form.sortOrder)} onChangeText={(v) => upd('sortOrder', parseInt(v) || 99)} keyboardType="number-pad" placeholderTextColor={C.muted} />
                    </FormField>
                  </View>
                </View>

                <FormField label="Fuente EPG" hint="ID del proveedor XMLTV (ej: epg_espn_ec)">
                  <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.epgSourceId} onChangeText={(v) => upd('epgSourceId', v)} placeholder="epg_espn_ec" placeholderTextColor={C.muted} autoCapitalize="none" />
                </FormField>

                <TouchableOpacity onPress={() => upd('requiereControlParental', !form.requiereControlParental)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: form.requiereControlParental ? C.accentBorder : C.border, backgroundColor: form.requiereControlParental ? C.accentSoft : C.lift }}>
                  <FontAwesome name={form.requiereControlParental ? 'lock' : 'unlock'} size={13} color={form.requiereControlParental ? C.accent : C.textDim} />
                  <Text style={{ color: form.requiereControlParental ? C.accent : C.textDim, fontSize: 12, fontWeight: '700' }}>Control parental</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TAB: Stream */}
            {activeTab === 'stream' && (
              <>
                <FormField label="URL del stream (principal)" required hint="URL HLS (.m3u8) o DASH (.mpd) del CDN">
                  <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.streamUrl} onChangeText={(v) => upd('streamUrl', v)} placeholder="https://cdn.example.com/.../playlist.m3u8" placeholderTextColor={C.muted} autoCapitalize="none" />
                </FormField>
                <FormField label="URL de respaldo (failover)" hint="Se usa si el stream principal falla">
                  <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.backupUrl} onChangeText={(v) => upd('backupUrl', v)} placeholder="https://backup-cdn.example.com/.../playlist.m3u8" placeholderTextColor={C.muted} autoCapitalize="none" />
                </FormField>

                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="Protocolo">
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {PROTOCOLS.map((p) => {
                          const sel = form.streamProtocol === p;
                          return (
                            <TouchableOpacity key={p} onPress={() => upd('streamProtocol', p)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accentSoft : C.lift, alignItems: 'center' }}>
                              <Text style={{ color: sel ? C.accent : C.textDim, fontSize: 11, fontWeight: '700' }}>{p}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </FormField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Resolución">
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        {RESOLUTIONS.map((r) => {
                          const sel = form.resolution === r;
                          return (
                            <TouchableOpacity key={r} onPress={() => upd('resolution', r)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: sel ? C.accent : C.border, backgroundColor: sel ? C.accentSoft : C.lift }}>
                              <Text style={{ color: sel ? C.accent : C.textDim, fontSize: 11, fontWeight: '700' }}>{r}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </FormField>
                  </View>
                </View>

                <FormField label="Bitrate (kbps)">
                  <TextInput style={inputStyle} value={String(form.bitrateKbps)} onChangeText={(v) => upd('bitrateKbps', parseInt(v) || 5000)} keyboardType="number-pad" placeholderTextColor={C.muted} />
                </FormField>

                <TouchableOpacity onPress={() => upd('isDrmProtected', !form.isDrmProtected)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: form.isDrmProtected ? C.accentBorder : C.border, backgroundColor: form.isDrmProtected ? C.accentSoft : C.lift }}>
                  <FontAwesome name="shield" size={13} color={form.isDrmProtected ? C.accent : C.textDim} />
                  <Text style={{ color: form.isDrmProtected ? C.accent : C.textDim, fontSize: 12, fontWeight: '700' }}>Protección DRM (Widevine/FairPlay)</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TAB: Access */}
            {activeTab === 'access' && (
              <>
                <FormField label="Restricción geográfica" hint="Códigos ISO 3166-1 separados por coma (ej: EC,CO,PE). Vacío = sin restricción.">
                  <TextInput style={{ ...inputStyle, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }} value={form.geoRestriction} onChangeText={(v) => upd('geoRestriction', v.toUpperCase())} placeholder="EC" placeholderTextColor={C.muted} autoCapitalize="characters" />
                </FormField>
              </>
            )}

            {formError ? <Text style={{ color: '#D1105A', fontSize: 12, fontWeight: '700', marginTop: 8 }}>{formError}</Text> : null}
          </ScrollView>

          {/* Footer */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (validate()) onSave(form); }} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent }}>
              <Text style={{ color: '#1A1A2E', fontSize: 13, fontWeight: '800' }}>{isEdit ? 'Guardar cambios' : 'Crear canal'}</Text>
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
    if (accessToken) loadChannels(accessToken);
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
      if (editingChannel) {
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

  return (
    <CmsShell breadcrumbs={[{ label: 'Canales' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* ── Header Section ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FontAwesome name="television" size={20} color={C.accent} />
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Canales</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 13 }}>
              {isLoading ? 'Sincronizando con el servidor...' : `Gestión de streams HLS/DASH en vivo · ${channels.length} canales registrados`}
            </Text>
          </View>
          <TouchableOpacity onPress={openCreate} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent }}>
            <FontAwesome name="plus" size={14} color="#1A1A2E" />
            <Text style={{ color: '#1A1A2E', fontWeight: '800', fontSize: 13 }}>Nuevo canal</Text>
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
          <StatCard label="Streams saludables" value={`${stats.healthy}/${stats.total}`} icon="check-circle" color="#17D1C6" />
        </View>

        {/* ── Filters Bar (Single line) ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20 }}>
          {/* Search */}
          <View style={{ flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
            <FontAwesome name="search" size={13} color={C.muted} />
            <TextInput style={{ flex: 1, color: C.text, fontSize: 13, ...webInput }} value={search} onChangeText={setSearch} placeholder="Buscar por nombre o slug..." placeholderTextColor={C.muted} />
          </View>

          {/* Status Filter Dropdown */}
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border }}>
            <FontAwesome name="filter" size={12} color={C.muted} />
            <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '600' }}>Todos los estados</Text>
          </TouchableOpacity>

          {/* Category Filter Dropdown */}
          {Platform.OS === 'web' && (
            <View style={{ borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift, overflow: 'hidden' }}>
              {/* @ts-ignore */}
              <select value={filterCategory} onChange={(e: any) => setFilterCategory(e.target.value)} style={{ padding: '7px 12px', background: 'transparent', border: 'none', color: C.textDim, fontSize: 12, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', minWidth: 150 } as any}>
                <option value="all">Todas las categorías</option>
                {activeCategories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
              </select>
            </View>
          )}

          {/* View Toggle */}
          <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
            {(['table', 'grid'] as ViewMode[]).map((m) => (<TouchableOpacity key={m} onPress={() => setViewMode(m)} style={{ width: 34, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: viewMode === m ? C.accentSoft : 'transparent' }}>
              <FontAwesome name={m === 'table' ? 'list' : 'th-large'} size={13} color={viewMode === m ? C.accent : C.muted} />
            </TouchableOpacity>))}
          </View>
        </View>

        {/* ── Empty State ── */}
        {channels.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 48, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="television" size={26} color={C.accent} />
            </View>
            <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>Sin canales registrados</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>Crea tu primer canal con URL HLS/DASH, categoría y configuración OTT.</Text>
            <TouchableOpacity onPress={openCreate} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: C.accent, marginTop: 4 }}>
              <FontAwesome name="plus" size={13} color="#1A1A2E" />
              <Text style={{ color: '#1A1A2E', fontWeight: '800', fontSize: 13 }}>Crear primer canal</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 24, alignItems: 'center' }}>
            <FontAwesome name="television" size={24} color={C.muted} />
            <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginTop: 10 }}>Sin canales para mostrar</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Ajusta los filtros de búsqueda</Text>
          </View>

        ) : viewMode === 'table' ? (
          /* ── Table View ── */
          <View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            {/* Table Header */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.lift }}>
              {['CANAL', 'CATEGORÍA', 'ESTADO', 'RESOLUCIÓN', 'VIEWERS', 'SALUD', ''].map((h, i) => (
                <Text key={i} style={{ flex: [2.2, 1, 0.8, 0.8, 0.6, 0.8, 0.6][i], color: C.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: i === 6 ? 'right' : 'left' }}>
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
                  style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center', borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: C.border }}
                >
                  {/* Canal */}
                  <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accentBorder }}>
                      <FontAwesome name="television" size={14} color={C.accent} />
                    </View>
                    <View>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>{ch.nombre}</Text>
                      <Text style={{ color: C.muted, fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>/{ch.slug}</Text>
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
                  {/* Resolución */}
                  <Text style={{ flex: 0.8, color: C.textDim, fontSize: 12, fontWeight: '500' }}>{ch.resolution}</Text>
                  {/* Viewers */}
                  <Text style={{ flex: 0.6, color: ch.isLive ? C.text : C.muted, fontSize: 12, fontWeight: ch.isLive ? '700' : '400' }}>
                    {ch.isLive ? ch.viewerCount.toLocaleString() : '—'}
                  </Text>
                  {/* Salud */}
                  <View style={{ flex: 0.8 }}>
                    <HealthBadge health={ch.healthStatus} />
                  </View>
                  {/* Acciones */}
                  <View style={{ flex: 0.6, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); openEdit(ch); }}
                      style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FontAwesome name="pencil" size={11} color={C.textDim} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); setDeleteConfirm(ch.id); }}
                      style={{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <FontAwesome name="trash" size={11} color="#D1105A" />
                    </TouchableOpacity>
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
                  style={{ width: 260, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}
                >
                  {/* Preview 16:9 */}
                  <View style={{ aspectRatio: 16 / 9, backgroundColor: '#0a0a12', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <FontAwesome name="television" size={28} color="rgba(255,255,255,0.1)" />
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
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>{ch.nombre}</Text>
                      <HealthBadge health={ch.healthStatus} />
                    </View>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{catName} · {ch.resolution} · {ch.streamProtocol}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); if (accessToken) toggleChannelStatusApi(accessToken, ch.id); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border }}
                      >
                        <FontAwesome name={ch.status === 'ACTIVE' ? 'power-off' : 'play'} size={11} color={ch.status === 'ACTIVE' ? '#17D1C6' : C.textDim} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); openEdit(ch); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border }}
                      >
                        <FontAwesome name="pencil" size={11} color={C.textDim} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); setDeleteConfirm(ch.id); }}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.border }}
                      >
                        <FontAwesome name="trash" size={11} color="#D1105A" />
                      </TouchableOpacity>
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
            <View style={{ width: '100%', maxWidth: 380, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 28, alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(209,16,90,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FontAwesome name="trash" size={20} color="#D1105A" />
              </View>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>¿Eliminar canal?</Text>
              <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                Esta acción no se puede deshacer. El canal será eliminado del catálogo.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setDeleteConfirm(null)} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '700' }}>Cancelar</Text>
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
          categories={activeCategories}
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
