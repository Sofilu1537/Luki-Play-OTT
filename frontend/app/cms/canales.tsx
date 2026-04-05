import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListCanales, AdminCanal } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

const CAT_COLORS: Record<string, string> = {
  Noticias: '#0EA5E9', Deportes: '#10B981', Cine: '#F59E0B',
  Infantil: '#EC4899', Música: '#8B5CF6', General: '#64748B',
};

export default function CmsCanales() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [canales, setCanales] = useState<AdminCanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListCanales(accessToken).then(setCanales).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  const filtered = canales.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || c.categoria.toLowerCase().includes(q);
  });

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <CmsShell breadcrumbs={[{ label: 'Canales' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>Canales</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{canales.length} canales registrados</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Canal</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 20 }}>
          <FontAwesome name="search" size={13} color={C.muted} />
          <TextInput
            style={{ flex: 1, color: C.text, paddingVertical: 10, paddingHorizontal: 10, fontSize: 13, ...webInput }}
            placeholder="Buscar canal o categoría..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {filtered.map((canal) => {
              const color = CAT_COLORS[canal.categoria] ?? '#64748B';
              return (
                <View
                  key={canal.id}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 12,
                    padding: 18,
                    borderWidth: 1,
                    borderColor: C.border,
                    minWidth: 200,
                    flex: 1,
                    maxWidth: 280,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, backgroundColor: `${color}22`, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                      <FontAwesome name="tv" size={20} color={color} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(34,211,238,0.24)' }}>
                        <FontAwesome name="pencil" size={11} color={C.cyan} />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }}>
                        <FontAwesome name="trash" size={11} color={C.rose} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>{canal.nombre}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <View style={{ backgroundColor: `${color}22`, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{canal.categoria}</Text>
                    </View>
                    <View style={{ backgroundColor: canal.activo ? C.greenSoft : C.roseSoft, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: canal.activo ? C.green : C.rose, fontSize: 10, fontWeight: '700' }}>
                        {canal.activo ? 'ACTIVO' : 'INACTIVO'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 10 }} numberOfLines={1}>{canal.streamUrl}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </CmsShell>
  );
}
