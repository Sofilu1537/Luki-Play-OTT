import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCmsStore } from '../../services/cmsStore';
import type { CmsSession } from '../../services/api/cmsApi';

// ─── Sessions screen ──────────────────────────────────────────────────────────

/**
 * CMS Sessions screen.
 *
 * Lists all active sessions (APP and CMS audiences) with:
 * - Audience badge (APP / CMS)
 * - Device ID
 * - Created / expires timestamps
 * - Revoke button (optimistic local removal)
 *
 * Route protection: redirects to /cms/login when not authenticated.
 */
export default function CmsSessions() {
  const router = useRouter();
  const { user, sessions, loadData, revokeSession, logout } = useCmsStore();

  const [filter, setFilter] = useState<'ALL' | 'APP' | 'CMS'>('ALL');

  useEffect(() => {
    if (!user) router.replace('/cms/login' as never);
  }, [user]);

  useEffect(() => {
    if (sessions.length === 0) loadData();
  }, []);

  if (!user) return null;

  const activeSessions = sessions.filter((s) => !s.revokedAt);
  const filtered = activeSessions.filter(
    (s) => filter === 'ALL' || s.audience === filter,
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/cms/login' as never);
  };

  const handleRevoke = (session: CmsSession) => {
    Alert.alert(
      'Revocar sesión',
      `¿Revocar la sesión del dispositivo "${session.deviceId}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: () => revokeSession(session.id),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#0F172A' }}>
      {/* Mini sidebar */}
      <CmsSidebar role={user.role} activeKey="sessions" onLogout={handleLogout} />

      {/* Main content */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: '#1E293B',
            borderBottomWidth: 1,
            borderBottomColor: '#334155',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => router.push('/cms/dashboard' as never)}>
              <FontAwesome name="chevron-left" size={14} color="#64748B" />
            </TouchableOpacity>
            <Text style={{ color: '#F1F5F9', fontSize: 18, fontWeight: '700' }}>
              Sesiones activas
            </Text>
          </View>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            {filtered.length} sesión{filtered.length !== 1 ? 'es' : ''}
          </Text>
        </View>

        {/* Audience filter */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#1E293B',
          }}
        >
          {(['ALL', 'APP', 'CMS'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: filter === f ? '#2563EB' : '#1E293B',
                borderWidth: 1,
                borderColor: filter === f ? '#2563EB' : '#334155',
              }}
            >
              <Text
                style={{
                  color: filter === f ? '#fff' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {f === 'ALL' ? 'Todas' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session cards */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {filtered.length === 0 ? (
            <View
              style={{
                padding: 60,
                alignItems: 'center',
                backgroundColor: '#1E293B',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#334155',
              }}
            >
              <FontAwesome name="exchange" size={36} color="#334155" />
              <Text style={{ color: '#475569', marginTop: 16, fontSize: 15 }}>
                No hay sesiones activas
              </Text>
            </View>
          ) : (
            filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={() => handleRevoke(session)}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: CmsSession;
  onRevoke: () => void;
}

function SessionCard({ session, onRevoke }: SessionCardProps) {
  const createdAt = new Date(session.createdAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const expiresAt = new Date(session.expiresAt).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isApp = session.audience === 'APP';
  const audienceColor = isApp ? '#3B82F6' : '#8B5CF6';

  return (
    <View
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: 1,
      }}
    >
      {/* Audience icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          backgroundColor: audienceColor + '22',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FontAwesome
          name={isApp ? 'mobile' : 'desktop'}
          size={20}
          color={audienceColor}
        />
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              backgroundColor: isApp ? '#1E3A5F' : '#2E1065',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: audienceColor,
                fontSize: 10,
                fontWeight: '700',
              }}
            >
              {session.audience}
            </Text>
          </View>
          <Text
            style={{ color: '#64748B', fontSize: 11 }}
            numberOfLines={1}
          >
            {session.deviceId}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FontAwesome name="clock-o" size={11} color="#475569" />
            <Text style={{ color: '#64748B', fontSize: 11 }}>
              Iniciada: {createdAt}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <FontAwesome name="calendar-times-o" size={11} color="#475569" />
            <Text style={{ color: '#64748B', fontSize: 11 }}>
              Expira: {expiresAt}
            </Text>
          </View>
        </View>

        <Text style={{ color: '#334155', fontSize: 10 }}>
          ID: {session.id}
        </Text>
      </View>

      {/* Revoke button */}
      <TouchableOpacity
        onPress={onRevoke}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#7F1D1D',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: '#991B1B',
        }}
      >
        <FontAwesome name="ban" size={12} color="#FCA5A5" />
        <Text style={{ color: '#FCA5A5', fontSize: 12, fontWeight: '600' }}>
          Revocar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Mini sidebar ─────────────────────────────────────────────────────────────

interface CmsSidebarProps {
  role: string;
  activeKey: string;
  onLogout: () => void;
}

const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: 'th-large' as const, route: '/cms/dashboard' },
  { key: 'users',     icon: 'users' as const,    route: '/cms/users' },
  { key: 'accounts',  icon: 'file-text-o' as const, route: '/cms/accounts' },
  { key: 'sessions',  icon: 'exchange' as const, route: '/cms/sessions' },
];

function CmsSidebar({ role: _role, activeKey, onLogout }: CmsSidebarProps) {
  const router = useRouter();
  return (
    <View
      style={{
        width: 56,
        backgroundColor: '#1E293B',
        borderRightWidth: 1,
        borderRightColor: '#334155',
        paddingTop: 20,
        paddingBottom: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View>
        <View
          style={{
            width: 34,
            height: 34,
            backgroundColor: '#2563EB',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <FontAwesome name="play" size={13} color="#fff" />
        </View>
        <View style={{ gap: 4 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => router.push(item.route as never)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                backgroundColor: activeKey === item.key ? '#2563EB' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesome
                name={item.icon}
                size={15}
                color={activeKey === item.key ? '#fff' : '#64748B'}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        onPress={onLogout}
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: '#0F172A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome name="sign-out" size={15} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}
