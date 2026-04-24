import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../../hooks/useTheme';
import type { ModulePermissionRow, ModuleOp } from './types';
import { FONT_FAMILY } from '../../../styles/typography';

interface PermissionTogglesProps {
  items: ModulePermissionRow[];
  readOnly?: boolean;
  onChange?: (key: string, enabled: boolean) => void;
}

interface OpChipProps {
  op: ModuleOp;
  label: string;
  readOnly: boolean;
  onChange?: (key: string, enabled: boolean) => void;
}

function OpChip({ op, label, readOnly, onChange }: OpChipProps) {
  const { isDark, theme } = useTheme();
  const canToggle = !readOnly && !op.locked;

  const activeStyle = {
    backgroundColor: op.enabled ? theme.accentSoft : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
    borderColor:     op.enabled ? theme.accent       : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
  };

  return (
    <TouchableOpacity
      disabled={!canToggle}
      onPress={() => canToggle && onChange?.(op.key, !op.enabled)}
      activeOpacity={0.7}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 6, borderWidth: 1,
        minWidth: 68, justifyContent: 'center',
      }, activeStyle]}
    >
      {op.locked ? (
        <FontAwesome
          name={op.enabled ? 'lock' : 'ban'}
          size={9}
          color={op.enabled ? theme.accent : theme.textMuted}
        />
      ) : (
        <FontAwesome
          name={op.enabled ? 'check' : 'times'}
          size={9}
          color={op.enabled ? theme.accent : theme.textMuted}
        />
      )}
      <Text style={{
        fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
        fontFamily: FONT_FAMILY.bodyBold,
        color: op.enabled ? theme.accent : theme.textMuted,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyOp() {
  const { theme } = useTheme();
  return (
    <View style={{
      minWidth: 68, paddingVertical: 5, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>—</Text>
    </View>
  );
}

export default function PermissionToggles({ items, readOnly = false, onChange }: PermissionTogglesProps) {
  const { isDark, theme } = useTheme();

  return (
    <View style={{ gap: 0 }}>
      {/* Header row */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.15)',
      }}>
        <View style={{ flex: 1 }} />
        <Text style={{
          width: 68, textAlign: 'center',
          fontSize: 9, fontWeight: '800', letterSpacing: 1,
          color: theme.textMuted, fontFamily: FONT_FAMILY.bodyBold,
        }}>LECTURA</Text>
        <Text style={{
          width: 68, textAlign: 'center',
          fontSize: 9, fontWeight: '800', letterSpacing: 1,
          color: theme.textMuted, fontFamily: FONT_FAMILY.bodyBold,
          marginLeft: 6,
        }}>ESCRITURA</Text>
      </View>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <View
            key={item.moduleKey}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 9, paddingHorizontal: 16,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: isDark ? theme.border : 'rgba(130,130,130,0.12)',
            }}
          >
            {/* Module icon + label */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 7,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesome name={item.icon} size={12} color={theme.textSec} />
              </View>
              <Text style={{
                color: theme.text, fontSize: 13, fontWeight: '600',
                fontFamily: FONT_FAMILY.bodySemiBold,
              }}>
                {item.label}
              </Text>
            </View>

            {/* Read operation */}
            {item.read
              ? <OpChip op={item.read} label="Read" readOnly={readOnly} onChange={onChange} />
              : <EmptyOp />
            }

            <View style={{ width: 6 }} />

            {/* Write operation */}
            {item.write
              ? <OpChip op={item.write} label="Write" readOnly={readOnly} onChange={onChange} />
              : <EmptyOp />
            }
          </View>
        );
      })}
    </View>
  );
}

