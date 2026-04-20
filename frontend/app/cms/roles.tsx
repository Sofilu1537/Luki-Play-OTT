import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { RolesOverviewTab, CmsUsersTab } from '../../components/cms/roles';

type Tab = 'roles' | 'users';

export default function RolesPage() {
  const [tab, setTab] = useState<Tab>('roles');

  return (
    <CmsShell breadcrumbs={[{ label: 'Roles y Permisos' }]}>
      <View style={{ flex: 1 }}>
        {/* Tab bar */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 16 }}>
          {([
            { key: 'roles' as Tab, label: 'Roles', icon: 'shield' as const },
            { key: 'users' as Tab, label: 'Usuarios CMS', icon: 'user-plus' as const },
          ]).map((t) => {
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? C.accent : 'transparent',
                  marginBottom: -1,
                }}
              >
                <FontAwesome name={t.icon} size={13} color={active ? C.accent : C.muted} />
                <Text style={{ color: active ? C.accent : C.textSec, fontSize: 13, fontWeight: '700' }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {tab === 'roles' ? <RolesOverviewTab /> : <CmsUsersTab />}
      </View>
    </CmsShell>
  );
}

