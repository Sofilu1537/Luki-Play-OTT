import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, MockAccount, ServiceStatus, ContractType } from '../../services/cmsStore';
import CmsPageLayout from '../../components/CmsPageLayout';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const STATUS_BADGE: Record<ServiceStatus, { bg: string; text: string }> = {
  ACTIVO:     { bg: '#14532d', text: '#86efac' },
  CORTESIA:   { bg: '#1e3a5f', text: '#93c5fd' },
  PENDIENTE:  { bg: '#422006', text: '#fbbf24' },
  SUSPENDIDO: { bg: '#431407', text: '#fb923c' },
  ANULADO:    { bg: '#450a0a', text: '#f87171' },
  CORTADO:    { bg: '#1c1917', text: '#f87171' },
};

const STATUS_FILTERS: { label: string; value: ServiceStatus | 'ALL' }[] = [
  { label: 'Todos',      value: 'ALL'        },
  { label: 'Activo',     value: 'ACTIVO'     },
  { label: 'Cortesía',   value: 'CORTESIA'   },
  { label: 'Pendiente',  value: 'PENDIENTE'  },
  { label: 'Suspendido', value: 'SUSPENDIDO' },
  { label: 'Anulado',    value: 'ANULADO'    },
  { label: 'Cortado',    value: 'CORTADO'    },
];

const TYPE_FILTERS: { label: string; value: ContractType | 'ALL' }[] = [
  { label: 'Todos',     value: 'ALL'      },
  { label: 'ISP',       value: 'ISP'      },
  { label: 'OTT-only',  value: 'OTT_ONLY' },
];

function StatusBadge({ status }: { status: ServiceStatus }) {
  const c = STATUS_BADGE[status];
  return (
    <View style={{
      alignSelf: 'flex-start', backgroundColor: c.bg,
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    }}>
      <Text style={{ color: c.text, fontSize: 10, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function FilterButton({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7,
        backgroundColor: active ? '#3b82f6' : '#1e293b',
        borderWidth: 1, borderColor: active ? '#3b82f6' : '#334155',
      }}
      onPress={onPress}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : '#94a3b8' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * CMS Accounts / Contracts screen.
 *
 * Displays a filterable table of all accounts.
 * Data is currently mocked — TODO: connect to GET /accounts endpoint.
 */
export default function CmsAccounts() {
  const { isAuthenticated, mockAccounts } = useCmsStore();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'ALL'>('ALL');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const filtered = mockAccounts.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.serviceStatus === statusFilter;
    const matchType   = typeFilter   === 'ALL' || a.contractType  === typeFilter;
    return matchStatus && matchType;
  });

  return (
    <CmsPageLayout title="Contratos / Cuentas">
      {/* Filters */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
          TIPO
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {TYPE_FILTERS.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={typeFilter === f.value}
              onPress={() => setTypeFilter(f.value)}
            />
          ))}
        </View>

        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>
          ESTADO
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {STATUS_FILTERS.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onPress={() => setStatusFilter(f.value)}
            />
          ))}
        </View>
      </View>

      {/* Result count */}
      <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>
        {filtered.length} contrato{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* Table */}
      <View style={{
        backgroundColor: '#1e293b', borderRadius: 12,
        borderWidth: 1, borderColor: '#334155', overflow: 'hidden',
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: '#0f172a',
        }}>
          <Text style={[col.contract, hdr]}>CONTRATO</Text>
          <Text style={[col.type,     hdr]}>TIPO</Text>
          <Text style={[col.status,   hdr]}>ESTADO</Text>
          <Text style={[col.ott,      hdr]}>ACCESO OTT</Text>
          <Text style={[col.user,     hdr]}>USUARIO</Text>
        </View>

        {filtered.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <FontAwesome name="filter" size={24} color="#334155" />
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>Sin resultados</Text>
          </View>
        ) : (
          filtered.map((account, idx) => <AccountRow key={account.id} account={account} idx={idx} />)
        )}
      </View>
    </CmsPageLayout>
  );
}

function AccountRow({ account, idx }: { account: MockAccount; idx: number }) {
  return (
    <View style={{
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#334155',
      alignItems: 'center',
    }}>
      <Text style={[col.contract, cell]}>{account.contractNumber}</Text>
      <View style={col.type}>
        <View style={{
          alignSelf: 'flex-start', backgroundColor: account.contractType === 'ISP' ? '#1e3a5f' : '#1e1b4b',
          borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
        }}>
          <Text style={{ color: account.contractType === 'ISP' ? '#93c5fd' : '#a5b4fc', fontSize: 10, fontWeight: '700' }}>
            {account.contractType}
          </Text>
        </View>
      </View>
      <View style={col.status}>
        <StatusBadge status={account.serviceStatus} />
      </View>
      <View style={col.ott}>
        <FontAwesome
          name={account.canAccessOtt ? 'check-circle' : 'times-circle'}
          size={16}
          color={account.canAccessOtt ? '#10b981' : '#ef4444'}
        />
      </View>
      <Text style={[col.user, cell]} numberOfLines={1}>
        {account.associatedEmail ?? '—'}
      </Text>
    </View>
  );
}

const hdr  = { color: '#475569', fontSize: 10, fontWeight: '700' as const };
const cell = { color: '#cbd5e1', fontSize: 13 };

const col = {
  contract: { flex: 2   },
  type:     { flex: 1.2 },
  status:   { flex: 1.5 },
  ott:      { flex: 1.2 },
  user:     { flex: 2   },
};
