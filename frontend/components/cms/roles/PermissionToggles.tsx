import React from 'react';
import { View, Text, Switch } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../../hooks/useTheme';
import type { PermissionToggleItem } from './types';

interface PermissionTogglesProps {
  items: PermissionToggleItem[];
  readOnly?: boolean;
  onChange?: (key: string, enabled: boolean) => void;
}

export default function PermissionToggles({ items, readOnly, onChange }: PermissionTogglesProps) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const canToggle = !readOnly && !item.locked;

        return (
          <View
            key={item.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: theme.border,
              opacity: item.locked && !item.enabled ? 0.45 : 1,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: item.enabled ? theme.accentSoft : `${theme.textMuted}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <FontAwesome
                name={item.icon}
                size={14}
                color={item.enabled ? theme.accent : theme.textMuted}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>
                {item.label}
              </Text>
              {item.locked && item.lockReason ? (
                <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                  {item.lockReason}
                </Text>
              ) : null}
            </View>

            {item.locked ? (
              <FontAwesome
                name={item.enabled ? 'lock' : 'ban'}
                size={14}
                color={item.enabled ? theme.accent : theme.textMuted}
              />
            ) : (
              <Switch
                value={item.enabled}
                disabled={!canToggle}
                onValueChange={(value) => onChange?.(item.key, value)}
                trackColor={{ false: `${theme.textMuted}40`, true: theme.accentSoft }}
                thumbColor={item.enabled ? theme.accent : theme.textMuted}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
