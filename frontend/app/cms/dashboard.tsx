import React, { useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import CmsShell from '../../components/cms/CmsShell';
import StatsCard from '../../components/cms/dashboard/StatsCard';
import LiveChannels from '../../components/cms/dashboard/LiveChannels';
import RecentContent from '../../components/cms/dashboard/RecentContent';
import QuickActions from '../../components/cms/dashboard/QuickActions';

const STAT_CARDS = [
  {
    label:         'Abonados activos',
    value:         '12,847',
    trend:         '↑ 4.2% este mes',
    trendPositive: true,
    icon:          'users'        as const,
    color:         '#17D1C6',
    data:          [60, 65, 58, 72, 80, 75, 88, 95, 90, 100],
  },
  {
    label:         'Streams en vivo',
    value:         '3,291',
    trend:         '↑ 12.8% este mes',
    trendPositive: true,
    icon:          'play-circle'  as const,
    color:         '#1E96FC',
    data:          [40, 52, 48, 61, 70, 65, 80, 75, 88, 95],
  },
  {
    label:         'Ingresos (mes)',
    value:         '$48,320',
    trend:         '↑ 8.5% vs anterior',
    trendPositive: true,
    icon:          'dollar'       as const,
    color:         '#FFB800',
    data:          [70, 68, 75, 80, 85, 78, 90, 88, 92, 100],
  },
  {
    label:         'Tasa de churn',
    value:         '2.1%',
    trend:         '↓ 0.3% (positivo)',
    trendPositive: true,
    icon:          'line-chart'   as const,
    color:         '#D1105A',
    data:          [45, 50, 42, 38, 35, 40, 30, 28, 25, 22],
  },
];

// Inner component — rendered inside CmsShell's ThemeProvider
function DashboardContent({ roleLabel, email }: { roleLabel: string; email: string }) {

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const displayName = email.split('@')[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FAF6E7' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado contextual */}
      <View style={{ marginBottom: 28 }}>
        <Text
          style={{
            color: '#240046',
            fontSize: 22,
            fontWeight: '700',
            fontFamily: 'Montserrat-SemiBold',
            marginBottom: 4,
          }}
        >
          {greeting}, {displayName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: 'rgba(36,0,70,0.45)', fontSize: 13, fontFamily: 'Montserrat-Regular' }}>
            {roleLabel}
          </Text>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(36,0,70,0.25)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#17D1C6' }} />
            <Text style={{ color: 'rgba(36,0,70,0.55)', fontSize: 13, fontFamily: 'Montserrat-Regular' }}>
              Plataforma activa
            </Text>
          </View>
        </View>
      </View>

      {/* Métricas */}
      <View style={{ marginBottom: 28 }}>
        <Text
          style={{
            color: 'rgba(36,0,70,0.55)',
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 14,
            fontFamily: 'Montserrat-SemiBold',
          }}
        >
          Resumen del mes
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {STAT_CARDS.map((card) => (
            <StatsCard key={card.label} {...card} />
          ))}
        </View>
      </View>

      {/* En tiempo real */}
      <View style={{ marginBottom: 28 }}>
        <Text
          style={{
            color: 'rgba(36,0,70,0.55)',
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 14,
            fontFamily: 'Montserrat-SemiBold',
          }}
        >
          Actividad reciente
        </Text>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flex: 1.4, minWidth: 280 }}>
            <LiveChannels />
          </View>
          <View style={{ flex: 1, minWidth: 240 }}>
            <RecentContent />
          </View>
        </View>
      </View>

      {/* Accesos directos */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            color: 'rgba(36,0,70,0.55)',
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 14,
            fontFamily: 'Montserrat-SemiBold',
          }}
        >
          Accesos directos
        </Text>
        <QuickActions />
      </View>
    </ScrollView>
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
    profile.role?.toLowerCase() === 'superadmin' ? 'Super Admin'
    : profile.role?.toLowerCase() === 'soporte'  ? 'Soporte Técnico'
    : profile.role ?? 'Admin';

  return (
    <CmsShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <View style={{ flex: 1, backgroundColor: '#FAF6E7', margin: -28 }}>
        <DashboardContent roleLabel={roleLabel} email={profile.email} />
      </View>
    </CmsShell>
  );
}
