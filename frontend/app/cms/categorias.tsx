import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListCategorias, AdminCategoria } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsCategorias() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [cats, setCats] = useState<AdminCategoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListCategorias(accessToken).then(setCats).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Categorías' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Categorías</Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nueva Categoría</Text>
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
              {['NOMBRE', 'DESCRIPCIÓN', 'ESTADO', 'ACCIONES'].map((h, i) => (
                <Text key={h} style={{ color: C.muted, fontSize: 10, fontWeight: '700', flex: [1, 2.5, 1, 0.8][i], letterSpacing: 0.4 }}>
                  {h}
                </Text>
              ))}
            </View>

            {cats.map((cat) => (
              <View
                key={cat.id}
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
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 32, height: 32, backgroundColor: `${C.accent}33`, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name={(cat.icono as React.ComponentProps<typeof FontAwesome>['name']) || 'tag'} size={14} color={C.accentLight} />
                  </View>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{cat.nombre}</Text>
                </View>
                <Text style={{ color: C.textDim, fontSize: 12, flex: 2.5 }} numberOfLines={1}>{cat.descripcion}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: cat.activo ? '#14532D' : '#3F1515', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                    <Text style={{ color: cat.activo ? '#4ADE80' : '#F87171', fontSize: 11, fontWeight: '700' }}>
                      {cat.activo ? 'ACTIVO' : 'INACTIVO'}
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
