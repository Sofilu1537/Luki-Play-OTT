import React, { useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import CmsShell from '../../components/cms/CmsShell';
import { useTheme } from '../../hooks/useTheme';
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
  const { theme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <LinearGradient
        colors={['#240046', '#60269E', '#7303C0']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 28, overflow: 'hidden' }}
      >
        {/* Decorative orbs */}
        <View
          style={{
            position:        'absolute',
            top:             -50,
            right:           -50,
            width:           200,
            height:          200,
            borderRadius:    100,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />
        <View
          style={{
            position:        'absolute',
            bottom:          -30,
            right:           80,
            width:           120,
            height:          120,
            borderRadius:    60,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* FIFA badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View
            style={{
              backgroundColor: 'rgba(255,184,0,0.22)',
              borderRadius:    8,
              paddingHorizontal: 10,
              paddingVertical:   4,
              flexDirection:   'row',
              alignItems:      'center',
              gap:             6,
              borderWidth:     1,
              borderColor:     'rgba(255,184,0,0.35)',
              alignSelf:       'flex-start',
            }}
          >
            <FontAwesome name="bolt" size={9} color="#FFB800" />
            <Text
              style={{
                color:         '#FFB800',
                fontSize:       9,
                fontWeight:    '800',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontFamily:    'Montserrat-SemiBold',
              }}
            >
              FIFA WORLD CUP 2026
            </Text>
          </View>
        </View>

        <Text
          style={{
            color:         '#FAF6E7',
            fontSize:       26,
            fontWeight:    '700',
            letterSpacing: -0.5,
            marginBottom:   8,
            fontFamily:    'Heavitas',
          }}
        >
          Plataforma en preparación
        </Text>
        <Text
          style={{
            color:       'rgba(250,246,231,0.65)',
            fontSize:     14,
            lineHeight:   22,
            marginBottom: 12,
            fontFamily:  'Manrope',
          }}
        >
          Sprint 1 activo · Auth, roles y CMS base completados. Infraestructura AWS en configuración.
        </Text>
        <Text
          style={{
            color:      'rgba(250,246,231,0.40)',
            fontSize:    12,
            fontWeight: '500',
            fontFamily: 'Manrope',
          }}
        >
          {email} · {roleLabel}
        </Text>
      </LinearGradient>

      {/* Stats grid */}
      <View>
        <Text
          style={{
            color:         theme.textMuted,
            fontSize:       10,
            fontWeight:    '800',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom:  12,
            fontFamily:    'Montserrat-SemiBold',
          }}
        >
          MÉTRICAS CLAVE
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {STAT_CARDS.map((card) => (
            <StatsCard key={card.label} {...card} />
          ))}
        </View>
      </View>

      {/* Live channels + recent content */}
      <View>
        <Text
          style={{
            color:         theme.textMuted,
            fontSize:       10,
            fontWeight:    '800',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom:  12,
            fontFamily:    'Montserrat-SemiBold',
          }}
        >
          ACTIVIDAD EN TIEMPO REAL
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

      {/* Quick actions */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            color:         theme.textMuted,
            fontSize:       10,
            fontWeight:    '800',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom:  12,
            fontFamily:    'Montserrat-SemiBold',
          }}
        >
          ACCIONES RÁPIDAS
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
      <DashboardContent roleLabel={roleLabel} email={profile.email} />
    </CmsShell>
  );
}
