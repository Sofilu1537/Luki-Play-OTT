import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function NotificacionesAdminPage() {
  const { theme } = useTheme();
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
          backgroundColor: `${theme.warning}18`,
          borderWidth: 1,
          borderColor: `${theme.warning}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="bell" size={28} color={theme.warning} />
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
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.warning, marginTop: 5 }} />
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
