import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore, MOCK_USERS, MOCK_ACCOUNTS, MOCK_SESSIONS } from '../../services/cmsStore';
import CmsPageLayout from '../../components/CmsPageLayout';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <View style={{
      flex: 1, minWidth: 160,
      backgroundColor: '#1e293b', borderRadius: 14, padding: 20,
      borderWidth: 1, borderColor: '#334155',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', flex: 1 }}>{title.toUpperCase()}</Text>
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: color + '22',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <FontAwesome name={icon as any} size={16} color={color} />
        </View>
      </View>
      <Text style={{ color: '#f1f5f9', fontSize: 28, fontWeight: '800' }}>{value}</Text>
      {subtitle ? <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * CMS Dashboard — main screen shown after CMS login.
 * Displays summary cards and a recent users table.
 * Redirects to /cms/login if not authenticated.
 */
export default function CmsDashboard() {
  const { isAuthenticated, cmsUser } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/cms/login' as any);
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const totalUsers = MOCK_USERS.length;
  const activeUsers = MOCK_USERS.filter((u) => u.role === 'CLIENT').length;
  const activeSessions = MOCK_SESSIONS.filter((s) => s.status === 'ACTIVE').length;
  const ispContracts = MOCK_ACCOUNTS.filter((a) => a.contractType === 'ISP').length;
  const ottContracts = MOCK_ACCOUNTS.filter((a) => a.contractType === 'OTT_ONLY').length;

  return (
    <CmsPageLayout title="Dashboard">
      {/* Welcome */}
      <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
        Bienvenido, {cmsUser?.email} — {cmsUser?.role === 'SUPERADMIN' ? 'Super Admin' : 'Soporte'}
      </Text>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <StatCard
          title="Total usuarios"
          value={totalUsers}
          icon="users"
          color="#3b82f6"
          subtitle="Todos los roles"
        />
        <StatCard
          title="Clientes"
          value={activeUsers}
          icon="user"
          color="#10b981"
          subtitle="Rol CLIENT"
        />
        <StatCard
          title="Sesiones activas"
          value={activeSessions}
          icon="clock-o"
          color="#f59e0b"
          subtitle="En este momento"
        />
        <StatCard
          title="Contratos ISP"
          value={ispContracts}
          icon="wifi"
          color="#6366f1"
          subtitle={`${ottContracts} OTT-only`}
        />
      </View>

      {/* Quick links */}
      <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
        ACCESO RÁPIDO
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Ver usuarios',   icon: 'users',     route: '/cms/users',    color: '#3b82f6' },
          { label: 'Ver contratos',  icon: 'file-text', route: '/cms/accounts', color: '#6366f1' },
          { label: 'Ver sesiones',   icon: 'clock-o',   route: '/cms/sessions', color: '#f59e0b' },
        ].map((link) => (
          <TouchableOpacity
            key={link.route}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11,
              borderWidth: 1, borderColor: '#334155',
            }}
            onPress={() => router.push(link.route as any)}
          >
            <FontAwesome name={link.icon as any} size={14} color={link.color} />
            <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: '500' }}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent users table */}
      <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
        USUARIOS RECIENTES
      </Text>
      <View style={{
        backgroundColor: '#1e293b', borderRadius: 12,
        borderWidth: 1, borderColor: '#334155', overflow: 'hidden',
      }}>
        {/* Table header */}
        <View style={{
          flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: '#0f172a', gap: 12,
        }}>
          {['EMAIL', 'ROL', 'CREADO'].map((h) => (
            <Text key={h} style={{ flex: h === 'EMAIL' ? 2 : 1, color: '#475569', fontSize: 10, fontWeight: '700' }}>
              {h}
            </Text>
          ))}
        </View>
        {MOCK_USERS.slice(0, 5).map((user, idx) => (
          <View
            key={user.id}
            style={{
              flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
              borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#334155', gap: 12,
            }}
          >
            <Text style={{ flex: 2, color: '#cbd5e1', fontSize: 13 }} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={{ flex: 1 }}>
              <RoleBadge role={user.role} />
            </View>
            <Text style={{ flex: 1, color: '#64748b', fontSize: 12 }}>{user.createdAt}</Text>
          </View>
        ))}
      </View>
    </CmsPageLayout>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    CLIENT: '#065f46',
    SUPPORT: '#1e3a5f',
    SUPERADMIN: '#4c1d95',
  };
  const textColors: Record<string, string> = {
    CLIENT: '#6ee7b7',
    SUPPORT: '#93c5fd',
    SUPERADMIN: '#c4b5fd',
  };
  return (
    <View style={{
      alignSelf: 'flex-start', backgroundColor: colors[role] ?? '#374151',
      borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    }}>
      <Text style={{ color: textColors[role] ?? '#d1d5db', fontSize: 10, fontWeight: '700' }}>
        {role}
      </Text>
    </View>
  );
}
