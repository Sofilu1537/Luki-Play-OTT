import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function AbonadoPage() {
  const features = [
    'Perfil completo del suscriptor con historial de pagos',
    'Estado de sesiones activas y dispositivos conectados',
    'Plan contratado con fechas de inicio y vencimiento',
    'Número máximo de dispositivos configurable (defecto: 3)',
    'Historial de renovaciones y cambios de plan',
    'Filtro rápido por estado: activo, vencido, por vencer',
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Abonado' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingTop: 60, padding: 40 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: C.accentFaint,
          borderWidth: 1,
          borderColor: C.accentBorder,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="user-circle" size={28} color={C.accentLight} />
        </View>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 }}>
          Abonado
        </Text>
        <Text style={{ color: C.textSec, fontSize: 14, textAlign: 'center', maxWidth: 420, lineHeight: 22, marginBottom: 32 }}>
          Vista detallada del perfil del suscriptor con gestión completa de plan, dispositivos y sesiones.
        </Text>

        <View style={{ width: '100%', maxWidth: 480 }}>
          {features.map((f, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: i < features.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 5 }} />
              <Text style={{ color: C.textSec, fontSize: 13, flex: 1, lineHeight: 20 }}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={{
          marginTop: 32,
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
