import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function NotificacionesAdminPage() {
  const { isDark } = useTheme();
  const features = [
    'Alertas por exceso de dispositivos por usuario',
    'Planes próximos a vencer o ya vencidos',
    'Sesiones simultáneas sospechosas',
    'Nuevos usuarios registrados',
    'Historial con filtros por fecha, tipo y estado',
    'Envío de alertas al correo del administrador',
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Notificaciones Admin' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', padding: 40, paddingTop: 60 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: `${C.amber}18`,
          borderWidth: 1,
          borderColor: `${C.amber}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="bell" size={28} color={C.amber} />
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
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber, marginTop: 5 }} />
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
