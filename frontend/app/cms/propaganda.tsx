import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function PropagandaPage() {
  const { isDark } = useTheme();
  const features = [
    'Programación con fecha y hora de activación/desactivación automática',
    'Segmentación por plan contratado, canal o categoría',
    'Activación sin intervención manual del administrador',
    'Vista previa antes de publicar',
    'Estadísticas de impresiones por campaña',
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Propaganda' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingTop: 60, padding: 40 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: `${C.rose}18`,
          borderWidth: 1,
          borderColor: `${C.rose}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="bullhorn" size={26} color={C.rose} />
        </View>

        <View style={{ width: '100%', maxWidth: 480, marginBottom: 32 }}>
          {features.map((f, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: i < features.length - 1 ? 1 : 0,
              borderBottomColor: isDark ? C.border : 'rgba(130,130,130,0.26)',
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.rose, marginTop: 5 }} />
              <Text style={{ color: isDark ? C.textSec : '#240046', fontSize: 13, flex: 1, lineHeight: 20 }}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={{
          marginTop: 32,
          backgroundColor: isDark ? C.surface : 'rgba(255,255,255,0.92)',
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: isDark ? C.border : 'rgba(130,130,130,0.34)',
        }}>
            <Text style={{ color: isDark ? C.muted : '#240046', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            EN DESARROLLO
          </Text>
        </View>
      </ScrollView>
    </CmsShell>
  );
}
