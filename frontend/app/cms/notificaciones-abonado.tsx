import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function NotificacionesAbonadoPage() {
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
          backgroundColor: `${C.green}18`,
          borderWidth: 1,
          borderColor: `${C.green}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="comment" size={26} color={C.green} />
        </View>
        <View style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 }}>
            EJEMPLOS DE NOTIFICACIONES
          </Text>
          {examples.map((e, i) => (
            <View key={i} style={{
              backgroundColor: C.surface,
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
              <FontAwesome name="comment-o" size={13} color={C.green} />
              <Text style={{ color: C.textSec, fontSize: 13, fontStyle: 'italic', flex: 1 }}>{e}</Text>
            </View>
          ))}
        </View>

        <View style={{
          backgroundColor: C.surface,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: C.border,
        }}>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            EN DESARROLLO
          </Text>
        </View>
      </ScrollView>
    </CmsShell>
  );
}
