import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListPlans, AdminPlan } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsPlanes() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListPlans(accessToken).then(setPlans).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Planes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Planes de Suscripción</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Plan</Text>
          </TouchableOpacity>
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
                  borderColor: plan.activo ? C.accent : C.border,
                  minWidth: 220,
                  flex: 1,
                  maxWidth: 300,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View
                    style={{ backgroundColor: plan.activo ? `${C.accent}33` : '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}
                  >
                    <Text style={{ color: plan.activo ? C.accentLight : C.muted, fontSize: 12, fontWeight: '700' }}>
                      {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesome name="pencil" size={12} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#3F1515', alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesome name="trash" size={12} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>{plan.nombre}</Text>
                <Text style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{plan.descripcion}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <Text style={{ color: C.accent, fontSize: 28, fontWeight: '900' }}>
                    {plan.precio === 0 ? 'Gratis' : `$${plan.precio}`}
                  </Text>
                  {plan.precio > 0 && <Text style={{ color: C.muted, fontSize: 13 }}>{plan.moneda}/mes</Text>}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FontAwesome name="calendar" size={12} color={C.muted} />
                  <Text style={{ color: C.textDim, fontSize: 12 }}>{plan.duracionDias} días de vigencia</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </CmsShell>
  );
}
