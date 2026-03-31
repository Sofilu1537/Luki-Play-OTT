import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const BG = '#0F172A';
const SURFACE = '#1E293B';
const ACCENT = '#6D28D9';
const TEXT = '#F1F5F9';
const MUTED = '#94A3B8';
const BORDER = '#334155';

/** Maps ISP service status to a display color */
const SERVICE_STATUS_COLORS: Record<string, string> = {
  ACTIVO: '#34D399',
  CORTESIA: '#38BDF8',
  PENDIENTE: '#FBBF24',
  SUSPENDIDO: '#F87171',
  ANULADO: '#9CA3AF',
  CORTADO: '#EF4444',
};

const CONTRACT_TYPE_COLORS: Record<string, string> = {
  ISP: '#F97316',
  OTT_ONLY: '#A78BFA',
};

function ServiceStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Text style={{ color: '#475569', fontSize: 12 }}>—</Text>;
  const color = SERVICE_STATUS_COLORS[status] ?? '#94A3B8';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function ContractTypeBadge({ type }: { type: string }) {
  const color = CONTRACT_TYPE_COLORS[type] ?? '#94A3B8';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{type}</Text>
    </View>
  );
}

/**
 * CMS Accounts screen.
 *
 * Displays all contracts with colored status badges.
 * Supports filtering by contract type and text search.
 */
export default function CmsAccounts() {
  const router = useRouter();
  const { admin, accounts, isLoading, error, fetchAccounts } = useCmsStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!admin) { router.replace('/cms/login'); return; }
    fetchAccounts();
  }, [admin]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchType = typeFilter === 'all' || a.contractType === typeFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.contractNumber.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.serviceStatus ?? '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [accounts, search, typeFilter]);

  if (!admin) return null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: '800' }}>Contratos</Text>
          <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
            {filtered.length} de {accounts.length} contratos
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchAccounts}
          style={{ backgroundColor: SURFACE, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BORDER }}
        >
          <FontAwesome name="refresh" size={15} color={MUTED} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <View style={{
          flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center',
          backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderColor: BORDER,
          paddingHorizontal: 12,
        }}>
          <FontAwesome name="search" size={14} color={MUTED} />
          <TextInput
            style={{ flex: 1, color: TEXT, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14 }}
            placeholder="Buscar por contrato o estado..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          {['all', 'ISP', 'OTT_ONLY'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                backgroundColor: typeFilter === t ? ACCENT : SURFACE,
                borderWidth: 1, borderColor: typeFilter === t ? ACCENT : BORDER,
              }}
            >
              <Text style={{ color: typeFilter === t ? '#FFFFFF' : MUTED, fontSize: 12, fontWeight: '600' }}>
                {t === 'all' ? 'Todos' : t === 'OTT_ONLY' ? 'OTT' : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && (
        <View style={{ marginHorizontal: 20, backgroundColor: '#7F1D1D33', borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <Text style={{ color: '#F87171', fontSize: 14 }}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Table header */}
          <View style={{
            flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: BORDER,
          }}>
            {['Contrato', 'Tipo', 'Estado ISP', 'OTT', 'Dispositivos'].map((h, i) => (
              <Text key={h} style={{
                color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                flex: i === 0 ? 2 : 1,
              }}>{h.toUpperCase()}</Text>
            ))}
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: MUTED }}>No se encontraron contratos</Text>
            </View>
          ) : (
            filtered.map((account, idx) => (
              <View
                key={account.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 14, paddingVertical: 14,
                  backgroundColor: idx % 2 === 0 ? 'transparent' : SURFACE + '66',
                  borderRadius: 8,
                }}
              >
                <View style={{ flex: 2 }}>
                  <Text style={{ color: TEXT, fontSize: 13, fontWeight: '600' }}>
                    {account.contractNumber}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{account.planId}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ContractTypeBadge type={account.contractType} />
                </View>
                <View style={{ flex: 1 }}>
                  <ServiceStatusBadge status={account.serviceStatus} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome
                    name={account.canAccessOtt ? 'check-circle' : 'times-circle'}
                    size={16}
                    color={account.canAccessOtt ? '#34D399' : '#F87171'}
                  />
                </View>
                <Text style={{ color: MUTED, fontSize: 13, flex: 1 }}>
                  {account.maxDevices}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
