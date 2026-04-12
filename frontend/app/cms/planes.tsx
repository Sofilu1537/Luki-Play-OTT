import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminCreatePlan,
  adminDeletePlan,
  adminListPlans,
  adminTogglePlan,
  adminUpdatePlan,
  AdminPlan,
  AdminPlanPayload,
} from '../../services/api/adminApi';
import { useCategoriasStore } from '../../services/categoriasStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

const GROUP_OPTIONS: Array<{ value: AdminPlan['grupoUsuarios']; label: string }> = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'FAMILIAR', label: 'Familiar' },
];


function buildEmptyPlan(): AdminPlanPayload {
  return {
    nombre: '',
    descripcion: '',
    grupoUsuarios: 'INDIVIDUAL',
    precio: 0,
    moneda: 'USD',
    duracionDias: 30,
    activo: true,
    maxDevices: 1,
    maxConcurrentStreams: 1,
    maxProfiles: 1,
    videoQuality: 'HD',
    allowDownloads: false,
    allowCasting: true,
    hasAds: false,
    trialDays: 0,
    gracePeriodDays: 0,
    entitlements: [],
    allowedComponentIds: [],
    allowedCategoryIds: [],
  };
}

function metricLabel(group: AdminPlan['grupoUsuarios']) {
  return GROUP_OPTIONS.find((option) => option.value === group)?.label ?? group;
}

function ToggleChip({
  active,
  label,
  onPress,
  tone = 'accent',
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  tone?: 'accent' | 'green' | 'cyan';
}) {
  const palette =
    tone === 'green'
      ? { bg: C.greenSoft, border: 'rgba(16,185,129,0.28)', text: C.green }
      : tone === 'cyan'
        ? { bg: C.cyanSoft, border: 'rgba(180,144,255,0.24)', text: C.cyan }
        : { bg: C.accentSoft, border: C.accentBorder, text: C.accentLight };

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: active ? palette.bg : C.lift,
        borderWidth: 1,
        borderColor: active ? palette.border : C.border,
      }}
      onPress={onPress}
    >
      <Text style={{ color: active ? palette.text : C.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function BooleanRow({
  label,
  helper,
  value,
  onToggle,
}: {
  label: string;
  helper: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: C.lift,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onPress={onToggle}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 3 }}>{label}</Text>
        <Text style={{ color: C.textDim, fontSize: 12 }}>{helper}</Text>
      </View>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          backgroundColor: value ? C.greenSoft : C.roseSoft,
          borderWidth: 1,
          borderColor: value ? 'rgba(16,185,129,0.28)' : 'rgba(244,63,94,0.28)',
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            backgroundColor: value ? C.green : C.rose,
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function CmsPlanes() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const allCategorias = useCategoriasStore((s) => s.categorias);
  const categorias = allCategorias.filter((c) => c.activo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminPlanPayload>(buildEmptyPlan());
  const [formError, setFormError] = useState('');

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    adminListPlans(accessToken)
      .then((plansData) => {
        setPlans(plansData);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  const activePlans = plans.filter((plan) => plan.activo).length;
  const avgDevices = plans.length > 0 ? Math.round(plans.reduce((sum, plan) => sum + plan.maxDevices, 0) / plans.length) : 0;

  function updateField<K extends keyof AdminPlanPayload>(field: K, value: AdminPlanPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateNumberField(
    field: 'precio' | 'duracionDias' | 'maxDevices' | 'maxConcurrentStreams' | 'maxProfiles' | 'trialDays' | 'gracePeriodDays',
    value: string,
  ) {
    const parsed = Number(value.replace(',', '.'));
    updateField(field, Number.isFinite(parsed) ? parsed : 0);
  }

  function toggleFromArray(field: 'entitlements' | 'allowedComponentIds' | 'allowedCategoryIds', value: string) {
    setForm((current) => {
      const currentValues = current[field] as string[];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...current, [field]: nextValues };
    });
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(buildEmptyPlan());
    setFormError('');
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
    });
    setFormError('');
    setModalVisible(true);
  }

  function closeModal() {
    if (saving) return;
    setModalVisible(false);
    setEditingId(null);
    setForm(buildEmptyPlan());
    setFormError('');
  }

  async function refreshPlans() {
    if (!accessToken) return;
    const data = await adminListPlans(accessToken);
    setPlans(data);
  }

  async function handleSave() {
    if (!accessToken) return;
    if (!form.nombre.trim() || !form.descripcion.trim()) {
      setFormError('Nombre y descripción son requeridos.');
      return;
    }
    if (form.maxDevices < 1 || form.maxConcurrentStreams < 1 || form.maxProfiles < 1) {
      setFormError('Dispositivos, streams y perfiles deben ser mayores a cero.');
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
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el plan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(plan: AdminPlan) {
    if (!accessToken) return;
    await adminTogglePlan(accessToken, plan.id);
    await refreshPlans();
  }

  async function handleDelete(plan: AdminPlan) {
    if (!accessToken) return;
    await adminDeletePlan(accessToken, plan.id);
    await refreshPlans();
  }

  return (
    <CmsShell breadcrumbs={[{ label: 'Planes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <View>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Planes OTT</Text>
            <Text style={{ color: C.textDim, fontSize: 13 }}>Configura perfil comercial, acceso, entitlements y contenido visible por plan.</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
            onPress={openCreateModal}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Crear plan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Planes totales', value: String(plans.length), color: C.accent },
            { label: 'Activos', value: String(activePlans), color: C.green },
            { label: 'Disp. promedio', value: String(avgDevices), color: C.cyan },
          ].map((item) => (
            <View key={item.label} style={{ minWidth: 160, flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18 }}>
              <Text style={{ color: C.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</Text>
              <Text style={{ color: item.color, fontSize: 28, fontWeight: '900' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {plans.map((plan) => (
              <View
                key={plan.id}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: plan.activo ? C.accentBorder : C.border,
                  minWidth: 280,
                  flex: 1,
                  maxWidth: 360,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 }}>
                    <View style={{ backgroundColor: plan.activo ? C.accentSoft : C.lift, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: plan.activo ? C.accentBorder : C.border }}>
                      <Text style={{ color: plan.activo ? C.accentLight : C.muted, fontSize: 11, fontWeight: '700' }}>
                        {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: C.cyanSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(180,144,255,0.24)' }}>
                      <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700' }}>{metricLabel(plan.grupoUsuarios)}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(180,144,255,0.24)' }} onPress={() => openEditModal(plan)}>
                      <FontAwesome name="pencil" size={12} color={C.cyan} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }} onPress={() => handleDelete(plan)}>
                      <FontAwesome name="trash" size={12} color={C.rose} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>{plan.nombre}</Text>
                <Text style={{ color: C.textDim, fontSize: 13, lineHeight: 20, marginBottom: 18 }}>{plan.descripcion}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                  <Text style={{ color: C.accent, fontSize: 30, fontWeight: '900' }}>{plan.precio === 0 ? 'Gratis' : `$${plan.precio.toFixed(2)}`}</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '600' }}>{plan.moneda} / {plan.duracionDias} días</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: 'mobile' as const,      text: `${plan.maxDevices} disp.` },
                    { icon: 'play-circle' as const,  text: `${plan.maxConcurrentStreams} streams` },
                    { icon: 'users' as const,         text: `${plan.maxProfiles} perfiles` },
                  ].map((item) => (
                    <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.lift, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border }}>
                      <FontAwesome name={item.icon} size={11} color={C.accentLight} />
                      <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>{item.text}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: plan.activo ? C.greenSoft : C.accentSoft,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: plan.activo ? 'rgba(16,185,129,0.28)' : C.accentBorder,
                  }}
                  onPress={() => handleToggle(plan)}
                >
                  <Text style={{ color: plan.activo ? C.green : C.accentLight, fontWeight: '800', fontSize: 12 }}>
                    {plan.activo ? 'Desactivar plan' : 'Activar plan'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 960, maxHeight: '90%', backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{editingId ? 'Editar plan' : 'Crear plan'}</Text>
                <Text style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>Define acceso comercial, técnico y de contenido del plan OTT.</Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <FontAwesome name="times" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
                <View style={{ flex: 1, minWidth: 280 }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Nombre del plan</Text>
                  <TextInput
                    value={form.nombre}
                    onChangeText={(value) => updateField('nombre', value)}
                    placeholder="Ej: Premium Hogar"
                    placeholderTextColor={C.muted}
                    style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                  />
                </View>
                <View style={{ width: 170 }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Precio</Text>
                  <TextInput
                    value={String(form.precio)}
                    onChangeText={(value) => updateNumberField('precio', value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                  />
                </View>
              </View>

              <View style={{ marginBottom: 22 }}>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>Descripción comercial</Text>
                <TextInput
                  value={form.descripcion}
                  onChangeText={(value) => updateField('descripcion', value)}
                  placeholder="Resume el valor del plan y el contenido que habilita."
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={3}
                  style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 92, textAlignVertical: 'top', ...webInput }}
                />
              </View>

              <View style={{ marginBottom: 22 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Segmentación comercial</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {GROUP_OPTIONS.map((option) => (
                    <ToggleChip key={option.value} active={form.grupoUsuarios === option.value} label={option.label} onPress={() => updateField('grupoUsuarios', option.value)} />
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
                {[
                  { key: 'duracionDias', label: 'Duración (días)', value: String(form.duracionDias) },
                  { key: 'maxDevices', label: 'Máx. dispositivos', value: String(form.maxDevices) },
                  { key: 'maxConcurrentStreams', label: 'Streams simultáneos', value: String(form.maxConcurrentStreams) },
                  { key: 'maxProfiles', label: 'Perfiles', value: String(form.maxProfiles) },
                  { key: 'trialDays', label: 'Trial (días)', value: String(form.trialDays) },
                  { key: 'gracePeriodDays', label: 'Gracia (días)', value: String(form.gracePeriodDays) },
                ].map((field) => (
                  <View key={field.key} style={{ minWidth: 150, flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{field.label}</Text>
                    <TextInput
                      value={field.value}
                      onChangeText={(value) => updateNumberField(field.key as 'duracionDias' | 'maxDevices' | 'maxConcurrentStreams' | 'maxProfiles' | 'trialDays' | 'gracePeriodDays', value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.muted}
                      style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, ...webInput }}
                    />
                  </View>
                ))}
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>Categorías visibles</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {categorias.map((item) => (
                    <ToggleChip
                      key={item.id}
                      active={form.allowedCategoryIds.includes(item.id)}
                      label={item.nombre}
                      onPress={() => toggleFromArray('allowedCategoryIds', item.id)}
                      tone="cyan"
                    />
                  ))}
                </View>
              </View>

              {formError ? <Text style={{ color: C.rose, fontSize: 13, marginTop: 16 }}>{formError}</Text> : null}
            </ScrollView>

            <View style={{ paddingHorizontal: 24, paddingVertical: 18, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift }} onPress={closeModal}>
                <Text style={{ color: C.textDim, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: C.accent, opacity: saving ? 0.7 : 1, minWidth: 140, alignItems: 'center' }} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={{ color: 'white', fontWeight: '800' }}>{editingId ? 'Guardar cambios' : 'Crear plan'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CmsShell>
  );
}
