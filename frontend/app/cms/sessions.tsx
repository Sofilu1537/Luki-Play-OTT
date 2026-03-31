/**
 * CMS Sessions Screen — Table of active sessions with revoke capability.
 *
 * Uses mock data from cmsStore. Prepared for real API integration.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';

// ─── Status badge ─────────────────────────────────────────────────────────────

function SessionStatusBadge({ revoked }: { revoked: boolean }) {
  return (
    <View style={[styles.badge, revoked ? styles.badgeRevoked : styles.badgeActive]}>
      <Text style={[styles.badgeText, revoked ? styles.badgeTextRevoked : styles.badgeTextActive]}>
        {revoked ? 'Revocada' : 'Activa'}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CmsSessions() {
  const { isAuthenticated, sessions, revokeSession } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated]);

  const handleRevoke = (sessionId: string) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('¿Revocar esta sesión? El usuario deberá volver a autenticarse.')) {
        revokeSession(sessionId);
      }
    } else {
      Alert.alert(
        'Revocar sesión',
        '¿Seguro que deseas revocar esta sesión? El usuario deberá volver a autenticarse.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Revocar', style: 'destructive', onPress: () => revokeSession(sessionId) },
        ],
      );
    }
  };

  const activeSessions = sessions.filter((s) => !s.revoked);
  const revokedSessions = sessions.filter((s) => s.revoked);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Sesiones activas</Text>
        <Text style={styles.pageSubtitle}>
          {activeSessions.length} activas · {revokedSessions.length} revocadas
        </Text>
      </View>

      {/* Table */}
      <View style={styles.tableWrapper}>
        {/* Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, styles.cellUser]}>Usuario</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellDevice]}>Dispositivo</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellDate]}>Creada</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellDate]}>Expira</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellStatus]}>Estado</Text>
          <Text style={[styles.cell, styles.headerCell, styles.cellAction]}>Acción</Text>
        </View>

        {/* Rows */}
        {sessions.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No hay sesiones registradas</Text>
          </View>
        ) : (
          sessions.map((session, idx) => (
            <View
              key={session.id}
              style={[styles.row, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
            >
              <Text style={[styles.cell, styles.cellUser, styles.mono]} numberOfLines={1}>
                {session.userId}
              </Text>
              <Text style={[styles.cell, styles.cellDevice]} numberOfLines={1}>
                {session.deviceId}
              </Text>
              <Text style={[styles.cell, styles.cellDate, styles.dateText]}>{session.createdAt}</Text>
              <Text style={[styles.cell, styles.cellDate, styles.dateText]}>{session.expiresAt}</Text>
              <View style={[styles.cell, styles.cellStatus]}>
                <SessionStatusBadge revoked={session.revoked} />
              </View>
              <View style={[styles.cell, styles.cellAction]}>
                {!session.revoked ? (
                  <TouchableOpacity
                    style={styles.revokeBtn}
                    onPress={() => handleRevoke(session.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.revokeBtnText}>Revocar</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.revokedLabel}>—</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Info note */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 La revocación de sesiones es local en esta versión (mock). La integración con la
          API real está preparada en <Text style={styles.infoCode}>services/api/cmsApi.ts</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 28,
    paddingBottom: 48,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#FAFAFA' },
  cell: {
    fontSize: 13,
    color: '#1E293B',
  },
  headerCell: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellUser: {
    width: 90,
    marginRight: 12,
  },
  cellDevice: {
    flex: 1,
    marginRight: 12,
  },
  cellDate: {
    width: 130,
    marginRight: 12,
  },
  cellStatus: {
    width: 80,
    marginRight: 12,
  },
  cellAction: {
    width: 80,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748B',
  },
  dateText: {
    fontSize: 12,
    color: '#475569',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: '#F0FDF4',
  },
  badgeRevoked: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#15803D',
  },
  badgeTextRevoked: {
    color: '#B91C1C',
  },
  revokeBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  revokeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  revokedLabel: {
    color: '#CBD5E1',
    fontSize: 16,
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoText: {
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  infoCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0369A1',
  },
});
