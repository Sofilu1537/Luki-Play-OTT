import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';
import { useTheme } from '../../../hooks/useTheme';
import type { AdminCanal } from '../../../services/api/adminApi';

interface ChannelsWidgetProps {
  channels:  AdminCanal[];
  isLoading: boolean;
}

interface StatRowProps {
  label:    string;
  value:    string | number;
  color:    string;
  icon:     React.ComponentProps<typeof FontAwesome>['name'];
  sublabel?: string;
}

function StatRow({ label, value, color, icon, sublabel }: StatRowProps) {
  const { isDark, theme } = useTheme();

  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      paddingVertical: 10,
      gap:             12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? C.border : 'rgba(120,120,120,0.10)',
    }}>
      <View style={{
        width:           38,
        height:          38,
        borderRadius:    10,
        backgroundColor: `${color}18`,
        alignItems:      'center',
        justifyContent:  'center',
        borderWidth:     1,
        borderColor:     `${color}30`,
      }}>
        <FontAwesome name={icon} size={15} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          color:      isDark ? C.muted : theme.textMuted,
          fontSize:   10.5,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          fontFamily: FONT_FAMILY.bodyBold,
        }}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={{ color: isDark ? C.muted : theme.textSec, fontSize: 9, fontFamily: FONT_FAMILY.body, opacity: 0.8 }}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      <Text style={{
        color:      color,
        fontSize:   24,
        fontWeight: '800',
        fontFamily: FONT_FAMILY.bodyBold,
      }}>
        {value}
      </Text>
    </View>
  );
}

export default function ChannelsWidget({ channels, isLoading }: ChannelsWidgetProps) {
  const { isDark, theme } = useTheme();
  const total   = channels.length;

  // EN VIVO AHORA: isLive=true + viewerCount > 0
  const enVivo   = channels.filter(c => c.isLive && c.viewerCount > 0).length;

  // ACTIVO: status ACTIVE (igual que módulo de canales)
  const activo   = channels.filter(c => c.status === 'ACTIVE').length;

  // SIN SEÑAL: cron ya chequeó el canal (lastHealthCheckAt existe) y está OFFLINE
  const sinSenal = channels.filter(
    c => c.status === 'ACTIVE' && c.lastHealthCheckAt != null && c.healthStatus === 'OFFLINE',
  ).length;

  return (
    <View style={{
      flex:            1,
      backgroundColor: isDark ? C.bg : 'rgba(120,120,120,0.36)',
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     isDark ? C.borderMid : 'rgba(120,120,120,0.16)',
      overflow:        'hidden',
      shadowColor:     '#240046',
      shadowOpacity:   isDark ? 0 : 0.08,
      shadowRadius:    isDark ? 0 : 20,
      shadowOffset:    { width: 0, height: 6 },
      elevation:       isDark ? 0 : 2,
    }}>
      {/* Header */}
      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        paddingHorizontal: 18,
        paddingVertical:  14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? C.border : 'rgba(120,120,120,0.10)',
        gap:              8,
      }}>
        <FontAwesome name="tv" size={14} color={isDark ? C.muted : theme.textMuted} />
        <Text style={{
          color:      isDark ? C.text : theme.text,
          fontSize:   15,
          fontWeight: '700',
          fontFamily: FONT_FAMILY.bodySemiBold,
          flex:       1,
        }}>
          Canales
        </Text>
        {/* Total badge */}
        <View style={{
          backgroundColor:  'rgba(23,209,198,0.14)',
          borderRadius:     6,
          paddingHorizontal: 8,
          paddingVertical:  2,
          borderWidth:      1,
          borderColor:      'rgba(23,209,198,0.28)',
        }}>
          <Text style={{ color: C.cyan, fontSize: 12, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
            {isLoading ? '—' : total} total
          </Text>
        </View>
      </View>

      <View style={{ padding: 14, gap: 0 }}>
        <StatRow
          label="En vivo ahora"
          icon="circle"
          color="#FF4444"
          value={isLoading ? '—' : enVivo}
        />
        <StatRow
          label="Activos"
          icon="check-circle"
          color={C.cyan}
          value={isLoading ? '—' : activo}
        />
        <StatRow
          label="Sin señal"
          icon="exclamation-triangle"
          color="#FFB800"
          value={isLoading ? '—' : sinSenal}
        />
      </View>
    </View>
  );
}
