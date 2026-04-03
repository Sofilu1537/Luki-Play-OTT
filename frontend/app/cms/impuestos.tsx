import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListImpuestos, AdminImpuesto } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsImpuestos() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [items, setItems] = useState<AdminImpuesto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListImpuestos(accessToken).then(setItems).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Impuestos' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Impuestos y Tasas</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Impuesto</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <>
            {/* Table header */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0D1B2E', borderRadius: 8, marginBottom: 6 }}>
              {[['NOMBRE', 1], ['PORCENTAJE', 1], ['APLICA A', 2], ['ESTADO', 1], ['ACCIONES', 0.8]].map(([h, flex]) => (
                <Text key={String(h)} style={{ color: C.muted, fontSize: 10, fontWeight: '700', flex: Number(flex), letterSpacing: 0.4 }}>
                  {String(h)}
                </Text>
              ))}
            </View>

            {items.map((imp) => (
              <View
                key={imp.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.surface,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: C.border,
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', flex: 1 }}>{imp.nombre}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: `${C.accent}22`, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ color: C.accentLight, fontSize: 14, fontWeight: '900' }}>{imp.porcentaje}%</Text>
                  </View>
                </View>
                <Text style={{ color: C.textDim, fontSize: 12, flex: 2 }}>{imp.aplicaA}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: imp.activo ? '#14532D' : '#3F1515', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                    <Text style={{ color: imp.activo ? '#4ADE80' : '#F87171', fontSize: 11, fontWeight: '700' }}>
                      {imp.activo ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 0.8, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="pencil" size={12} color="#60A5FA" />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#3F1515', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="trash" size={12} color="#F87171" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </CmsShell>
  );
}
