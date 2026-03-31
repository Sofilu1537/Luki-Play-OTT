/**
 * CMS Accounts Screen — Table of all contracts/accounts with status badges.
 *
 * Uses mock data from cmsStore. Prepared for real API integration.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, mockAccounts, MockAccount } from '../../services/cmsStore';

// ─── Status badge ─────────────────────────────────────────────────────────────

type ServiceStatus = MockAccount['serviceStatus'];

const STATUS_COLORS: Record<ServiceStatus, { bg: string; text: string }> = {
  ACTIVO: { bg: '#F0FDF4', text: '#15803D' },
  CORTESIA: { bg: '#EFF6FF', text: '#1D4ED8' },
  PENDIENTE: { bg: '#FFFBEB', text: '#B45309' },
  SUSPENDIDO: { bg: '#FFF7ED', text: '#C2410C' },
  ANULADO: { bg: '#FEF2F2', text: '#B91C1C' },
  CORTADO: { bg: '#4B0F0F', text: '#FCA5A5' },
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#F1F5F9', text: '#475569' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: MockAccount['contractType'] }) {
  const isOtt = type === 'OTT_ONLY';
  return (
    <View style={[styles.badge, { backgroundColor: isOtt ? '#F5F3FF' : '#F0F9FF' }]}>
      <Text style={[styles.badgeText, { color: isOtt ? '#6D28D9' : '#0369A1' }]}>
        {isOtt ? 'OTT' : 'ISP'}
      </Text>
    </View>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type StatusFilter = 'ALL' | ServiceStatus;
type TypeFilter = 'ALL' | MockAccount['contractType'];

export default function CmsAccounts() {
  const { isAuthenticated } = useCmsStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    let list: MockAccount[] = mockAccounts;
    if (statusFilter !== 'ALL') list = list.filter((a) => a.serviceStatus === statusFilter);
    if (typeFilter !== 'ALL') list = list.filter((a) => a.contractType === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.contractNumber.toLowerCase().includes(q) ||
          a.userId.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, statusFilter, typeFilter]);

  const statusFilters: StatusFilter[] = ['ALL', 'ACTIVO', 'CORTESIA', 'PENDIENTE', 'SUSPENDIDO', 'ANULADO', 'CORTADO'];
  const typeFilters: TypeFilter[] = ['ALL', 'ISP', 'OTT_ONLY'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Contratos / Cuentas</Text>
        <Text style={styles.pageSubtitle}>{filtered.length} de {mockAccounts.length} contratos</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por número de contrato, usuario o ID..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status filters */}
      <Text style={styles.filterLabel}>Estado</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillContent}
      >
        {statusFilters.map((s) => (
          <FilterPill
            key={s}
            label={s === 'ALL' ? 'Todos' : s}
            active={statusFilter === s}
            onPress={() => setStatusFilter(s)}
          />
        ))}
      </ScrollView>

      {/* Type filters */}
      <Text style={styles.filterLabel}>Tipo</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillContent}
      >
        {typeFilters.map((t) => (
          <FilterPill
            key={t}
            label={t === 'ALL' ? 'Todos' : t === 'OTT_ONLY' ? 'OTT Only' : t}
            active={typeFilter === t}
            onPress={() => setTypeFilter(t)}
          />
        ))}
      </ScrollView>

      {/* Table */}
      <View style={styles.tableWrapper}>
        {/* Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, styles.cellContract]}>Contrato</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellType]}>Tipo</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellStatus]}>Estado</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellOtt]}>OTT</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellUser]}>Usuario</Text>
        </View>

        {/* Rows */}
        {filtered.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No se encontraron contratos</Text>
          </View>
        ) : (
          filtered.map((acc, idx) => (
            <View key={acc.id} style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.cellContract, styles.mono]} numberOfLines={1}>
                {acc.contractNumber}
              </Text>
              <View style={[styles.cell, styles.cellType]}>
                <TypeBadge type={acc.contractType} />
              </View>
              <View style={[styles.cell, styles.cellStatus]}>
                <StatusBadge status={acc.serviceStatus} />
              </View>
              <Text style={[styles.cell, styles.cellOtt, acc.canAccessOtt ? styles.ottYes : styles.ottNo]}>
                {acc.canAccessOtt ? '✅' : '🚫'}
              </Text>
              <Text style={[styles.cell, styles.cellUser, styles.mono]} numberOfLines={1}>
                {acc.userId}
              </Text>
            </View>
          ))
        )}
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
  pageHeader: {
    marginBottom: 20,
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
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  pillRow: {
    marginBottom: 12,
  },
  pillContent: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  pillText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#FAFAFA' },
  cell: {
    fontSize: 13,
    color: '#1E293B',
  },
  headerCell: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellContract: {
    flex: 1,
    marginRight: 12,
  },
  cellType: {
    width: 70,
    marginRight: 12,
  },
  cellStatus: {
    width: 105,
    marginRight: 12,
  },
  cellOtt: {
    width: 40,
    textAlign: 'center',
    marginRight: 12,
  },
  cellUser: {
    width: 90,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#475569',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ottYes: {
    color: '#15803D',
  },
  ottNo: {
    color: '#B91C1C',
  },
  emptyRow: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
