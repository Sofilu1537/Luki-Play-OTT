import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';

interface StatsSnapshot {
  totalUsers:        number;
  totalSubscribers:  number;
  dau:               number;
  churned:           number;
  byStatus: {
    active:    number;
    suspended: number;
    inactive:  number;
    pending:   number;
  };
}

interface UserBehaviorProps {
  stats:     StatsSnapshot | null;
  isLoading: boolean;
}

interface Row {
  label:  string;
  value:  number;
  color:  string;
  icon:   React.ComponentProps<typeof FontAwesome>['name'];
}

export default function RecentContent({ stats, isLoading }: UserBehaviorProps) {
  const totalForPct = stats?.totalUsers ?? 0;

  const rows: Row[] = [
    { label: 'Activos',     value: stats?.byStatus.active    ?? 0, color: '#17D1C6', icon: 'check-circle' },
    { label: 'Suscritos',   value: stats?.totalSubscribers   ?? 0, color: '#1E96FC', icon: 'star'         },
    { label: 'DAU hoy',     value: stats?.dau                ?? 0, color: '#FFB800', icon: 'bolt'         },
    { label: 'Suspendidos', value: stats?.byStatus.suspended ?? 0, color: '#FF7900', icon: 'ban'          },
    { label: 'Inactivos',   value: stats?.byStatus.inactive  ?? 0, color: '#D1105A', icon: 'times-circle' },
    { label: 'Pendientes',  value: stats?.byStatus.pending   ?? 0, color: '#B07CC6', icon: 'clock-o'      },
  ];

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     C.border,
      overflow:        'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        justifyContent:   'space-between',
        paddingHorizontal: 18,
        paddingVertical:  14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome name="users" size={12} color={C.muted} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
            Usuarios y comportamiento
          </Text>
        </View>
        {!isLoading && totalForPct > 0 && (
          <Text style={{ color: C.muted, fontSize: 11, fontFamily: FONT_FAMILY.body }}>
            {totalForPct} total
          </Text>
        )}
      </View>

      {/* Rows */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {isLoading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Text style={{ color: C.muted, fontSize: 12, fontFamily: FONT_FAMILY.body }}>Cargando…</Text>
          </View>
        ) : (
          rows.map((row, index) => {
            const pct = totalForPct > 0 ? Math.min(100, Math.round((row.value / totalForPct) * 100)) : 0;
            return (
              <View key={row.label} style={{
                flexDirection:     'row',
                alignItems:        'center',
                paddingVertical:   10,
                borderBottomWidth: index < rows.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
                gap:               12,
              }}>
                {/* Icon badge */}
                <View style={{
                  width:           30,
                  height:          30,
                  borderRadius:    8,
                  backgroundColor: `${row.color}18`,
                  alignItems:      'center',
                  justifyContent:  'center',
                  borderWidth:     1,
                  borderColor:     `${row.color}30`,
                }}>
                  <FontAwesome name={row.icon} size={12} color={row.color} />
                </View>

                {/* Label + progress bar */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 12, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>
                    {row.label}
                  </Text>
                  <View style={{ height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 5, flexDirection: 'row', overflow: 'hidden' }}>
                    {pct > 0 && <View style={{ height: 3, flex: pct, backgroundColor: row.color, borderRadius: 2 }} />}
                    {pct < 100 && <View style={{ flex: Math.max(0, 100 - pct) }} />}
                  </View>
                </View>

                {/* Value */}
                <Text style={{
                  color:      row.color,
                  fontSize:   15,
                  fontWeight: '800',
                  fontFamily: FONT_FAMILY.bodyBold,
                  minWidth:   36,
                  textAlign:  'right',
                }}>
                  {row.value.toLocaleString()}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

