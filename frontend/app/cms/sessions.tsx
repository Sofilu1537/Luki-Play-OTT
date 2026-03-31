import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import { cmsListSessions, cmsRevokeSession, CmsSession } from '../../services/api/cmsApi';
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
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
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
 * CMS Sessions screen.
 *
 * Lists all active sessions for the authenticated CMS user by calling
 * GET /auth/sessions. Each session can be individually revoked via
 * DELETE /auth/sessions/:id.
 *
 * Redirects unauthenticated users to /cms/login.
 */
export default function CmsSessions() {
  const { profile, accessToken, logout } = useCmsStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 768;

  const [sessions, setSessions] = useState<CmsSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      router.replace('/cms/login' as never);
    }
  }, [profile, router]);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const data = await cmsListSessions(accessToken);
      setSessions(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar sesiones';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (profile && accessToken) {
      fetchSessions();
    }
  }, [profile, accessToken, fetchSessions]);

  if (!profile) return null;

  const handleLogout = () => {
    logout();
    router.replace('/cms/login' as never);
  };

  const handleRevoke = (session: CmsSession) => {
    const doRevoke = async () => {
      if (!accessToken) return;
      setRevoking(session.id);
      try {
        await cmsRevokeSession(accessToken, session.id);
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al revocar sesión';
        if (Platform.OS === 'web') {
          // eslint-disable-next-line no-alert
          window.alert(msg);
        } else {
          Alert.alert('Error', msg);
        }
      } finally {
        setRevoking(null);
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`¿Revocar sesión del dispositivo "${session.deviceId}"?`)) {
        doRevoke();
      }
    } else {
      Alert.alert(
        'Revocar sesión',
        `¿Revocar la sesión del dispositivo "${session.deviceId}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Revocar', style: 'destructive', onPress: doRevoke },
        ],
      );
    }
  };

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
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>Sesiones activas</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>
              {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: SURFACE,
                borderRadius: 10, padding: 10,
                borderWidth: 1, borderColor: BORDER,
              }}
              onPress={fetchSessions}
              disabled={loading}
            >
              <FontAwesome name="refresh" size={15} color={loading ? TEXT_MUTED : '#CBD5E1'} />
            </TouchableOpacity>
            {!showSidebar && (
              <TouchableOpacity onPress={handleLogout}>
                <FontAwesome name="sign-out" size={18} color="#F87171" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={{ color: TEXT_MUTED, marginTop: 14, fontSize: 14 }}>
                Cargando sesiones…
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                backgroundColor: '#3F1515',
                borderRadius: 12, padding: 20,
                borderWidth: 1, borderColor: '#7F1D1D',
                alignItems: 'center',
              }}
            >
              <FontAwesome name="exclamation-circle" size={28} color="#F87171" />
              <Text style={{ color: '#F87171', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 16, backgroundColor: SURFACE,
                  borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10,
                  borderWidth: 1, borderColor: BORDER,
                }}
                onPress={fetchSessions}
              >
                <Text style={{ color: '#CBD5E1', fontWeight: '600', fontSize: 13 }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : sessions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View
                style={{
                  width: 80, height: 80, backgroundColor: SURFACE,
                  borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: BORDER, marginBottom: 16,
                }}
              >
                <FontAwesome name="lock" size={32} color={TEXT_MUTED} />
              </View>
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '700', marginBottom: 8 }}>
                Sin sesiones activas
              </Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center' }}>
                No hay sesiones activas para esta cuenta.
              </Text>
            </View>
          ) : (
            <>
              {/* Table header */}
              <View
                style={{
                  flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14,
                  backgroundColor: '#0F172A', borderRadius: 8, marginBottom: 8,
                }}
              >
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 2, letterSpacing: 0.5 }}>DISPOSITIVO</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 1.5, letterSpacing: 0.5 }}>AUDIENCIA</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 2, letterSpacing: 0.5 }}>INICIO</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 2, letterSpacing: 0.5 }}>EXPIRA</Text>
                <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', flex: 0.8, letterSpacing: 0.5 }}>ACCIÓN</Text>
              </View>

              {sessions.map((session) => (
                <View
                  key={session.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14, paddingHorizontal: 14,
                    backgroundColor: SURFACE, borderRadius: 12, marginBottom: 6,
                    borderWidth: 1, borderColor: BORDER,
                  }}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                      {session.deviceId}
                    </Text>
                    <Text style={{ color: TEXT_MUTED, fontSize: 10, marginTop: 2 }}>
                      ID: {session.id.slice(0, 12)}…
                    </Text>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <View
                      style={{
                        backgroundColor: `${ACCENT}33`,
                        borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                        alignSelf: 'flex-start',
                        borderWidth: 1, borderColor: `${ACCENT}66`,
                      }}
                    >
                      <Text style={{ color: '#A78BFA', fontSize: 10, fontWeight: '700' }}>
                        {session.audience}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: 11, flex: 2 }}>
                    {formatDate(session.createdAt)}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, flex: 2 }}>
                    {formatDate(session.expiresAt)}
                  </Text>
                  <View style={{ flex: 0.8 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#3F1515',
                        borderRadius: 8, padding: 8,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: '#7F1D1D',
                        opacity: revoking === session.id ? 0.6 : 1,
                      }}
                      onPress={() => handleRevoke(session)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? (
                        <ActivityIndicator size="small" color="#F87171" />
                      ) : (
                        <FontAwesome name="ban" size={13} color="#F87171" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
