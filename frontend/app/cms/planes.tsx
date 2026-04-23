import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Modal, TextInput, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminCreatePlan, adminDeletePlan, adminListPlans,
  adminTogglePlan, adminUpdatePlan,
  AdminPlan, AdminPlanPayload,
} from '../../services/api/adminApi';
import { usePlanesStore } from '../../services/planesStore';
import { useCategoriasStore } from '../../services/categoriasStore';
import { useChannelStore } from '../../services/channelStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_OPTIONS: Array<{ value: AdminPlan['grupoUsuarios']; label: string; tone: 'accent' | 'green' | 'cyan' | 'amber' }> = [
  { value: 'ISP_BUNDLE', label: 'ISP Bundle',    tone: 'green'  },
  { value: 'INDIVIDUAL',  label: 'Individual',    tone: 'accent' },
  { value: 'FAMILIAR',    label: 'Familiar',      tone: 'cyan'   },
  { value: 'EMPRESARIAL', label: 'Empresarial',   tone: 'amber'  },
  { value: 'PROMOCIONAL', label: 'Promocional',   tone: 'accent' },
];

const QUALITY_OPTIONS: Array<{ value: AdminPlan['videoQuality']; label: string }> = [
  { value: 'SD',  label: 'SD'  },
  { value: 'HD',  label: 'HD'  },
  { value: 'FHD', label: 'FHD' },
  { value: '4K',  label: '4K'  },
];

const ENTITLEMENT_OPTIONS: Array<{ value: AdminPlan['entitlements'][number]; label: string }> = [
  { value: 'live-tv',     label: 'TV en Vivo'      },
  { value: 'vod-basic',   label: 'VOD Básico'      },
  { value: 'vod-premium', label: 'VOD Premium'     },
  { value: 'series',      label: 'Series'          },
  { value: 'kids',        label: 'Infantil'        },
  { value: 'sports',      label: 'Deportes'        },
  { value: 'radio',       label: 'Radio'           },
  { value: '4k',          label: 'Ultra HD 4K'     },
  { value: 'downloads',   label: 'Descargas'       },
  { value: 'ppv',         label: 'PPV'             },
];

const MIN_DEVICES = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmptyPlan(): AdminPlanPayload {
  return {
    nombre: '',
    descripcion: '',
    grupoUsuarios: 'ISP_BUNDLE',
    precio: 0,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: MIN_DEVICES,
    maxConcurrentStreams: 2,
    maxProfiles: 3,
    videoQuality: 'HD',
    allowDownloads: false,
    allowCasting: true,
    hasAds: false,
    trialDays: 0,
    gracePeriodDays: 0,
    entitlements: ['live-tv', 'vod-basic', 'sports'],
    allowedComponentIds: [],
    allowedCategoryIds: [],
    allowedChannelIds: [],
  };
}

function groupLabel(group: AdminPlan['grupoUsuarios']) {
  return GROUP_OPTIONS.find((o) => o.value === group)?.label ?? group;
}

function groupColors(group: AdminPlan['grupoUsuarios']) {
  const tone = GROUP_OPTIONS.find((o) => o.value === group)?.tone ?? 'accent';
  if (tone === 'green')  return { bg: C.greenSoft,  border: 'rgba(23,209,198,0.28)',  text: C.green  };
  if (tone === 'cyan')   return { bg: C.cyanSoft,   border: 'rgba(23,209,198,0.24)',  text: C.cyan   };
  if (tone === 'amber')  return { bg: C.amberSoft,  border: 'rgba(255,121,0,0.28)',   text: C.amber  };
  return { bg: C.accentSoft, border: C.accentBorder, text: C.accentLight };
}

// ---------------------------------------------------------------------------
// Small UI components
// ---------------------------------------------------------------------------

function ToggleChip({
  active, label, onPress, tone = 'accent',
}: {
  active: boolean; label: string; onPress: () => void; tone?: 'accent' | 'green' | 'cyan' | 'amber';
}) {
  const palette =
    tone === 'green'  ? { bg: C.greenSoft,  border: 'rgba(23,209,198,0.28)',  text: C.green  } :
    tone === 'cyan'   ? { bg: C.cyanSoft,   border: 'rgba(23,209,198,0.24)',  text: C.cyan   } :
    tone === 'amber'  ? { bg: C.amberSoft,  border: 'rgba(255,121,0,0.28)',   text: C.amber  } :
                        { bg: C.accentSoft, border: C.accentBorder,                    text: C.accentLight  };

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
        backgroundColor: active ? palette.bg : C.lift,
        borderWidth: 1, borderColor: active ? palette.border : C.border,
      }}
      onPress={onPress}
    >
      <Text style={{ color: active ? palette.text : C.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function BooleanRow({ label, helper, value, onToggle }: { label: string; helper: string; value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: C.lift, borderRadius: 12, borderWidth: 1, borderColor: C.border,
        paddingHorizontal: 14, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}
      onPress={onToggle}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 3 }}>{label}</Text>
        <Text style={{ color: C.textDim, fontSize: 12 }}>{helper}</Text>
      </View>
      <View
        style={{
          width: 48, height: 28, borderRadius: 999,
          backgroundColor: value ? C.greenSoft : C.roseSoft,
          borderWidth: 1, borderColor: value ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)',
          justifyContent: 'center', paddingHorizontal: 3,
        }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: value ? C.green : C.rose, alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 10, marginTop: 6 }}>{children}</Text>
  );
}

function ChannelRow({
  channel, selected, onToggle,
}: {
  channel: { id: string; nombre: string; category?: { nombre: string }; status: string; isLive: boolean };
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: selected ? C.accentSoft : C.lift,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
        borderWidth: 1, borderColor: selected ? C.accentBorder : C.border,
        marginBottom: 6,
      }}
      onPress={onToggle}
    >
      <View style={{
        width: 20, height: 20, borderRadius: 6, borderWidth: 2,
        borderColor: selected ? C.accent : C.muted,
        backgroundColor: selected ? C.accent : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <FontAwesome name="check" size={10} color="white" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700' }}>{channel.nombre}</Text>
        {channel.category && (
          <Text style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{channel.category.nombre}</Text>
        )}
      </View>
      {channel.isLive && (
        <View style={{ backgroundColor: C.roseSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: C.rose, fontSize: 10, fontWeight: '800' }}>LIVE</Text>
        </View>
      )}
      <View style={{
        backgroundColor: channel.status === 'ACTIVE' ? C.greenSoft : C.lift,
        borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
      }}>
        <Text style={{ color: channel.status === 'ACTIVE' ? C.green : C.muted, fontSize: 10, fontWeight: '700' }}>
          {channel.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CmsPlanes() {
  const { isDark } = useTheme();
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();

  const syncFromApi = usePlanesStore((s) => s.syncFromApi);
  const storeToggle = usePlanesStore((s) => s.toggle);
  const storeRemove = usePlanesStore((s) => s.remove);

  const allCategorias = useCategoriasStore((s) => s.categorias);
  const categorias = allCategorias.filter((c) => c.activo);

  const channels = useChannelStore((s) => s.channels);
  const loadChannels = useChannelStore((s) => s.loadChannels);

  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminPlanPayload>(buildEmptyPlan());
  const [formError, setFormError] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'acceso' | 'canales'>('info');
  const [deleteConfirm, setDeleteConfirm] = useState<AdminPlan | null>(null);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      adminListPlans(accessToken),
      loadChannels(accessToken),
    ])
      .then(([plansData]) => {
        setPlans(plansData);
        syncFromApi(plansData);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  // Stats
  const activePlans = plans.filter((p) => p.activo).length;
  const ispPlans = plans.filter((p) => p.grupoUsuarios === 'ISP_BUNDLE').length;
  const totalChannelSlots = plans.reduce((sum, p) => sum + (p.allowedChannelIds?.length ?? 0), 0);

  // Filtered channels for the selector
  const filteredChannels = channels.filter((ch) =>
    ch.nombre.toLowerCase().includes(channelSearch.toLowerCase()) ||
    ch.category?.nombre.toLowerCase().includes(channelSearch.toLowerCase()),
  );

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof AdminPlanPayload>(field: K, value: AdminPlanPayload[K]) {
    setForm((cur) => ({ ...cur, [field]: value }));
  }

  function updateNumberField(
    field: 'precio' | 'duracionDias' | 'maxDevices' | 'maxConcurrentStreams' | 'maxProfiles' | 'trialDays' | 'gracePeriodDays',
    value: string,
  ) {
    const parsed = Number(value.replace(',', '.'));
    updateField(field, Number.isFinite(parsed) ? parsed : 0);
  }

  function toggleArray(field: 'entitlements' | 'allowedCategoryIds' | 'allowedChannelIds', value: string) {
    setForm((cur) => {
      const arr = cur[field] as string[];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...cur, [field]: next };
    });
  }

  // ---------------------------------------------------------------------------
  // Modal controls
  // ---------------------------------------------------------------------------

  function openCreateModal() {
    setEditingId(null);
    setForm(buildEmptyPlan());
    setFormError('');
    setActiveTab('info');
    setChannelSearch('');
    setModalVisible(true);
  }

  function openEditModal(plan: AdminPlan) {
    setEditingId(plan.id);
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      grupoUsuarios: plan.grupoUsuarios,
      precio: plan.precio,
      moneda: plan.moneda,
      duracionDias: plan.duracionDias,
      activo: plan.activo,
      maxDevices: plan.maxDevices,
      maxConcurrentStreams: plan.maxConcurrentStreams,
      maxProfiles: plan.maxProfiles,
      videoQuality: plan.videoQuality,
      allowDownloads: plan.allowDownloads,
      allowCasting: plan.allowCasting,
      hasAds: plan.hasAds,
      trialDays: plan.trialDays,
      gracePeriodDays: plan.gracePeriodDays,
      entitlements: [...plan.entitlements],
      allowedComponentIds: [...plan.allowedComponentIds],
      allowedCategoryIds: [...plan.allowedCategoryIds],
      allowedChannelIds: [...(plan.allowedChannelIds ?? [])],
    });
    setFormError('');
    setActiveTab('info');
    setChannelSearch('');
    setModalVisible(true);
  }

  function closeModal() {
    if (saving) return;
    setModalVisible(false);
    setEditingId(null);
    setForm(buildEmptyPlan());
    setFormError('');
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function refreshPlans() {
    if (!accessToken) return;
    const data = await adminListPlans(accessToken);
    setPlans(data);
    syncFromApi(data);
  }

  async function handleSave() {
    if (!accessToken) return;
    if (!form.nombre.trim() || !form.descripcion.trim()) {
      setFormError('Nombre y descripción son requeridos.');
      setActiveTab('info');
      return;
    }
    if (form.maxDevices < MIN_DEVICES) {
      setFormError(`El mínimo de dispositivos es ${MIN_DEVICES}.`);
      setActiveTab('info');
      return;
    }
    if (form.maxConcurrentStreams < 1 || form.maxProfiles < 1) {
      setFormError('Streams y perfiles deben ser mayores a cero.');
      setActiveTab('info');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await adminUpdatePlan(accessToken, editingId, form);
      } else {
        await adminCreatePlan(accessToken, form);
      }
      await refreshPlans();
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(plan: AdminPlan) {
    if (!accessToken) return;
    storeToggle(plan.id);
    setPlans((cur) => cur.map((p) => p.id === plan.id ? { ...p, activo: !p.activo } : p));
    try {
      await adminTogglePlan(accessToken, plan.id);
      await refreshPlans();
    } catch {
      // local store already updated; ignore API errors
    }
  }

  async function handleDelete(plan: AdminPlan) {
    setDeleteConfirm(plan);
  }

  async function confirmDelete() {
    if (!accessToken || !deleteConfirm) return;
    storeRemove(deleteConfirm.id);
    setPlans((cur) => cur.filter((p) => p.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    try {
      await adminDeletePlan(accessToken, deleteConfirm.id);
    } catch {
      // local store already updated
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const TABS: Array<{ key: 'info' | 'acceso' | 'canales'; label: string; icon: string }> = [
    { key: 'info',    label: 'Información',  icon: 'info-circle' },
    { key: 'acceso',  label: 'Acceso',       icon: 'lock'        },
    { key: 'canales', label: 'Canales',      icon: 'tv'          },
  ];

  const selectedChannelCount = (form.allowedChannelIds ?? []).length;

  return (
    <CmsShell breadcrumbs={[{ label: 'Planes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden' }}
            onPress={openCreateModal}
          >
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: C.accent }} />
            </View>
            <FontAwesome name="plus" size={13} color="#1A1A2E" />
            <Text style={{ color: '#1A1A2E', fontWeight: '700', fontSize: 13, fontFamily: 'Montserrat-SemiBold' }}>Agregar Plan</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Planes totales',    value: String(plans.length),     icon: 'star'          as const, color: C.accent, bg: C.accentSoft },
            { label: 'Activos',           value: String(activePlans),       icon: 'check-circle'  as const, color: C.green,  bg: C.greenSoft  },
            { label: 'Planes ISP Bundle', value: String(ispPlans),          icon: 'wifi'          as const, color: C.green,  bg: C.greenSoft  },
            { label: 'Canales asignados', value: String(totalChannelSlots), icon: 'television'    as const, color: C.cyan,   bg: C.cyanSoft   },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, minWidth: 180, backgroundColor: isDark ? C.surface : 'rgba(255,255,255,0.92)', borderRadius: 14, borderWidth: 1, borderColor: isDark ? C.border : 'rgba(130,130,130,0.34)', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={{ color: isDark ? C.textDim : '#240046', fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
              </View>
              <Text style={{ color: item.color, fontSize: 22, fontWeight: '800' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Plan cards ─────────────────────────────────────────────────── */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : plans.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <FontAwesome name="list-alt" size={40} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 15, marginTop: 16 }}>No hay planes. Crea el primero.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {plans.map((plan) => {
              const gc = groupColors(plan.grupoUsuarios);
              const isIsp = plan.grupoUsuarios === 'ISP_BUNDLE';
              const chCount = plan.allowedChannelIds?.length ?? 0;
              const catCount = plan.allowedCategoryIds?.length ?? 0;

              return (
                <View
                  key={plan.id}
                  style={{
                    backgroundColor: isDark ? C.surface : 'rgba(255,255,255,0.92)', borderRadius: 16, padding: 24,
                    borderWidth: isIsp ? 2 : 1,
                    borderColor: isIsp ? C.green : (plan.activo ? C.accentBorder : (isDark ? C.border : 'rgba(130,130,130,0.34)')),
                    minWidth: 280, flex: 1, maxWidth: 380,
                  }}
                >
                  {/* Card header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                      {isIsp && (
                        <View style={{ backgroundColor: C.greenSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <FontAwesome name="wifi" size={10} color={C.green} />
                          <Text style={{ color: C.green, fontSize: 10, fontWeight: '800' }}>INCLUIDO ISP</Text>
                        </View>
                      )}
                      <View style={{ backgroundColor: plan.activo ? C.accentSoft : C.lift, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: plan.activo ? C.accentBorder : C.border }}>
                        <Text style={{ color: plan.activo ? C.accentLight : C.muted, fontSize: 10, fontWeight: '700' }}>
                          {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: gc.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: gc.border }}>
                        <Text style={{ color: gc.text, fontSize: 10, fontWeight: '700' }}>{groupLabel(plan.grupoUsuarios)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(180,144,255,0.24)' }} onPress={() => openEditModal(plan)}>
                        <FontAwesome name="pencil" size={12} color={C.cyan} />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }} onPress={() => handleDelete(plan)}>
                        <FontAwesome name="trash" size={12} color={C.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Name & description */}
                  <Text style={{ color: isDark ? C.text : '#240046', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>{plan.nombre}</Text>
                  <Text style={{ color: isDark ? C.textDim : '#240046', fontSize: 12, lineHeight: 18, marginBottom: 16 }} numberOfLines={3}>{plan.descripcion}</Text>

                  {/* Price */}
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                    <Text style={{ color: C.accent, fontSize: 28, fontWeight: '900' }}>
                      {isIsp || !(plan.precio ?? 0) ? 'Incluido' : `$${(plan.precio ?? 0).toFixed(2)}`}
                    </Text>
                    {!isIsp && (plan.precio ?? 0) > 0 && (
                      <Text style={{ color: isDark ? C.textDim : '#240046', fontSize: 12, fontWeight: '600' }}>{plan.moneda ?? 'USD'} / {plan.duracionDias ?? 30} días</Text>
                    )}
                  </View>

                  {/* Metrics */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {[
                      { icon: 'mobile'      as const, text: `${plan.maxDevices} disp.`         },
                      { icon: 'play-circle' as const, text: `${plan.maxConcurrentStreams} streams` },
                      { icon: 'users'       as const, text: `${plan.maxProfiles} perfiles`      },
                      { icon: 'tv'          as const, text: `${chCount} canales`                },
                      { icon: 'tag'         as const, text: `${catCount} categorías`            },
                    ].map((item) => (
                      <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isDark ? C.lift : 'rgba(255,255,255,0.8)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: isDark ? C.border : 'rgba(130,130,130,0.26)' }}>
                        <FontAwesome name={item.icon} size={10} color={C.accentLight} />
                        <Text style={{ color: isDark ? C.text : '#240046', fontSize: 11, fontWeight: '700' }}>{item.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Toggle button */}
                  <TouchableOpacity
                    style={{ backgroundColor: plan.activo ? C.greenSoft : C.accentSoft, borderRadius: 10, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: plan.activo ? 'rgba(16,185,129,0.28)' : C.accentBorder }}
                    onPress={() => handleToggle(plan)}
                  >
                    <Text style={{ color: plan.activo ? C.green : C.accentLight, fontWeight: '800', fontSize: 12 }}>
                      {plan.activo ? 'Desactivar plan' : 'Activar plan'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Plan form modal ──────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 980, maxHeight: '92%', backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>

            {/* Modal header */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{editingId ? 'Editar plan' : 'Crear plan'}</Text>
                <Text style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>
                  {editingId ? 'Modifica acceso, canales y entitlements del plan.' : 'Define un nuevo plan OTT con acceso a categorías y canales.'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome name="times" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 24, paddingTop: 4 }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const badge = tab.key === 'canales' ? selectedChannelCount : null;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={{ paddingBottom: 12, paddingTop: 10, paddingHorizontal: 14, marginRight: 4, borderBottomWidth: 2, borderBottomColor: isActive ? C.accent : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <FontAwesome name={tab.icon as any} size={12} color={isActive ? C.accent : C.muted} />
                    <Text style={{ color: isActive ? C.accent : C.muted, fontSize: 13, fontWeight: isActive ? '800' : '600' }}>{tab.label}</Text>
                    {badge !== null && badge > 0 && (
                      <View style={{ backgroundColor: C.accent, borderRadius: 999, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>

              {/* ── TAB: Información ──────────────────────────────────── */}
              {activeTab === 'info' && (
                <View style={{ gap: 20 }}>

                  {/* ISP Bundle callout */}
                  {form.grupoUsuarios === 'ISP_BUNDLE' && (
                    <View style={{ backgroundColor: C.greenSoft, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)', padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <FontAwesome name="wifi" size={16} color={C.green} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: C.green, fontSize: 13, fontWeight: '800', marginBottom: 3 }}>Plan ISP Bundle</Text>
                        <Text style={{ color: C.green, fontSize: 12, opacity: 0.85 }}>Este plan se entrega automáticamente con el servicio de internet LukiPlay. El precio se muestra como "Incluido" para el abonado.</Text>
                      </View>
                    </View>
                  )}

                  {/* Name + Price row */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    <View style={{ flex: 1, minWidth: 240 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Nombre del plan *</Text>
                      <TextInput
                        value={form.nombre}
                        onChangeText={(v) => updateField('nombre', v)}
                        placeholder="Ej: Plan Estándar LukiPlay"
                        placeholderTextColor={C.muted}
                        style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                      />
                    </View>
                    {form.grupoUsuarios !== 'ISP_BUNDLE' && (
                      <View style={{ width: 130 }}>
                        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Precio</Text>
                        <TextInput
                          value={String(form.precio)}
                          onChangeText={(v) => updateNumberField('precio', v)}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={C.muted}
                          style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                        />
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  <View>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Descripción comercial *</Text>
                    <TextInput
                      value={form.descripcion}
                      onChangeText={(v) => updateField('descripcion', v)}
                      placeholder="Resume el valor del plan y el contenido que habilita."
                      placeholderTextColor={C.muted}
                      multiline numberOfLines={3}
                      style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 92, textAlignVertical: 'top', ...webInput }}
                    />
                  </View>

                  {/* Segmentation */}
                  <View>
                    <SectionTitle>Segmentación comercial</SectionTitle>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {GROUP_OPTIONS.map((opt) => (
                        <ToggleChip key={opt.value} active={form.grupoUsuarios === opt.value} label={opt.label} tone={opt.tone} onPress={() => updateField('grupoUsuarios', opt.value)} />
                      ))}
                    </View>
                  </View>

                  {/* Numeric fields */}
                  <View>
                    <SectionTitle>Límites del plan</SectionTitle>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                      {([
                        { key: 'duracionDias',        label: 'Duración (días)',       min: 1   },
                        { key: 'maxDevices',           label: `Máx. dispositivos (mín. ${MIN_DEVICES})`, min: MIN_DEVICES },
                        { key: 'maxConcurrentStreams', label: 'Streams simultáneos',   min: 1   },
                        { key: 'maxProfiles',          label: 'Perfiles de usuario',   min: 1   },
                        { key: 'trialDays',            label: 'Trial (días)',          min: 0   },
                        { key: 'gracePeriodDays',      label: 'Período de gracia',    min: 0   },
                      ] as const).map((field) => (
                        <View key={field.key} style={{ minWidth: 155, flex: 1 }}>
                          <Text style={{ color: C.text, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{field.label}</Text>
                          <TextInput
                            value={String(form[field.key])}
                            onChangeText={(v) => updateNumberField(field.key, v)}
                            keyboardType="numeric"
                            placeholder={String(field.min)}
                            placeholderTextColor={C.muted}
                            style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                          />
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Video quality */}
                  <View>
                    <SectionTitle>Calidad de video</SectionTitle>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {QUALITY_OPTIONS.map((opt) => (
                        <ToggleChip key={opt.value} active={form.videoQuality === opt.value} label={opt.label} onPress={() => updateField('videoQuality', opt.value)} tone="cyan" />
                      ))}
                    </View>
                  </View>

                  {/* Boolean toggles */}
                  <View style={{ gap: 10 }}>
                    <SectionTitle>Funciones del plan</SectionTitle>
                    <BooleanRow label="Descargas offline" helper="Permitir guardar contenido para ver sin conexión." value={form.allowDownloads} onToggle={() => updateField('allowDownloads', !form.allowDownloads)} />
                    <BooleanRow label="Casting / Airplay" helper="Transmitir a TV o dispositivos compatibles." value={form.allowCasting} onToggle={() => updateField('allowCasting', !form.allowCasting)} />
                    <BooleanRow label="Anuncios publicitarios" helper="Mostrar publicidad durante la reproducción." value={form.hasAds} onToggle={() => updateField('hasAds', !form.hasAds)} />
                  </View>
                </View>
              )}

              {/* ── TAB: Acceso ───────────────────────────────────────── */}
              {activeTab === 'acceso' && (
                <View style={{ gap: 20 }}>

                  {/* Entitlements */}
                  <View>
                    <SectionTitle>Entitlements de contenido</SectionTitle>
                    <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 12 }}>Define los tipos de contenido habilitados para este plan.</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {ENTITLEMENT_OPTIONS.map((opt) => (
                        <ToggleChip
                          key={opt.value}
                          active={(form.entitlements as string[]).includes(opt.value)}
                          label={opt.label}
                          onPress={() => toggleArray('entitlements', opt.value)}
                          tone="accent"
                        />
                      ))}
                    </View>
                  </View>

                  {/* Categories */}
                  <View>
                    <SectionTitle>Categorías visibles</SectionTitle>
                    <Text style={{ color: C.textDim, fontSize: 12, marginBottom: 12 }}>
                      El abonado solo verá el contenido perteneciente a estas categorías.
                      {categorias.length === 0 && ' — Crea categorías en el módulo de Categorías primero.'}
                    </Text>
                    {categorias.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {categorias.map((cat) => (
                          <ToggleChip
                            key={cat.id}
                            active={form.allowedCategoryIds.includes(cat.id)}
                            label={cat.nombre}
                            onPress={() => toggleArray('allowedCategoryIds', cat.id)}
                            tone="cyan"
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={{ backgroundColor: C.lift, borderRadius: 12, padding: 20, alignItems: 'center' }}>
                        <FontAwesome name="tag" size={24} color={C.muted} />
                        <Text style={{ color: C.muted, fontSize: 13, marginTop: 10 }}>No hay categorías activas</Text>
                      </View>
                    )}
                  </View>

                  {/* Plan state */}
                  <View>
                    <SectionTitle>Estado del plan</SectionTitle>
                    <BooleanRow label="Plan activo" helper="Solo los planes activos son asignables a abonados." value={form.activo} onToggle={() => updateField('activo', !form.activo)} />
                  </View>
                </View>
              )}

              {/* ── TAB: Canales ──────────────────────────────────────── */}
              {activeTab === 'canales' && (
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <View>
                      <SectionTitle>Canales incluidos en el plan</SectionTitle>
                      <Text style={{ color: C.textDim, fontSize: 12, marginTop: -6 }}>
                        Seleccionados: <Text style={{ color: C.accent, fontWeight: '700' }}>{selectedChannelCount}</Text> / {channels.length}
                      </Text>
                    </View>
                    {selectedChannelCount > 0 && (
                      <TouchableOpacity
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.roseSoft, borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }}
                        onPress={() => updateField('allowedChannelIds', [])}
                      >
                        <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>Limpiar selección</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {channels.length === 0 ? (
                    <View style={{ backgroundColor: C.lift, borderRadius: 12, padding: 30, alignItems: 'center' }}>
                      <FontAwesome name="tv" size={32} color={C.muted} />
                      <Text style={{ color: C.muted, fontSize: 14, marginTop: 14, textAlign: 'center' }}>
                        No hay canales disponibles.{'\n'}Crea canales en el módulo de Canales primero.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Search */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, gap: 10 }}>
                        <FontAwesome name="search" size={13} color={C.muted} />
                        <TextInput
                          value={channelSearch}
                          onChangeText={setChannelSearch}
                          placeholder="Buscar canal o categoría..."
                          placeholderTextColor={C.muted}
                          style={{ flex: 1, color: C.text, paddingVertical: 12, fontSize: 14, ...webInput }}
                        />
                        {channelSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setChannelSearch('')}>
                            <FontAwesome name="times-circle" size={14} color={C.muted} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Quick-select buttons */}
                      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                        <TouchableOpacity
                          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: C.accentBorder }}
                          onPress={() => updateField('allowedChannelIds', channels.map((c) => c.id))}
                        >
                          <Text style={{ color: C.accentLight, fontSize: 12, fontWeight: '700' }}>Seleccionar todos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)' }}
                          onPress={() => {
                            const activeIds = channels.filter((c) => c.status === 'ACTIVE').map((c) => c.id);
                            updateField('allowedChannelIds', activeIds);
                          }}
                        >
                          <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>Solo activos</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Channel list */}
                      <View>
                        {filteredChannels.length === 0 ? (
                          <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>Sin resultados para "{channelSearch}"</Text>
                        ) : (
                          filteredChannels.map((ch) => (
                            <ChannelRow
                              key={ch.id}
                              channel={ch}
                              selected={(form.allowedChannelIds ?? []).includes(ch.id)}
                              onToggle={() => toggleArray('allowedChannelIds', ch.id)}
                            />
                          ))
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}

              {formError ? (
                <View style={{ backgroundColor: C.roseSoft, borderRadius: 10, padding: 12, marginTop: 16, borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <FontAwesome name="exclamation-triangle" size={13} color={C.rose} />
                  <Text style={{ color: C.rose, fontSize: 13, flex: 1 }}>{formError}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Modal footer */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: C.textDim, fontSize: 12 }}>
                {selectedChannelCount} canal{selectedChannelCount !== 1 ? 'es' : ''} · {form.allowedCategoryIds.length} categoría{form.allowedCategoryIds.length !== 1 ? 's' : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift }} onPress={closeModal}>
                  <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, backgroundColor: C.accent, opacity: saving ? 0.7 : 1, minWidth: 150, alignItems: 'center' }}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={{ color: 'white', fontWeight: '800' }}>{editingId ? 'Guardar cambios' : 'Crear plan'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)', padding: 28 }}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <FontAwesome name="trash" size={22} color={C.rose} />
              </View>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 }}>Eliminar plan</Text>
              <Text style={{ color: C.textDim, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                ¿Eliminar <Text style={{ color: C.text, fontWeight: '700' }}>{deleteConfirm?.nombre}</Text>?{'\n'}Los canales asignados perderán este plan de acceso.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift, alignItems: 'center' }} onPress={() => setDeleteConfirm(null)}>
                <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 13, borderRadius: 10, backgroundColor: C.rose, alignItems: 'center' }} onPress={confirmDelete}>
                <Text style={{ color: 'white', fontWeight: '800' }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CmsShell>
  );
}
