import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIDEBAR_WIDTH = 220;
const BG = '#0F172A';
const SURFACE = '#1E293B';
const BORDER = '#334155';
const ACCENT = '#6D28D9';
const TEXT_MUTED = '#64748B';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'th-large' as const, path: '/cms/dashboard' },
  { label: 'Usuarios', icon: 'users' as const, path: '/cms/users' },
  { label: 'Contratos', icon: 'file-text' as const, path: '/cms/accounts' },
  { label: 'Sesiones', icon: 'lock' as const, path: '/cms/sessions' },
];

// ---------------------------------------------------------------------------
// Mock data — replace with real API calls once accounts endpoint is available
// ---------------------------------------------------------------------------

type ServiceStatus =
  | 'ACTIVO'
  | 'CORTESIA'
  | 'PENDIENTE'
  | 'SUSPENDIDO'
  | 'ANULADO'
  | 'CORTADO';

type ContractType = 'ISP' | 'OTT_ONLY';

interface AccountRow {
  id: string;
  contractNumber: string;
  contractType: ContractType;
  serviceStatus: ServiceStatus;
  canAccessOtt: boolean;
  ownerEmail: string;
  isIspCustomer: boolean;
}

const MOCK_ACCOUNTS: AccountRow[] = [
  { id: 'acc-001', contractNumber: 'CONTRACT-001', contractType: 'ISP', serviceStatus: 'ACTIVO', canAccessOtt: true, ownerEmail: 'juan@example.com', isIspCustomer: true },
  { id: 'acc-002', contractNumber: 'CONTRACT-002', contractType: 'ISP', serviceStatus: 'SUSPENDIDO', canAccessOtt: false, ownerEmail: 'maria@example.com', isIspCustomer: true },
  { id: 'acc-003', contractNumber: 'CONTRACT-003', contractType: 'ISP', serviceStatus: 'CORTADO', canAccessOtt: false, ownerEmail: 'carlos@example.com', isIspCustomer: true },
  { id: 'acc-004', contractNumber: 'CONTRACT-004', contractType: 'ISP', serviceStatus: 'CORTESIA', canAccessOtt: true, ownerEmail: 'ana@example.com', isIspCustomer: true },
  { id: 'acc-ott-001', contractNumber: 'OTT-000001', contractType: 'OTT_ONLY', serviceStatus: 'ACTIVO', canAccessOtt: true, ownerEmail: 'pedro@example.com', isIspCustomer: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVICE_STATUS_COLORS: Record<ServiceStatus, string> = {
  ACTIVO: '#22C55E',
  CORTESIA: '#10B981',
  PENDIENTE: '#F59E0B',
  SUSPENDIDO: '#F87171',
  ANULADO: '#64748B',
  CORTADO: '#EF4444',
};

const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  ISP: '#0EA5E9',
  OTT_ONLY: '#A78BFA',
};

function StatusBadge({ status }: { status: ServiceStatus }) {
  const color = SERVICE_STATUS_COLORS[status];
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: `${color}55`,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: ContractType }) {
  const color = CONTRACT_TYPE_COLORS[type];
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: `${color}55`,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{type}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        width: SIDEBAR_WIDTH,
        backgroundColor: SURFACE,
        borderRightWidth: 1,
        borderRightColor: BORDER,
        paddingTop: 24,
        paddingBottom: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 32 }}>
        <View
          style={{ width: 36, height: 36, backgroundColor: ACCENT, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
        >
          <FontAwesome name="play" size={14} color="white" />
        </View>
        <View>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Luki CMS</Text>
          <Text style={{ color: TEXT_MUTED, fontSize: 10 }}>Panel interno</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, paddingVertical: 12,
                marginHorizontal: 8, borderRadius: 10,
                backgroundColor: active ? ACCENT : 'transparent',
                marginBottom: 2,
              }}
              onPress={() => router.push(item.path as never)}
            >
              <FontAwesome name={item.icon} size={16} color={active ? 'white' : TEXT_MUTED} style={{ width: 22 }} />
              <Text style={{ color: active ? 'white' : '#CBD5E1', fontWeight: active ? '700' : '500', fontSize: 14, marginLeft: 10 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 8, borderRadius: 10 }}
        onPress={onLogout}
      >
        <FontAwesome name="sign-out" size={16} color="#F87171" style={{ width: 22 }} />
        <Text style={{ color: '#F87171', fontWeight: '600', fontSize: 14, marginLeft: 10 }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * CMS Accounts/Contracts screen.
 *
 * Displays all customer accounts/contracts in a filterable table.
 * Status badges use colour coding:
 *   ACTIVO / CORTESIA → green   (can access OTT)
 *   PENDIENTE         → yellow  (restricted)
 *   SUSPENDIDO/CORTADO/ANULADO → red (restricted)
 *
 * Redirects unauthenticated users to /cms/login.
 */
export default function CmsAccounts() {
  const { profile, logout } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!profile) {
      router.replace('/cms/login' as never);
    }
  }, [profile, router]);

  if (!profile) return null;

  const handleLogout = () => {
    logout();
    router.replace('/cms/login' as never);
  };

  const statuses: string[] = ['ALL', 'ACTIVO', 'CORTESIA', 'PENDIENTE', 'SUSPENDIDO', 'CORTADO', 'ANULADO'];

  const filtered = MOCK_ACCOUNTS.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.serviceStatus === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.contractNumber.toLowerCase().includes(q) ||
      a.ownerEmail.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: BG }}>
      {showSidebar && <Sidebar onLogout={handleLogout} />}

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 24, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: BORDER,
          }}
        >
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Contratos / Cuentas</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {!showSidebar && (
            <TouchableOpacity onPress={handleLogout}>
              <FontAwesome name="sign-out" size={18} color="#F87171" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          <View
            style={{
              backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 12,
            }}
          >
            <FontAwesome name="search" size={14} color={TEXT_MUTED} />
            <TextInput
              style={{
                flex: 1, color: 'white', paddingVertical: 10, paddingHorizontal: 10, fontSize: 14,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
              }}
              placeholder="Buscar por contrato o email..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <FontAwesome name="times" size={14} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {statuses.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                    backgroundColor: statusFilter === s ? ACCENT : SURFACE,
                    borderWidth: 1, borderColor: statusFilter === s ? ACCENT : BORDER,
                  }}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={{ color: statusFilter === s ? 'white' : '#CBD5E1', fontSize: 12, fontWeight: '600' }}>
                    {s === 'ALL' ? 'Todos' : s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Table */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* Header row */}
          <View
            style={{
              flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
              backgroundColor: '#0F172A', borderRadius: 8, marginBottom: 8,
            }}
          >
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1.8, letterSpacing: 0.5 }}>CONTRATO</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 2, letterSpacing: 0.5 }}>EMAIL</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1, letterSpacing: 0.5 }}>TIPO</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1.5, letterSpacing: 0.5 }}>ESTADO</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 0.8, letterSpacing: 0.5 }}>OTT</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <FontAwesome name="file-text-o" size={36} color={TEXT_MUTED} />
              <Text style={{ color: TEXT_MUTED, fontSize: 15, marginTop: 14 }}>Sin resultados</Text>
            </View>
          ) : (
            filtered.map((acc) => (
              <View
                key={acc.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 14,
                  backgroundColor: SURFACE, borderRadius: 12, marginBottom: 6,
                  borderWidth: 1, borderColor: BORDER,
                }}
              >
                <View style={{ flex: 1.8 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
                    {acc.contractNumber}
                  </Text>
                  <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 1 }}>ID: {acc.id}</Text>
                </View>
                <Text style={{ color: '#CBD5E1', fontSize: 12, flex: 2 }} numberOfLines={1}>
                  {acc.ownerEmail}
                </Text>
                <View style={{ flex: 1 }}>
                  <TypeBadge type={acc.contractType} />
                </View>
                <View style={{ flex: 1.5 }}>
                  <StatusBadge status={acc.serviceStatus} />
                </View>
                <View style={{ flex: 0.8, flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome
                    name={acc.canAccessOtt ? 'check-circle' : 'times-circle'}
                    size={16}
                    color={acc.canAccessOtt ? '#22C55E' : '#F87171'}
                  />
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
