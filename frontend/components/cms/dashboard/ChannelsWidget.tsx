import React from 'react';
import { View, Text, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Svg, { Circle } from 'react-native-svg';
import { FONT_FAMILY } from '../../../styles/typography';
import { useTheme } from '../../../hooks/useTheme';
import type { AdminCanal } from '../../../services/api/adminApi';

interface ChannelsWidgetProps {
  channels:  AdminCanal[];
  isLoading: boolean;
  isTv?: boolean;
}

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface ChannelStateRow {
  key: string;
  pieLabel: string;
  rowLabel: string;
  value: number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor: string;
}

function PieDonut({ slices, size = 122, strokeWidth = 16 }: { slices: PieSlice[]; size?: number; strokeWidth?: number }) {
  const { isDark, theme } = useTheme();
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let progress = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(130,130,130,0.18)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0 && slices.map((slice, index) => {
          if (slice.value <= 0) return null;
          const dash = (slice.value / total) * circumference;
          const offset = circumference - progress;
          progress += dash;
          return (
            <Circle
              key={`${slice.label}-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              fill="none"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>

      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text, fontSize: 20, fontFamily: FONT_FAMILY.bodyBold, fontWeight: '800' }}>
          {total}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 10, fontFamily: FONT_FAMILY.bodyBold, letterSpacing: 0.8 }}>
          total
        </Text>
      </View>
    </View>
  );
}

export default function ChannelsWidget({ channels, isLoading, isTv = false }: ChannelsWidgetProps) {
  const { isDark, theme } = useTheme();
  const total = channels.length;
  const softUiShadow = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadow } as any)
    : {};
  const softUiShadowDark = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadowDark } as any)
    : {};

  // EN VIVO AHORA: isLive=true + viewerCount > 0
  const enVivo = channels.filter((c) => c.isLive && c.viewerCount > 0).length;

  // ACTIVO: status ACTIVE (igual que módulo de canales)
  const activo = channels.filter((c) => c.status === 'ACTIVE').length;

  // SIN SEÑAL: cron ya chequeó el canal (lastHealthCheckAt existe) y está OFFLINE
  const sinSenal = channels.filter(
    (c) => c.status === 'ACTIVE' && c.lastHealthCheckAt != null && c.healthStatus === 'OFFLINE',
  ).length;

  // OFFLINE real fuera del conjunto ACTIVO para que el donut sume el total sin solapamientos
  const offline = Math.max(0, total - activo);
  const activoOk = Math.max(0, activo - sinSenal);

  const stateRows: ChannelStateRow[] = [
    {
      key: 'en-vivo',
      pieLabel: 'EN VIVO AHORA',
      rowLabel: 'EN VIVO AHORA',
      value: enVivo,
      icon: 'circle',
      iconColor: '#FF4B57',
    },
    {
      key: 'activo',
      pieLabel: 'ACTIVO',
      rowLabel: 'ACTIVOS',
      value: activo,
      icon: 'check-circle',
      iconColor: theme.success,
    },
    {
      key: 'sin-senal',
      pieLabel: 'SIN SEÑAL',
      rowLabel: 'SIN SEÑAL',
      value: sinSenal,
      icon: 'warning',
      iconColor: '#FFB800',
    },
  ];

  const pieSlices: PieSlice[] = stateRows.map((row) => ({
    label: row.pieLabel,
    value: row.key === 'activo' ? activoOk : row.value,
    color: row.iconColor,
  }));

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
      overflow: 'hidden',
      shadowColor: theme.cardShadow,
      shadowOpacity: isDark ? 0.36 : 0.18,
      shadowRadius: isDark ? 16 : 12,
      shadowOffset: { width: isDark ? 8 : 6, height: isDark ? 8 : 6 },
      elevation: isDark ? 10 : 6,
      ...softUiShadow,
      ...softUiShadowDark,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? theme.border : theme.iconBorderSoft,
        gap: 8,
      }}>
        <FontAwesome name="tv" size={14} color={theme.chevron} />
        <Text style={{
          color: theme.text,
          fontSize: 15,
          fontWeight: '700',
          fontFamily: FONT_FAMILY.bodySemiBold,
          flex: 1,
        }}>
          Canales
        </Text>
        <View style={{
          backgroundColor: 'rgba(23,209,198,0.14)',
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderWidth: 1,
          borderColor: 'rgba(23,209,198,0.28)',
        }}>
          <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
            {isLoading ? '—' : total} total
          </Text>
        </View>
      </View>

      {/* Body: donut + resumen */}
      <View style={{
        paddingHorizontal: 14,
        paddingVertical: isTv ? 14 : 10,
        flexDirection: 'row',
        gap: 14,
      }}>
        <View style={{ flex: 1 }}>
          {stateRows.map((row, idx) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                paddingRight: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: isTv ? 48 : 44,
                  height: isTv ? 48 : 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? `${row.iconColor}33` : theme.iconBorderSoft,
                  backgroundColor: `${row.iconColor}14`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FontAwesome name={row.icon} size={isTv ? 18 : 16} color={row.iconColor} />
                </View>
                <Text style={{ color: theme.text, fontSize: isTv ? 14 : 12.5, fontFamily: FONT_FAMILY.bodyBold, letterSpacing: 0.3 }}>
                  {row.rowLabel}
                </Text>
              </View>

              <Text style={{ color: row.iconColor, fontSize: isTv ? 22 : 19, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>
                {isLoading ? '—' : row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ width: isTv ? 220 : 190, alignItems: 'center', justifyContent: 'center', marginLeft: -6 }}>
          <PieDonut slices={isLoading ? [] : pieSlices} size={isTv ? 172 : 154} strokeWidth={isTv ? 22 : 20} />
        </View>
      </View>
    </View>
  );
}
