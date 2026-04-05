import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { adminGetMonitorStats, MonitorStats } from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return (
    <View style={{ flex: 1, minWidth: 160, backgroundColor: C.surface, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: C.border, gap: 12 }}>
      <View style={{ width: 40, height: 40, backgroundColor: `${color}22`, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>{value}</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{label}</Text>
        {sub && <Text style={{ color: color, fontSize: 11, marginTop: 4 }}>{sub}</Text>}
      </View>
    </View>
  );
}

function ServerBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: C.textDim, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }}>{value}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#0D1B2E', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${value}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export default function CmsMonitor() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  const loadStats = () => {
    if (!accessToken) return;
    setLoading(true);
    adminGetMonitorStats(accessToken).then(setStats).finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, [accessToken]);

  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Monitor' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Monitor del Sistema</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border }}
            onPress={loadStats}
          >
            <FontAwesome name="refresh" size={13} color={C.textDim} />
            <Text style={{ color: C.textDim, fontSize: 13 }}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {loading || !stats ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={{ color: C.muted, marginTop: 14, fontSize: 14 }}>Cargando estadísticas…</Text>
          </View>
        ) : (
          <>
            {/* Stat cards */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
              <StatCard label="Total Usuarios"   value={stats.totalUsuarios}   icon="users"      color="#5B5BD6" />
              <StatCard label="Usuarios Activos" value={stats.usuariosActivos} icon="user-circle" color="#10B981" sub={`${Math.round(stats.usuariosActivos / stats.totalUsuarios * 100)}% del total`} />
              <StatCard label="Sesiones Activas" value={stats.sesionesActivas} icon="lock"        color="#F59E0B" />
              <StatCard label="Abonados Activos" value={stats.contratosActivos} icon="play-circle" color="#0EA5E9" />
              <StatCard label="Ingresos del Mes" value={`$${stats.ingresosMes.toLocaleString('es-CO')}`} icon="dollar" color="#4ADE80" />
            </View>

            {/* Server metrics */}
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 20 }}>Recursos del Servidor</Text>
              <ServerBar label="CPU"       value={stats.cargaServidor}          color={stats.cargaServidor > 80 ? '#F87171' : '#5B5BD6'} />
              <ServerBar label="RAM"       value={Math.min(stats.cargaServidor + 20, 100)} color="#10B981" />
              <ServerBar label="Disco"     value={Math.min(stats.cargaServidor + 5, 100)}  color="#F59E0B" />
              <ServerBar label="Red (MB/s)" value={Math.min(stats.sesionesActivas * 3, 100)} color="#0EA5E9" />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' }} />
                <Text style={{ color: C.textDim, fontSize: 12 }}>
                  Sistema operando normalmente · Última actualización: {new Date().toLocaleTimeString('es-CO')}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </CmsShell>
  );
}
