import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function PropagandaPage() {
  const { theme } = useTheme();
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
          backgroundColor: `${theme.danger}18`,
          borderWidth: 1,
          borderColor: `${theme.danger}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="bullhorn" size={26} color={theme.danger} />
        </View>

        <View style={{ width: '100%', maxWidth: 480, marginBottom: 32 }}>
          {features.map((f, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: i < features.length - 1 ? 1 : 0,
              borderBottomColor: theme.border,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.danger, marginTop: 5 }} />
              <Text style={{ color: theme.textSec, fontSize: 13, flex: 1, lineHeight: 20 }}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={{
          marginTop: 32,
          backgroundColor: theme.cardBg,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            EN DESARROLLO
          </Text>
        </View>
      </ScrollView>
    </CmsShell>
  );
}
