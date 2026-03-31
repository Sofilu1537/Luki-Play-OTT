/**
 * CMS Users Screen — Table of all users with filter and search.
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
import { useCmsStore, mockUsers, MockUser } from '../../services/cmsStore';

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<MockUser['role'], { bg: string; text: string }> = {
  CLIENT: { bg: '#EFF6FF', text: '#1D4ED8' },
  SUPPORT: { bg: '#F0FDF4', text: '#15803D' },
  SUPERADMIN: { bg: '#F5F3FF', text: '#6D28D9' },
};

function RoleBadge({ role }: { role: MockUser['role'] }) {
  const colors = ROLE_COLORS[role] ?? { bg: '#F1F5F9', text: '#475569' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{role}</Text>
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

type RoleFilter = 'ALL' | MockUser['role'];

export default function CmsUsers() {
  const { isAuthenticated } = useCmsStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    let list: MockUser[] = mockUsers;
    if (roleFilter !== 'ALL') {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, roleFilter]);

  const roleFilters: RoleFilter[] = ['ALL', 'CLIENT', 'SUPPORT', 'SUPERADMIN'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Usuarios</Text>
        <Text style={styles.pageSubtitle}>{filtered.length} de {mockUsers.length} usuarios</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por email, teléfono o ID..."
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

      {/* Role filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillContent}
      >
        {roleFilters.map((r) => (
          <FilterPill
            key={r}
            label={r === 'ALL' ? 'Todos' : r}
            active={roleFilter === r}
            onPress={() => setRoleFilter(r)}
          />
        ))}
      </ScrollView>

      {/* Table */}
      <View style={styles.tableWrapper}>
        {/* Table header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, styles.cellId]}>ID</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellEmail]}>Email</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellRole]}>Rol</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellPhone]}>Teléfono</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellDate]}>Creado</Text>
        </View>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        ) : (
          filtered.map((user, idx) => (
            <View key={user.id} style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.cellId, styles.mono]} numberOfLines={1}>
                {user.id}
              </Text>
              <Text style={[styles.cell, styles.cellEmail]} numberOfLines={1}>
                {user.email ?? <Text style={styles.nullText}>—</Text>}
              </Text>
              <View style={[styles.cell, styles.cellRole]}>
                <RoleBadge role={user.role} />
              </View>
              <Text style={[styles.cell, styles.cellPhone]} numberOfLines={1}>
                {user.phone ?? <Text style={styles.nullText}>—</Text>}
              </Text>
              <Text style={[styles.cell, styles.cellDate]}>{user.createdAt}</Text>
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
  // Search
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
  // Pills
  pillRow: {
    marginBottom: 16,
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
  // Table
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
  rowEven: {
    backgroundColor: '#fff',
  },
  rowOdd: {
    backgroundColor: '#FAFAFA',
  },
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
  cellId: {
    width: 90,
    marginRight: 12,
  },
  cellEmail: {
    flex: 1,
    marginRight: 12,
  },
  cellRole: {
    width: 110,
    marginRight: 12,
  },
  cellPhone: {
    width: 140,
    marginRight: 12,
  },
  cellDate: {
    width: 90,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748B',
  },
  nullText: {
    color: '#CBD5E1',
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
  emptyRow: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
