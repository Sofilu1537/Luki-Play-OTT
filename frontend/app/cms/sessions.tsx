import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { cmsListSessions, cmsRevokeSession, CmsSession } from '../../services/api/cmsApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function CmsSessions() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<CmsSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await cmsListSessions(accessToken);
      setSessions(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (profile && accessToken) fetchSessions();
  }, [profile, accessToken, fetchSessions]);

  if (!profile) return null;

  const handleRevoke = (session: CmsSession) => {
    const doRevoke = async () => {
      if (!accessToken) return;
      setRevoking(session.id);
      try {
        await cmsRevokeSession(accessToken, session.id);
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al revocar';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      } finally {
        setRevoking(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Revocar sesión del dispositivo "${session.deviceId}"?`)) doRevoke();
    } else {
      Alert.alert('Revocar sesión', `¿Revocar "${session.deviceId}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revocar', style: 'destructive', onPress: doRevoke },
      ]);
    }
  };

  return (
    <CmsShell breadcrumbs={[{ label: 'Sesiones' }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Sesiones activas</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border }}
            onPress={fetchSessions}
            disabled={loading}
          >
            <FontAwesome name="refresh" size={13} color={loading ? C.muted : C.textDim} />
            <Text style={{ color: C.textDim, fontSize: 13 }}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ color: C.muted, marginTop: 14, fontSize: 14 }}>Cargando sesiones…</Text>
            </View>
          ) : error ? (
            <View style={{ backgroundColor: '#3F1515', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#7F1D1D', alignItems: 'center' }}>
              <FontAwesome name="exclamation-circle" size={28} color="#F87171" />
              <Text style={{ color: '#F87171', fontSize: 14, marginTop: 10, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: C.border }}
                onPress={fetchSessions}
              >
                <Text style={{ color: C.textDim, fontWeight: '600', fontSize: 13 }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : sessions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View style={{ width: 72, height: 72, backgroundColor: C.surface, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <FontAwesome name="lock" size={28} color={C.muted} />
              </View>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Sin sesiones activas</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>No hay sesiones activas para esta cuenta.</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#0D1B2E', borderRadius: 8, marginBottom: 6 }}>
                {[['DISPOSITIVO', 2], ['AUDIENCIA', 1.5], ['INICIO', 2], ['EXPIRA', 2], ['ACCIÓN', 0.8]].map(([h, flex]) => (
                  <Text key={String(h)} style={{ color: C.muted, fontSize: 10, fontWeight: '700', flex: Number(flex), letterSpacing: 0.4 }}>
                    {String(h)}
                  </Text>
                ))}
              </View>

              {sessions.map((session) => (
                <View
                  key={session.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14, paddingHorizontal: 14,
                    backgroundColor: C.surface, borderRadius: 10, marginBottom: 4,
                    borderWidth: 1, borderColor: C.border,
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{session.deviceId}</Text>
                    <Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>ID: {session.id.slice(0, 12)}…</Text>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <View style={{ backgroundColor: `${C.accent}33`, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: `${C.accent}66` }}>
                      <Text style={{ color: C.accentLight, fontSize: 10, fontWeight: '700' }}>{session.audience}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.textDim, fontSize: 11, flex: 2 }}>{formatDate(session.createdAt)}</Text>
                  <Text style={{ color: C.textDim, fontSize: 11, flex: 2 }}>{formatDate(session.expiresAt)}</Text>
                  <View style={{ flex: 0.8 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#3F1515', borderRadius: 8, padding: 8,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: '#7F1D1D',
                        opacity: revoking === session.id ? 0.6 : 1,
                        width: 34, height: 34,
                      }}
                      onPress={() => handleRevoke(session)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id
                        ? <ActivityIndicator size="small" color="#F87171" />
                        : <FontAwesome name="ban" size={13} color="#F87171" />}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </CmsShell>
  );
}
