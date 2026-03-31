import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, MockSession } from '../../services/cmsStore';
import CmsPageLayout from '../../components/CmsPageLayout';
import FontAwesome from '@expo/vector-icons/FontAwesome';

/**
 * CMS Active Sessions screen.
 *
 * Shows all sessions with their status and allows revoking active ones.
 * Data is currently mocked — TODO: connect to GET /sessions endpoint.
 */
export default function CmsSessions() {
  const { isAuthenticated, mockSessions, revokeSession } = useCmsStore();
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const displayed = showAll ? mockSessions : mockSessions.filter((s) => s.status === 'ACTIVE');
  const activeCount = mockSessions.filter((s) => s.status === 'ACTIVE').length;

  const handleRevoke = (session: MockSession) => {
    if (Platform.OS === 'web') {
      // On web, use window.confirm since Alert is not always available
      const confirmed = window.confirm(
        `¿Revocar la sesión de ${session.userEmail}?\n\nDispositivo: ${session.deviceId}`,
      );
      if (confirmed) revokeSession(session.id);
    } else {
      Alert.alert(
        'Revocar sesión',
        `¿Revocar la sesión de ${session.userEmail}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Revocar', style: 'destructive', onPress: () => revokeSession(session.id) },
        ],
      );
    }
  };

  return (
    <CmsPageLayout title="Sesiones activas">
      {/* Summary + toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#1e293b', borderRadius: 10, padding: 12,
          borderWidth: 1, borderColor: '#334155',
        }}>
          <View style={{
            width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981',
          }} />
          <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '600' }}>
            {activeCount} sesión{activeCount !== 1 ? 'es' : ''} activa{activeCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={{
            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155',
          }}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
            {showAll ? 'Solo activas' : 'Ver todas'}
          </Text>
        </TouchableOpacity>
      </View>

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
          <Text style={[col.user,    hdr]}>USUARIO</Text>
          <Text style={[col.device,  hdr]}>DISPOSITIVO</Text>
          <Text style={[col.created, hdr]}>CREADA</Text>
          <Text style={[col.expires, hdr]}>EXPIRA</Text>
          <Text style={[col.status,  hdr]}>ESTADO</Text>
          <Text style={[col.action,  hdr]}>ACCIÓN</Text>
        </View>

        {displayed.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <FontAwesome name="clock-o" size={24} color="#334155" />
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>No hay sesiones activas</Text>
          </View>
        ) : (
          displayed.map((session, idx) => (
            <SessionRow
              key={session.id}
              session={session}
              idx={idx}
              onRevoke={() => handleRevoke(session)}
            />
          ))
        )}
      </View>

      <Text style={{ color: '#475569', fontSize: 11, marginTop: 12 }}>
        * La revocación es provisional (mock). Conectar a DELETE /sessions/:id cuando esté disponible.
      </Text>
    </CmsPageLayout>
  );
}

function SessionRow({
  session, idx, onRevoke,
}: { session: MockSession; idx: number; onRevoke: () => void }) {
  const isActive = session.status === 'ACTIVE';

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); }
    catch { return iso; }
  };

  return (
    <View style={{
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#334155',
      alignItems: 'center',
    }}>
      <Text style={[col.user,    cell]} numberOfLines={1}>{session.userEmail}</Text>
      <Text style={[col.device,  cell]} numberOfLines={1}>{session.deviceId}</Text>
      <Text style={[col.created, cell]}>{formatDate(session.createdAt)}</Text>
      <Text style={[col.expires, cell]}>{formatDate(session.expiresAt)}</Text>
      <View style={col.status}>
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: isActive ? '#14532d' : '#1c1917',
          borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
        }}>
          <Text style={{ color: isActive ? '#86efac' : '#9ca3af', fontSize: 10, fontWeight: '700' }}>
            {session.status}
          </Text>
        </View>
      </View>
      <View style={col.action}>
        {isActive ? (
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: '#450a0a', borderRadius: 6,
              paddingHorizontal: 8, paddingVertical: 5,
              borderWidth: 1, borderColor: '#7f1d1d',
            }}
            onPress={onRevoke}
          >
            <FontAwesome name="ban" size={11} color="#f87171" />
            <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '600' }}>Revocar</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: '#475569', fontSize: 11 }}>—</Text>
        )}
      </View>
    </View>
  );
}

// Typed window.confirm for web platform usage in handleRevoke
declare global {
  interface Window {
    confirm(message?: string): boolean;
  }
}

const hdr  = { color: '#475569', fontSize: 10, fontWeight: '700' as const };
const cell = { color: '#cbd5e1', fontSize: 12 };

const col = {
  user:    { flex: 2.5 },
  device:  { flex: 2   },
  created: { flex: 1.8 },
  expires: { flex: 1.8 },
  status:  { flex: 1   },
  action:  { flex: 1.5 },
};
