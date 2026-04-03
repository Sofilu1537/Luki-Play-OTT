import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

type ServiceStatus = 'ACTIVO' | 'CORTESIA' | 'PENDIENTE' | 'SUSPENDIDO' | 'ANULADO' | 'CORTADO';
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
  { id: 'acc-001', contractNumber: 'CONTRACT-001', contractType: 'ISP', serviceStatus: 'ACTIVO',    canAccessOtt: true,  ownerEmail: 'juan@example.com',   isIspCustomer: true },
  { id: 'acc-002', contractNumber: 'CONTRACT-002', contractType: 'ISP', serviceStatus: 'SUSPENDIDO', canAccessOtt: false, ownerEmail: 'maria@example.com',  isIspCustomer: true },
  { id: 'acc-003', contractNumber: 'CONTRACT-003', contractType: 'ISP', serviceStatus: 'CORTADO',   canAccessOtt: false, ownerEmail: 'carlos@example.com', isIspCustomer: true },
  { id: 'acc-004', contractNumber: 'CONTRACT-004', contractType: 'ISP', serviceStatus: 'CORTESIA',  canAccessOtt: true,  ownerEmail: 'ana@example.com',    isIspCustomer: true },
  { id: 'acc-ott-001', contractNumber: 'OTT-000001', contractType: 'OTT_ONLY', serviceStatus: 'ACTIVO', canAccessOtt: true, ownerEmail: 'pedro@example.com', isIspCustomer: false },
];

const STATUS_COLORS: Record<ServiceStatus, string> = {
  ACTIVO: '#22C55E', CORTESIA: '#10B981', PENDIENTE: '#F59E0B',
  SUSPENDIDO: '#F87171', ANULADO: '#64748B', CORTADO: '#EF4444',
};

export default function CmsAccounts() {
  const { profile } = useCmsStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  if (!profile) return null;

  const statuses = ['ALL', 'ACTIVO', 'CORTESIA', 'PENDIENTE', 'SUSPENDIDO', 'CORTADO', 'ANULADO'];
  const filtered = MOCK_ACCOUNTS.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.serviceStatus === statusFilter;
    const q = search.toLowerCase();
    return matchStatus && (!q || a.contractNumber.toLowerCase().includes(q) || a.ownerEmail.toLowerCase().includes(q));
  });

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <CmsShell breadcrumbs={[{ label: 'Contratos' }]}>
      <View style={{ flex: 1 }}>
        {/* Filters */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', marginBottom: 16 }}>
            Contratos / Cuentas
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 12 }}>
            <FontAwesome name="search" size={13} color={C.muted} />
            <TextInput
              style={{ flex: 1, color: 'white', paddingVertical: 10, paddingHorizontal: 10, fontSize: 13, ...webInput }}
              placeholder="Buscar por contrato o email..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {statuses.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: statusFilter === s ? C.accent : C.surface,
                    borderWidth: 1, borderColor: statusFilter === s ? C.accent : C.border,
                  }}
                  onPress={() => setStatusFilter(s)}
                >
                  <Text style={{ color: statusFilter === s ? 'white' : C.textDim, fontSize: 12, fontWeight: '600' }}>
                    {s === 'ALL' ? 'Todos' : s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {/* Table header */}
          <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#0D1B2E', borderRadius: 8, marginBottom: 6 }}>
            {[['CONTRATO', 1.8], ['EMAIL', 2], ['TIPO', 1], ['ESTADO', 1.5], ['OTT', 0.6]].map(([h, flex]) => (
              <Text key={String(h)} style={{ color: C.muted, fontSize: 10, fontWeight: '700', flex: Number(flex), letterSpacing: 0.4 }}>
                {String(h)}
              </Text>
            ))}
          </View>

          {filtered.map((acc) => {
            const color = STATUS_COLORS[acc.serviceStatus];
            return (
              <View
                key={acc.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 14,
                  backgroundColor: C.surface, borderRadius: 10, marginBottom: 4,
                  borderWidth: 1, borderColor: C.border,
                }}
              >
                <View style={{ flex: 1.8 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{acc.contractNumber}</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>ID: {acc.id}</Text>
                </View>
                <Text style={{ color: C.textDim, fontSize: 12, flex: 2 }} numberOfLines={1}>{acc.ownerEmail}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: acc.contractType === 'ISP' ? '#1E3A5F' : `${C.accent}33`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                    <Text style={{ color: acc.contractType === 'ISP' ? '#60A5FA' : C.accentLight, fontSize: 10, fontWeight: '700' }}>{acc.contractType}</Text>
                  </View>
                </View>
                <View style={{ flex: 1.5 }}>
                  <View style={{ backgroundColor: `${color}22`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: `${color}55` }}>
                    <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{acc.serviceStatus}</Text>
                  </View>
                </View>
                <View style={{ flex: 0.6 }}>
                  <FontAwesome name={acc.canAccessOtt ? 'check-circle' : 'times-circle'} size={16} color={acc.canAccessOtt ? '#22C55E' : '#F87171'} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </CmsShell>
  );
}
