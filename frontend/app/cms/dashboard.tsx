import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { LinearGradient } from 'expo-linear-gradient';

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.8, duration: 1100, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity, scale]);

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: C.success,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: C.success }} />
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  trend: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        backgroundColor: C.surface,
        borderRadius: 22,
        padding: 24,
        borderWidth: 1,
        borderColor: C.border,
        margin: 6,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: color,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', maxWidth: '70%' }}>
          {label}
        </Text>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name={icon} size={18} color={color} />
        </View>
      </View>
      <Text style={{ color: C.text, fontSize: 38, fontWeight: '900', marginBottom: 8 }}>{value}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{trend}</Text>
    </View>
  );
}

export default function CmsDashboard() {
  const { profile } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!profile) return null;

  const roleLabel =
    profile.role === 'SUPERADMIN' ? 'Super Admin'
    : profile.role === 'SOPORTE' ? 'Soporte Técnico'
    : profile.role;

  return (
    <CmsShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, gap: 28 }}>
        <LinearGradient
          colors={['rgba(255,184,0,0.18)', 'rgba(123,47,190,0.14)', 'rgba(255,255,255,0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 30,
            padding: 28,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ maxWidth: 720 }}>
              <Text style={{ color: C.text, fontSize: 30, fontWeight: '900', marginBottom: 8 }}>
                Bienvenido al centro de control
              </Text>
              <Text style={{ color: C.textDim, fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
                Panel central de Luki Play. Monitoreo, contenido y operaciones en una sola vista.
              </Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>
                {profile.email} · {roleLabel}
              </Text>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          <StatCard label="Usuarios registrados" value="20" icon="users" color={C.accent} trend="↑ 12% este mes" />
          <StatCard label="Abonados activos" value="16" icon="play-circle" color={C.cyan} trend="↑ 8% este mes" />
          <StatCard label="Canales activos" value="4" icon="tv" color={C.success} trend="↑ 3% estabilidad" />
          <StatCard label="Planes disponibles" value="4" icon="star" color={C.amber} trend="↑ 1 nuevo ajuste" />
        </View>

        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: C.border,
            padding: 24,
          }}
        >
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 18 }}>Estado del sistema</Text>
          {[
            { label: 'API Backend', uptime: '99.9% uptime' },
            { label: 'Autenticación', uptime: '99.98% uptime' },
            { label: 'Base de datos', uptime: '99.95% uptime' },
            { label: 'Streaming', uptime: '99.7% uptime' },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: C.surfaceAlt,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: C.textDim, fontSize: 13 }}>{item.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <PulseDot />
                <Text style={{ color: C.success, fontSize: 11, fontWeight: '800' }}>{item.uptime}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </CmsShell>
  );
}
