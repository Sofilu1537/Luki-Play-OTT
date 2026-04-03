import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C, NAV_ITEMS } from '../../components/cms/CmsShell';

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: C.border,
        margin: 6,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${color}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', marginBottom: 4 }}>{value}</Text>
      <Text style={{ color: C.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export default function CmsDashboard() {
  const { profile } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  if (!profile) return null;

  const roleLabel =
    profile.role === 'SUPERADMIN' ? 'Super Admin'
    : profile.role === 'SOPORTE' ? 'Soporte Técnico'
    : profile.role;

  return (
    <CmsShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Welcome */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
              Bienvenido al Panel de Control
            </Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              {profile.email} · {roleLabel}
            </Text>
          </View>
          {profile.role === 'SUPERADMIN' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: `${C.accent}22`,
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: `${C.accent}55`,
              }}
            >
              <FontAwesome name="shield" size={14} color={C.accentLight} />
              <Text style={{ color: C.accentLight, fontSize: 12, fontWeight: '700' }}>SUPERADMIN</Text>
            </View>
          )}
        </View>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 28 }}>
          <StatCard label="Usuarios registrados" value="20" icon="users"     color="#5B5BD6" />
          <StatCard label="Contratos activos"    value="16" icon="file-text" color="#0EA5E9" />
          <StatCard label="Canales activos"      value="4"  icon="tv"        color="#10B981" />
          <StatCard label="Planes disponibles"   value="4"  icon="star"      color="#F59E0B" />
        </View>

        {/* Quick nav */}
        <Text style={{ color: C.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>
          Accesos rápidos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {NAV_ITEMS.filter((i) => i.path !== '/cms/dashboard').map((item) => (
            <TouchableOpacity
              key={item.path}
              style={{
                backgroundColor: C.surface,
                borderRadius: 12,
                padding: 18,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                minWidth: 110,
                gap: 8,
              }}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome name={item.icon} size={22} color={C.accent} />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{item.label}</Text>
              {item.badge && (
                <View style={{ backgroundColor: '#1E3A5F', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#60A5FA', fontSize: 9, fontWeight: '700' }}>NEW</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </CmsShell>
  );
}
