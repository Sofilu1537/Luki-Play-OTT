import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminListSliders, AdminSlider } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsSliders() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [sliders, setSliders] = useState<AdminSlider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListSliders(accessToken).then(setSliders).finally(() => setLoading(false));
  }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Sliders' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>Sliders / Banners</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <FontAwesome name="plus" size={13} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Nuevo Slider</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Table header */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.lift, borderRadius: 8 }}>
              {['ORDEN', 'IMAGEN', 'TÍTULO', 'SUBTÍTULO', 'ESTADO', 'ACCIONES'].map((h) => (
                <Text key={h} style={{ color: C.muted, fontSize: 10, fontWeight: '700', flex: h === 'IMAGEN' ? 0.8 : h === 'TÍTULO' || h === 'SUBTÍTULO' ? 2 : 1, letterSpacing: 0.4 }}>
                  {h}
                </Text>
              ))}
            </View>

            {sliders.map((s) => (
              <View
                key={s.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.surface,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <View style={{ flex: 1, width: 32, height: 32, backgroundColor: C.accentSoft, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: C.accentLight, fontWeight: '800', fontSize: 14 }}>{s.orden}</Text>
                </View>
                <View style={{ flex: 0.8 }}>
                  <View style={{ width: 80, height: 44, backgroundColor: C.lift, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome name="image" size={20} color={C.muted} />
                  </View>
                </View>
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '600', flex: 2 }} numberOfLines={1}>{s.titulo}</Text>
                <Text style={{ color: C.textDim, fontSize: 12, flex: 2 }} numberOfLines={1}>{s.subtitulo}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: s.activo ? C.greenSoft : C.roseSoft, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                    <Text style={{ color: s.activo ? C.green : C.rose, fontSize: 11, fontWeight: '700' }}>
                      {s.activo ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(34,211,238,0.24)' }}>
                    <FontAwesome name="pencil" size={12} color={C.cyan} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: C.roseSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)' }}>
                    <FontAwesome name="trash" size={12} color={C.rose} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </CmsShell>
  );
}
