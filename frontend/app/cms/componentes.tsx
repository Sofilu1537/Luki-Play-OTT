import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function ComponentesPage() {
  return (
    <CmsShell breadcrumbs={[{ label: 'Componentes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
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
          <FontAwesome name="th-large" size={28} color={C.accentLight} />
        </View>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 }}>
          Componentes
        </Text>
        <Text style={{ color: C.textSec, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 22 }}>
          Gestión de componentes visuales del frontend OTT.{'\n'}Este módulo estará disponible próximamente.
        </Text>
        <View style={{
          marginTop: 28,
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
