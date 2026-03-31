import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
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

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}

function StatCard({ icon, label, value, color, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: SURFACE, borderRadius: 14, padding: 20, flex: 1,
        minWidth: 140, margin: 6, borderWidth: 1, borderColor: BORDER,
        flexDirection: 'row', alignItems: 'center',
      }}
    >
      <View style={{
        width: 48, height: 48, borderRadius: 12, backgroundColor: color + '22',
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <FontAwesome name={icon as any} size={20} color={color} />
      </View>
      <View>
        <Text style={{ color: TEXT, fontSize: 26, fontWeight: '800' }}>{value}</Text>
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * CMS Dashboard screen.
 *
 * Shows summary statistics: users, contracts, sessions split by type.
 * Tapping a card navigates to the corresponding detail screen.
 */
export default function CmsDashboard() {
  const router = useRouter();
  const { admin, stats, isLoading, error, fetchStats } = useCmsStore();
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 640 ? 3 : 2;

  // Redirect if not authenticated
  useEffect(() => {
    if (!admin) router.replace('/cms/login');
  }, [admin]);

  useEffect(() => {
    fetchStats();
  }, []);

  if (!admin) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ color: TEXT, fontSize: 22, fontWeight: '800' }}>Dashboard</Text>
          <Text style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>
            Bienvenido, {admin.email}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchStats}
          style={{
            backgroundColor: SURFACE, borderRadius: 10, padding: 10,
            borderWidth: 1, borderColor: BORDER,
          }}
        >
          <FontAwesome name="refresh" size={16} color={MUTED} />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 18 }}>
        {error && (
          <View style={{ backgroundColor: '#7F1D1D33', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: '#F87171', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {isLoading && !stats ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={{ color: MUTED, marginTop: 12 }}>Cargando estadísticas...</Text>
          </View>
        ) : stats ? (
          <>
            {/* Users section */}
            <Text style={{ color: MUTED, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 6 }}>
              USUARIOS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard
                icon="users" label="Total usuarios" value={stats.totalUsers}
                color="#38BDF8" onPress={() => router.push('/cms/users' as any)}
              />
              <StatCard
                icon="user" label="Clientes app" value={stats.totalClients}
                color="#34D399" onPress={() => router.push('/cms/users' as any)}
              />
              <StatCard
                icon="shield" label="Usuarios CMS" value={stats.totalCmsUsers}
                color={ACCENT} onPress={() => router.push('/cms/users' as any)}
              />
            </View>

            {/* Accounts section */}
            <Text style={{ color: MUTED, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 6 }}>
              CONTRATOS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard
                icon="file-text" label="Total contratos" value={stats.totalAccounts}
                color="#FBBF24" onPress={() => router.push('/cms/accounts' as any)}
              />
              <StatCard
                icon="wifi" label="Clientes ISP" value={stats.totalIspAccounts}
                color="#F97316" onPress={() => router.push('/cms/accounts' as any)}
              />
              <StatCard
                icon="play-circle" label="Clientes OTT" value={stats.totalOttAccounts}
                color="#A78BFA" onPress={() => router.push('/cms/accounts' as any)}
              />
            </View>

            {/* Sessions section */}
            <Text style={{ color: MUTED, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginLeft: 6 }}>
              SESIONES
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              <StatCard
                icon="lock" label="Sesiones activas" value={stats.totalActiveSessions}
                color="#F87171" onPress={() => router.push('/cms/sessions' as any)}
              />
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: MUTED }}>No hay datos disponibles</Text>
          </View>
        )}

        {/* Quick links */}
        <Text style={{ color: MUTED, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 6 }}>
          ACCESOS RÁPIDOS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[
            { label: 'Ver usuarios', icon: 'users', path: '/cms/users' },
            { label: 'Ver contratos', icon: 'file-text', path: '/cms/accounts' },
            { label: 'Ver sesiones', icon: 'lock', path: '/cms/sessions' },
          ].map((item) => (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: SURFACE, borderRadius: 10, paddingHorizontal: 16,
                paddingVertical: 12, margin: 4, borderWidth: 1, borderColor: BORDER,
              }}
            >
              <FontAwesome name={item.icon as any} size={14} color={ACCENT} />
              <Text style={{ color: TEXT, fontSize: 13, marginLeft: 8 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
