import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';

export default function NotificacionesAbonadoPage() {
  const { theme } = useTheme();
  const examples = [
    '"Tu plan vence en X días"',
    '"Nuevo contenido disponible en tu canal"',
    '"Tu sesión fue iniciada desde un nuevo dispositivo"',
    '"Tu plan ha sido renovado exitosamente"',
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Notific. Abonado' }]}>
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
          <FontAwesome name="comment" size={26} color={theme.success} />
        </View>
        <View style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}>
          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 }}>
            EJEMPLOS DE NOTIFICACIONES
          </Text>
          {examples.map((e, i) => (
            <View key={i} style={{
              backgroundColor: theme.cardBg,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
              <FontAwesome name="comment-o" size={13} color={theme.success} />
              <Text style={{ color: theme.textSec, fontSize: 13, fontStyle: 'italic', flex: 1 }}>{e}</Text>
            </View>
          ))}
        </View>


      </ScrollView>
    </CmsShell>
  );
}
