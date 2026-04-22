import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MiniChart from '../ui/MiniChart';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';
import { useTheme } from '../../../hooks/useTheme';

interface StatsCardProps {
  label:         string;
  value:         string;
  trend:         string;
  trendPositive: boolean;
  icon:          React.ComponentProps<typeof FontAwesome>['name'];
  color:         string;
  data?:         number[];
  subtitle?:     string;
  labelColor?:   string;
}

export default function StatsCard({
  label,
  value,
  trend,
  trendPositive,
  icon,
  color,
  data,
  subtitle,
  labelColor,
}: StatsCardProps) {
  const { isDark, theme } = useTheme();
  const trendColor = trendPositive ? theme.success : theme.danger;

  return (
    <View
      style={{
        flex:            1,
        minWidth:        200,
        backgroundColor: isDark ? C.bgTertiary : 'rgba(120,120,120,0.36)',
        borderRadius:    14,
        padding:         18,
        margin:          5,
        borderWidth:     1,
        borderColor:     isDark ? C.borderMid : 'rgba(120,120,120,0.16)',
        shadowColor:     '#240046',
        shadowOpacity:   isDark ? 0 : 0.08,
        shadowRadius:    isDark ? 0 : 20,
        shadowOffset:    { width: 0, height: 6 },
        elevation:       isDark ? 0 : 2,
      }}
    >
      {/* Label + icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <Text style={{
          color:         labelColor ?? (isDark ? C.text : theme.text),
          fontSize:      10.5,
          fontWeight:    '700',
          letterSpacing: 1.0,
          textTransform: 'uppercase',
          flex:          1,
          marginRight:   8,
          fontFamily:    FONT_FAMILY.bodyBold,
        }}>
          {label}
        </Text>
        <View style={{
          width:           38,
          height:          38,
          borderRadius:    10,
          backgroundColor: `${color}18`,
          alignItems:      'center',
          justifyContent:  'center',
          borderWidth:     1,
          borderColor:     `${color}35`,
        }}>
          <FontAwesome name={icon} size={16} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text style={{
        color:         isDark ? C.text : theme.text,
        fontSize:      32,
        fontWeight:    '800',
        letterSpacing: -0.5,
        marginBottom:  subtitle ? 2 : 10,
        fontFamily:    FONT_FAMILY.bodyBold,
      }}>
        {value}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={{
          color:        isDark ? C.muted : theme.textSec,
          fontSize:     12,
          marginBottom: 10,
          fontFamily:   FONT_FAMILY.body,
        }}>
          {subtitle}
        </Text>
      ) : null}

      {/* Trend + sparkline */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <Text style={{
          color:      trendColor,
          fontSize:   12,
          fontWeight: '700',
          fontFamily: FONT_FAMILY.bodySemiBold,
          flex:       1,
        }}>
          {trend}
        </Text>
        {data && data.length > 0 && (
          <MiniChart data={data} color={color} height={24} width={60} />
        )}
      </View>
    </View>
  );
}

