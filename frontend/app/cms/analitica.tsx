import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function AnaliticaPage() {
  const { theme } = useTheme();
  const metrics = [
    { icon: 'eye' as const,       label: 'Canales más vistos',                    color: theme.accent  },
    { icon: 'clock-o' as const,   label: 'Horas pico de conexión',               color: theme.success },
    { icon: 'line-chart' as const, label: 'Tasa de retención por plan',           color: theme.success },
    { icon: 'users' as const,      label: 'Usuarios activos vs inactivos (7/30d)', color: theme.warning },
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Analítica' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingTop: 60, padding: 40 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: `${theme.success}18`,
          borderWidth: 1,
          borderColor: `${theme.success}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="line-chart" size={26} color={theme.success} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 560, marginBottom: 36 }}>
          {metrics.map((m) => (
            <View key={m.label} style={{
              backgroundColor: theme.cardBg,
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: 'center',
              width: 220,
              gap: 10,
            }}>
              <View style={{
                width: 42, height: 42,
                borderRadius: 12,
                backgroundColor: `${m.color}18`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FontAwesome name={m.icon} size={16} color={m.color} />
              </View>
              <Text style={{ color: theme.textSec, fontSize: 12, textAlign: 'center', fontWeight: '500', lineHeight: 18 }}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>


      </ScrollView>
    </CmsShell>
  );
}
