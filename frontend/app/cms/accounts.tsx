import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../../services/cmsStore';
import type { CmsAccount, ServiceStatus, ContractType } from '../../services/api/cmsApi';

// ─── Badge helpers ────────────────────────────────────────────────────────────

const SERVICE_STATUS_COLORS: Record<ServiceStatus, { bg: string; text: string }> = {
  ACTIVO:    { bg: '#064E3B', text: '#34D399' },
  CORTESIA:  { bg: '#1E3A5F', text: '#60A5FA' },
  PENDIENTE: { bg: '#451A03', text: '#FCD34D' },
  SUSPENDIDO:{ bg: '#7F1D1D', text: '#FCA5A5' },
  ANULADO:   { bg: '#1F2937', text: '#9CA3AF' },
  CORTADO:   { bg: '#4C0519', text: '#FDA4AF' },
};

function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const c = SERVICE_STATUS_COLORS[status] ?? { bg: '#1F2937', text: '#9CA3AF' };
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>
        {status}
      </Text>
    </View>
  );
}

const CONTRACT_TYPE_COLORS: Record<ContractType, { bg: string; text: string }> = {
  ISP:      { bg: '#1E1B4B', text: '#A5B4FC' },
  OTT_ONLY: { bg: '#052E16', text: '#34D399' },
};

function ContractTypeBadge({ type }: { type: ContractType }) {
  const c = CONTRACT_TYPE_COLORS[type] ?? { bg: '#1F2937', text: '#9CA3AF' };
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>
        {type === 'OTT_ONLY' ? 'OTT' : 'ISP'}
      </Text>
    </View>
  );
}

// ─── Accounts screen ──────────────────────────────────────────────────────────

/**
 * CMS Accounts / Contracts screen.
 *
 * Displays all platform accounts (contracts) with:
 * - Filter by service status (ALL / ACTIVO / SUSPENDIDO / etc.)
 * - Filter by contract type (ALL / ISP / OTT_ONLY)
 * - Color-coded badges for both status and type
 *
 * Route protection: redirects to /cms/login when not authenticated.
 */
export default function CmsAccounts() {
  const router = useRouter();
  const { user, accounts, loadData, logout } = useCmsStore();

  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'ALL'>('ALL');

  useEffect(() => {
    if (!user) router.replace('/cms/login' as never);
  }, [user]);

  useEffect(() => {
    if (accounts.length === 0) loadData();
  }, []);

  if (!user) return null;

  const filtered = accounts.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.serviceStatus === statusFilter;
    const matchType = typeFilter === 'ALL' || a.contractType === typeFilter;
    return matchStatus && matchType;
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/cms/login' as never);
  };

  const STATUS_FILTERS: Array<{ value: ServiceStatus | 'ALL'; label: string }> = [
    { value: 'ALL',        label: 'Todos' },
    { value: 'ACTIVO',     label: 'Activo' },
    { value: 'CORTESIA',   label: 'Cortesía' },
    { value: 'PENDIENTE',  label: 'Pendiente' },
    { value: 'SUSPENDIDO', label: 'Suspendido' },
    { value: 'ANULADO',    label: 'Anulado' },
    { value: 'CORTADO',    label: 'Cortado' },
  ];

  const TYPE_FILTERS: Array<{ value: ContractType | 'ALL'; label: string }> = [
    { value: 'ALL',      label: 'Todos' },
    { value: 'ISP',      label: 'ISP' },
    { value: 'OTT_ONLY', label: 'OTT' },
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0F172A' }}>
      {/* Mini sidebar */}
      <CmsSidebar role={user.role} activeKey="accounts" onLogout={handleLogout} />

      {/* Main content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: '#1E293B',
            borderBottomWidth: 1,
            borderBottomColor: '#334155',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/cms/dashboard' as never)}>
              <FontAwesome name="chevron-left" size={14} color="#64748B" />
            </TouchableOpacity>
            <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '700' }}>
              Contratos
            </Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            {filtered.length} de {accounts.length}
          </Text>
        </View>

        {/* Filters */}
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1E293B',
            gap: 10,
          }}
        >
          {/* Status filter */}
          <View>
            <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
              ESTADO
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {STATUS_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setStatusFilter(f.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: statusFilter === f.value ? '#2563EB' : '#1E293B',
                      borderWidth: 1,
                      borderColor: statusFilter === f.value ? '#2563EB' : '#334155',
                    }}
                  >
                    <Text
                      style={{
                        color: statusFilter === f.value ? '#fff' : '#94A3B8',
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Type filter */}
          <View>
            <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
              TIPO
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {TYPE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => setTypeFilter(f.value)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: typeFilter === f.value ? '#2563EB' : '#1E293B',
                    borderWidth: 1,
                    borderColor: typeFilter === f.value ? '#2563EB' : '#334155',
                  }}
                >
                  <Text
                    style={{
                      color: typeFilter === f.value ? '#fff' : '#94A3B8',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Table */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#334155',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#334155',
                backgroundColor: '#0F172A',
              }}
            >
              {['Contrato', 'Tipo', 'Estado', 'OTT'].map((col, i) => (
                <Text
                  key={col}
                  style={{
                    color: '#64748B',
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                    flex: i === 0 ? 2 : 1,
                  }}
                >
                  {col.toUpperCase()}
                </Text>
              ))}
            </View>

            {/* Rows */}
            {filtered.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <FontAwesome name="file-o" size={32} color="#334155" />
                <Text style={{ color: '#475569', marginTop: 12, fontSize: 14 }}>
                  No se encontraron contratos
                </Text>
              </View>
            ) : (
              filtered.map((account: CmsAccount, idx) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isLast={idx === filtered.length - 1}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────

function AccountRow({ account, isLast }: { account: CmsAccount; isLast: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#334155',
      }}
    >
      {/* Contract number */}
      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: '#0F172A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name="id-card-o" size={13} color="#475569" />
        </View>
        <View>
          <Text style={{ color: '#F1F5F9', fontSize: 13, fontWeight: '600' }}>
            {account.contractNumber}
          </Text>
          {account.restrictionMessage && (
            <Text style={{ color: '#F59E0B', fontSize: 10 }} numberOfLines={1}>
              ⚠ {account.restrictionMessage}
            </Text>
          )}
        </View>
      </View>

      {/* Type */}
      <View style={{ flex: 1 }}>
        <ContractTypeBadge type={account.contractType} />
      </View>

      {/* Status */}
      <View style={{ flex: 1 }}>
        <ServiceStatusBadge status={account.serviceStatus} />
      </View>

      {/* OTT access */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <FontAwesome
          name={account.canAccessOtt ? 'check-circle' : 'times-circle'}
          size={16}
          color={account.canAccessOtt ? '#34D399' : '#EF4444'}
        />
        <Text
          style={{
            color: account.canAccessOtt ? '#34D399' : '#EF4444',
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          {account.canAccessOtt ? 'Sí' : 'No'}
        </Text>
      </View>
    </View>
  );
}

// ─── Mini sidebar ─────────────────────────────────────────────────────────────

interface CmsSidebarProps {
  role: string;
  activeKey: string;
  onLogout: () => void;
}

const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: 'th-large' as const, route: '/cms/dashboard' },
  { key: 'users',     icon: 'users' as const,    route: '/cms/users' },
  { key: 'accounts',  icon: 'file-text-o' as const, route: '/cms/accounts' },
  { key: 'sessions',  icon: 'exchange' as const, route: '/cms/sessions' },
];

function CmsSidebar({ role: _role, activeKey, onLogout }: CmsSidebarProps) {
  const router = useRouter();
  return (
    <View
      style={{
        width: 56,
        backgroundColor: '#1E293B',
        borderRightWidth: 1,
        borderRightColor: '#334155',
        paddingTop: 20,
        paddingBottom: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View>
        <View
          style={{
            width: 34,
            height: 34,
            backgroundColor: '#2563EB',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <FontAwesome name="play" size={13} color="#fff" />
        </View>
        <View style={{ gap: 4 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => router.push(item.route as never)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                backgroundColor: activeKey === item.key ? '#2563EB' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesome
                name={item.icon}
                size={15}
                color={activeKey === item.key ? '#fff' : '#64748B'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        onPress={onLogout}
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: '#0F172A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name="sign-out" size={15} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}
