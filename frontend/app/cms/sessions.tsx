import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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

const AUDIENCE_COLORS: Record<string, string> = {
  app: '#38BDF8',
  cms: '#A78BFA',
};

function AudienceBadge({ audience }: { audience: string }) {
  const color = AUDIENCE_COLORS[audience] ?? '#94A3B8';
  return (
    <View style={{ backgroundColor: color + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{audience}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * CMS Sessions screen.
 *
 * Shows all active JWT sessions.
 * SUPERADMIN can revoke any session.
 */
export default function CmsSessions() {
  const router = useRouter();
  const { admin, sessions, isLoading, error, fetchSessions, revokeSession } = useCmsStore();
  const [revoking, setRevoking] = useState<string | null>(null);

  const isSuperAdmin = admin?.role === 'superadmin';

  useEffect(() => {
    if (!admin) { router.replace('/cms/login'); return; }
    fetchSessions();
  }, [admin]);

  const handleRevoke = (sessionId: string) => {
    const doRevoke = async () => {
      setRevoking(sessionId);
      await revokeSession(sessionId);
      setRevoking(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Revocar esta sesión?')) {
        doRevoke();
      }
    } else {
      Alert.alert('Revocar sesión', '¿Estás seguro de que deseas revocar esta sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revocar', style: 'destructive', onPress: doRevoke },
      ]);
    }
  };

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
          <Text style={{ color: TEXT, fontSize: 20, fontWeight: '800' }}>Sesiones activas</Text>
          <Text style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} activa{sessions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchSessions}
          style={{ backgroundColor: SURFACE, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BORDER }}
        >
          <FontAwesome name="refresh" size={15} color={MUTED} />
        </TouchableOpacity>
      </View>

      {!isSuperAdmin && (
        <View style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: '#1E293B', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#334155' }}>
          <Text style={{ color: MUTED, fontSize: 12 }}>
            ⚠️ Solo los SUPERADMIN pueden revocar sesiones.
          </Text>
        </View>
      )}

      {error && (
        <View style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: '#7F1D1D33', borderRadius: 10, padding: 12 }}>
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
            {['ID Sesión', 'Dispositivo', 'Tipo', 'Creada', 'Expira', ''].map((h, i) => (
              <Text key={`${h}-${i}`} style={{
                color: MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
                flex: i === 0 ? 2 : i === 5 ? 0.5 : 1.5,
              }}>{h.toUpperCase()}</Text>
            ))}
          </View>

          {sessions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <FontAwesome name="check-circle" size={36} color="#34D399" />
              <Text style={{ color: MUTED, marginTop: 12 }}>No hay sesiones activas</Text>
            </View>
          ) : (
            sessions.map((session, idx) => (
              <View
                key={session.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 14, paddingVertical: 14,
                  backgroundColor: idx % 2 === 0 ? 'transparent' : SURFACE + '66',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#475569', fontSize: 11, flex: 2 }} numberOfLines={1}>
                  {session.id.slice(0, 12)}…
                </Text>
                <Text style={{ color: MUTED, fontSize: 12, flex: 1.5 }} numberOfLines={1}>
                  {session.deviceId.slice(0, 16)}
                </Text>
                <View style={{ flex: 1.5 }}>
                  <AudienceBadge audience={session.audience} />
                </View>
                <Text style={{ color: MUTED, fontSize: 11, flex: 1.5 }}>
                  {formatDate(session.createdAt)}
                </Text>
                <Text style={{ color: MUTED, fontSize: 11, flex: 1.5 }}>
                  {formatDate(session.expiresAt)}
                </Text>
                <View style={{ flex: 0.5, alignItems: 'center' }}>
                  {isSuperAdmin && (
                    <TouchableOpacity
                      onPress={() => handleRevoke(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id
                        ? <ActivityIndicator size="small" color="#F87171" />
                        : <FontAwesome name="times-circle" size={18} color="#F87171" />
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
