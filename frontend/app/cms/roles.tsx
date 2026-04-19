import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function RolesPage() {
  const roleItems = [
    { icon: 'user-secret' as const, label: 'Super Administrador', color: C.accent },
    { icon: 'user' as const,        label: 'Administrador',        color: C.cyan },
    { icon: 'eye' as const,         label: 'Operador',             color: C.green },
    { icon: 'lock' as const,        label: 'Solo Lectura',         color: C.muted },
  ];

  return (
    <CmsShell breadcrumbs={[{ label: 'Roles' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingTop: 60, padding: 40 }}>
        <View style={{
          width: 72, height: 72,
          borderRadius: 20,
          backgroundColor: `${C.accent}18`,
          borderWidth: 1,
          borderColor: `${C.accent}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <FontAwesome name="shield" size={26} color={C.accent} />
        </View>
        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 }}>
          Roles
        </Text>
        <Text style={{ color: C.textSec, fontSize: 14, textAlign: 'center', maxWidth: 400, lineHeight: 22, marginBottom: 36 }}>
          Gestión de roles y permisos para el equipo administrativo del sistema.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 560 }}>
          {roleItems.map((r) => (
            <View key={r.label} style={{
              backgroundColor: C.surface,
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              width: 220,
              gap: 10,
            }}>
              <View style={{
                width: 42, height: 42,
                borderRadius: 12,
                backgroundColor: `${r.color}18`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FontAwesome name={r.icon} size={16} color={r.color} />
              </View>
              <Text style={{ color: C.textSec, fontSize: 12, textAlign: 'center', fontWeight: '500', lineHeight: 18 }}>
                {r.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={{
          marginTop: 36,
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
