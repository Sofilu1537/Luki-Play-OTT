import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { C } from '../CmsShell';
import { useTheme } from '../../../hooks/useTheme';
import PermissionToggles from './PermissionToggles';
import { ROLE_META, buildToggleItems, SOPORTE_DEFAULT_PERMISSIONS, TOGGLEABLE_MODULES } from './types';

const DISPLAY_ROLES = ['superadmin', 'admin', 'soporte', 'cliente'] as const;

export default function RolesOverviewTab() {
  const { isDark } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16, maxWidth: 900 }}>
      <Text style={{ color: C.textSec, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>
        Vista general de los roles del sistema y sus permisos base. Los permisos de{' '}
        <Text style={{ color: C.accent, fontWeight: '700' }}>Administrador</Text> son configurables por usuario.
      </Text>

      {DISPLAY_ROLES.map((roleKey) => {
        const meta = ROLE_META[roleKey];
        if (!meta) return null;

        const isCliente = roleKey === 'cliente';
        const toggleItems = isCliente ? [] : buildToggleItems(roleKey, roleKey === 'admin' ? [] : []);
        const enabledCount = toggleItems.filter((t) => t.enabled).length;

        return (
          <View
            key={roleKey}
            style={{
              backgroundColor: isDark ? C.surface : 'rgba(255,255,255,0.92)',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? C.border : 'rgba(130,130,130,0.34)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? C.border : 'rgba(130,130,130,0.26)',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${meta.color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <FontAwesome name={meta.icon} size={16} color={meta.color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: isDark ? C.text : '#240046', fontSize: 15, fontWeight: '800' }}>{meta.label}</Text>
                <Text style={{ color: isDark ? C.textSec : '#240046', fontSize: 11, marginTop: 2 }}>{meta.description}</Text>
              </View>

              {!isCliente && (
                <View
                  style={{
                    backgroundColor: C.accentSoft,
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>
                    {roleKey === 'superadmin'
                      ? 'Todos'
                      : roleKey === 'admin'
                        ? 'Configurable'
                        : `${enabledCount}/${TOGGLEABLE_MODULES.length}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Permissions */}
            {isCliente ? (
              <View style={{ padding: 16 }}>
                <Text style={{ color: isDark ? C.muted : '#240046', fontSize: 12, fontStyle: 'italic' }}>
                  Solo acceso a la app OTT (playback + perfiles). Sin acceso al CMS.
                </Text>
              </View>
            ) : (
              <PermissionToggles items={toggleItems} readOnly />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
