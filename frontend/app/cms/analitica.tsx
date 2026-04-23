import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function AnaliticaPage() {
  const { isDark } = useTheme();
  const metrics = [
    { icon: 'eye' as const,       label: 'Canales más vistos',                   color: C.accent },
    { icon: 'clock-o' as const,   label: 'Horas pico de conexión',               color: C.cyan },
    { icon: 'line-chart' as const, label: 'Tasa de retención por plan',           color: C.green },
    { icon: 'users' as const,      label: 'Usuarios activos vs inactivos (7/30d)', color: C.amber },
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Analítica' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingTop: 60, padding: 40 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: `${C.cyan}18`,
          borderWidth: 1,
          borderColor: `${C.cyan}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="line-chart" size={26} color={C.cyan} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 560, marginBottom: 36 }}>
          {metrics.map((m) => (
            <View key={m.label} style={{
              backgroundColor: isDark ? C.surface : 'rgba(255,255,255,0.92)',
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? C.border : 'rgba(130,130,130,0.34)',
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
              <Text style={{ color: isDark ? C.textSec : '#240046', fontSize: 12, textAlign: 'center', fontWeight: '500', lineHeight: 18 }}>
                {m.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{
          marginTop: 36,
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
