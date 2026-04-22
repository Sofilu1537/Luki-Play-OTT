import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { useChannelStore } from '../../services/channelStore';
import { adminListUsers, AdminUser } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import StatsCard from '../../components/cms/dashboard/StatsCard';
import MonetizationWidget from '../../components/cms/dashboard/MonetizationWidget';
import ChannelsWidget from '../../components/cms/dashboard/ChannelsWidget';
import QuickActions from '../../components/cms/dashboard/QuickActions';
import { FONT_FAMILY } from '../../styles/typography';
import { useTheme } from '../../hooks/useTheme';

const PLAN_PRICE_USD = 26;

// ── Shared stats shape ───────────────────────────────────────────────────────
export interface DashboardStats {
  totalUsers:        number;
  activeSubscribers: number;
  totalSubscribers:  number;
  mrr:               number;
  dau:               number;
  churned:           number;
  churnRate:         string;
  byStatus: {
    active:    number;
    suspended: number;
    inactive:  number;
    pending:   number;
  };
}

function computeStats(users: AdminUser[]): DashboardStats {
  const subscribers       = users.filter(u => u.isSubscriber);
  const activeSubscribers = subscribers.filter(u => u.status === 'active');
  const mrr               = activeSubscribers.length * PLAN_PRICE_USD;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dau = users.filter(u => {
    if (!u.lastLoginAt) return false;
    return new Date(u.lastLoginAt) >= todayStart;
  }).length;

  const churned   = subscribers.filter(u => u.status === 'suspended' || u.status === 'inactive').length;
  const churnRate = subscribers.length > 0
    ? ((churned / subscribers.length) * 100).toFixed(1)
    : '0.0';

  return {
    totalUsers:        users.length,
    activeSubscribers: activeSubscribers.length,
    totalSubscribers:  subscribers.length,
    mrr,
    dau,
    churned,
    churnRate,
    byStatus: {
      active:    users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      inactive:  users.filter(u => u.status === 'inactive').length,
      pending:   users.filter(u => u.status === 'pending').length,
    },
  };
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <Text style={{
      color:         theme.text,
      fontSize:      12,
      fontWeight:    '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom:  12,
      fontFamily:    FONT_FAMILY.bodyBold,
    }}>
      {label}
    </Text>
  );
}

// ── Inner content ────────────────────────────────────────────────────────────
function DashboardContent({
  roleLabel,
  email,
  stats,
  isLoading,
}: {
  roleLabel: string;
  email:     string;
  stats:     DashboardStats | null;
  isLoading: boolean;
}) {
  const { channels, isLoading: isLoadingChannels } = useChannelStore();

  const fmtMRR = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;

  const KPI_CARDS = [
    {
      label:        'Abonados activos',
      value:        isLoading ? '—' : (stats?.activeSubscribers ?? 0).toLocaleString(),
      subtitle:     isLoading ? '' : `de ${stats?.totalSubscribers ?? 0} suscritos`,
      trend:        (stats?.activeSubscribers ?? 0) > 0 ? '↑ con plan vigente' : 'Sin abonados activos',
      trendPositive: (stats?.activeSubscribers ?? 0) > 0,
      icon:         'users'       as const,
      color:        '#17D1C6',
      data:         [60, 65, 58, 72, 80, 75, 88, 95, 90, 100],
    },
    {
      label:        'Ingreso mensual',
      value:        isLoading ? '—' : fmtMRR(stats?.mrr ?? 0),
      subtitle:     `Plan $${PLAN_PRICE_USD}/mes · USD`,
      hint:         `Ingreso Recurrente Mensual — ingresos fijos mensuales. Fórmula: abonados activos × $${PLAN_PRICE_USD}`,
      trend:        isLoading ? '' : `${stats?.activeSubscribers ?? 0} × $${PLAN_PRICE_USD}`,
      trendPositive: (stats?.mrr ?? 0) > 0,
      icon:         'dollar'      as const,
      color:        '#FFB800',
      data:         [70, 68, 75, 80, 85, 78, 90, 88, 92, 100],
    },
    {
      label:        'Usuarios activos diarios',
      value:        isLoading ? '—' : (stats?.dau ?? 0).toLocaleString(),
      subtitle:     isLoading ? '' : `de ${stats?.byStatus.active ?? 0} activos`,
      hint:         'Usuarios activos del día — usuarios únicos con sesión iniciada en las últimas 24 h.',
      trend:        (stats?.dau ?? 0) === 0 ? 'Sin sesiones hoy' : '↑ Usuarios únicos hoy',
      trendPositive: (stats?.dau ?? 0) > 0,
      icon:         'signal'      as const,
      color:        '#1E96FC',
      data:         [40, 52, 48, 61, 70, 65, 80, 75, 88, 95],
    },
    {
      label:        'Tasa de abandono',
      value:        isLoading ? '—' : `${stats?.churnRate ?? '0.0'}%`,
      subtitle:     isLoading ? '' : `${stats?.churned ?? 0} suscrip. baja`,
      hint:         'Abandono — % de suscriptores que cancelaron o fueron suspendidos. Fórmula: bajas ÷ total suscritos × 100',
      trend:        parseFloat(stats?.churnRate ?? '0') <= 3 ? '↓ Bajo control' : '↑ Atención requerida',
      trendPositive: parseFloat(stats?.churnRate ?? '0') <= 3,
      icon:         'line-chart'  as const,
      color:        '#D1105A',
      data:         [45, 50, 42, 38, 35, 40, 30, 28, 25, 22],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── FIFA badge ──────────────────────────────────────── */}
      <View style={{ alignItems: 'flex-end' }}>
        <View style={{
          backgroundColor:   'rgba(255,184,0,0.16)',
          borderRadius:      10,
          paddingHorizontal: 16,
          paddingVertical:   10,
          flexDirection:     'row',
          alignItems:        'center',
          gap:               8,
          borderWidth:       1,
          borderColor:       'rgba(255,184,0,0.40)',
        }}>
          <FontAwesome name="bolt" size={16} color="#FFB800" />
          <Text style={{ color: '#FFB800', fontSize: 15, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: FONT_FAMILY.bodyBold }}>
            FIFA WORLD CUP 2026
          </Text>
        </View>
      </View>

      {/* ── Acciones rápidas ────────────────────────────────── */}
      <View style={{ marginBottom: 8 }}>
        <SectionHeader label="ACCIONES RÁPIDAS" />
        <QuickActions />
      </View>

      {/* ── Monetización + Canales ────────────────────────────── */}
      <View>
        <SectionHeader label="MONETIZACIÓN Y CANALES" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 280 }}>
            <MonetizationWidget stats={stats} isLoading={isLoading} />
          </View>
          <View style={{ flex: 1, minWidth: 280 }}>
            <ChannelsWidget channels={channels} isLoading={isLoadingChannels} />
          </View>
        </View>
      </View>

      {/* ── KPIs ────────────────────────────────────────────── */}
      <View>
        <SectionHeader label="MÉTRICAS CLAVE" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 0 }}>
          {KPI_CARDS.map(card => (
            <StatsCard key={card.label} {...card} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Route export ─────────────────────────────────────────────────────────────
export default function CmsDashboard() {
  const { profile, accessToken } = useCmsStore();
  const { loadChannels } = useChannelStore();
  const router                   = useRouter();

  const [users,          setUsers]          = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoadingUsers(true);
    adminListUsers(accessToken)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setIsLoadingUsers(false));
    loadChannels(accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!profile) return null;

  const roleLabel =
    profile.role?.toLowerCase() === 'superadmin' ? 'Super Admin'
    : profile.role?.toLowerCase() === 'soporte'  ? 'Soporte Técnico'
    : profile.role ?? 'Admin';

  const stats = users.length > 0 ? computeStats(users) : null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Dashboard' }]}>
      <DashboardContent
        roleLabel={roleLabel}
        email={profile.email}
        stats={stats}
        isLoading={isLoadingUsers}
      />
    </CmsShell>
  );
}
