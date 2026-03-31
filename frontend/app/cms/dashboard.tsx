/**
 * CMS Dashboard — Main landing screen after CMS login.
 *
 * Shows summary cards and quick statistics derived from mock data.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, mockUsers, mockAccounts, mockSessions } from '../../services/cmsStore';

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

// ─── Quick link ───────────────────────────────────────────────────────────────

interface QuickLinkProps {
  icon: string;
  title: string;
  description: string;
  route: string;
}

function QuickLink({ icon, title, description, route }: QuickLinkProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.quickLink}
      onPress={() => router.push(route as any)}
      activeOpacity={0.8}
    >
      <Text style={styles.quickLinkIcon}>{icon}</Text>
      <View style={styles.quickLinkText}>
        <Text style={styles.quickLinkTitle}>{title}</Text>
        <Text style={styles.quickLinkDesc}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CmsDashboard() {
  const { isAuthenticated, cmsUser } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/cms/login' as any);
    }
  }, [isAuthenticated]);

  // Derived stats from mock data
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.role !== 'SUPERADMIN').length;
  const activeSessions = mockSessions.filter((s) => !s.revoked).length;
  const ispContracts = mockAccounts.filter((a) => a.contractType === 'ISP').length;
  const ottContracts = mockAccounts.filter((a) => a.contractType === 'OTT_ONLY').length;

  const summaryCards: SummaryCardProps[] = [
    { icon: '🧑‍💻', label: 'Total usuarios', value: totalUsers, color: '#3B82F6' },
    { icon: '✅', label: 'Usuarios activos', value: activeUsers, color: '#10B981' },
    { icon: '🔐', label: 'Sesiones activas', value: activeSessions, color: '#F59E0B' },
    { icon: '📡', label: 'Contratos ISP', value: ispContracts, color: '#8B5CF6' },
    { icon: '📺', label: 'Contratos OTT', value: ottContracts, color: '#EC4899' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Bienvenido, {cmsUser?.email ?? '—'} · {cmsUser?.role ?? '—'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🟢 En línea</Text>
        </View>
      </View>

      {/* Summary cards */}
      <View style={[styles.cardsGrid, isWide && styles.cardsGridWide]}>
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </View>

      {/* Quick access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acceso rápido</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            icon="🧑‍💻"
            title="Usuarios"
            description={`${totalUsers} usuarios registrados`}
            route="/cms/users"
          />
          <QuickLink
            icon="📋"
            title="Contratos"
            description={`${mockAccounts.length} cuentas en total`}
            route="/cms/accounts"
          />
          <QuickLink
            icon="🔐"
            title="Sesiones activas"
            description={`${activeSessions} sesiones en curso`}
            route="/cms/sessions"
          />
          {cmsUser?.role === 'SUPERADMIN' && (
            <QuickLink
              icon="⚙️"
              title="Configuración"
              description="Ajustes del sistema"
              route="/cms/settings"
            />
          )}
        </View>
      </View>

      {/* Recent activity stub */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activityList}>
          {mockSessions.slice(0, 3).map((s) => (
            <View key={s.id} style={styles.activityItem}>
              <Text style={styles.activityIcon}>{s.revoked ? '🔴' : '🟢'}</Text>
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>
                  Sesión {s.revoked ? 'revocada' : 'activa'} · {s.deviceId}
                </Text>
                <Text style={styles.activityTime}>Usuario {s.userId} · {s.createdAt}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 28,
    paddingBottom: 48,
  },
  // Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  headerBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  // Cards
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  cardsGridWide: {
    flexWrap: 'nowrap',
  },
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  // Quick links
  quickLinks: {
    gap: 8,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  quickLinkText: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickLinkDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: '#CBD5E1',
    fontWeight: '300',
  },
  // Activity
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
