import React from 'react';
import { View, Text, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MiniChart from '../ui/MiniChart';
import { FONT_FAMILY } from '../../../styles/typography';
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
  minWidth?:     number;
  mode?:         'default' | 'tv';
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
  minWidth,
  mode = 'default',
}: StatsCardProps) {
  const { isDark, theme } = useTheme();
  const cardTextColor   = theme.text;
  const iconBorderColor = isDark ? `${color}35` : theme.iconBorderSoft;
  const isTv = mode === 'tv';
  const softUiShadow = !isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadow } as any)
    : {};
  const softUiShadowDark = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadowDark } as any)
    : {};

  return (
    <View
      style={{
        flex: 1,
        minWidth: minWidth ?? 200,
        backgroundColor: theme.cardBg,
        borderRadius: 14,
        padding: isTv ? 20 : 18,
        margin: 5,
        borderWidth: 1,
        borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
        shadowColor: theme.cardShadow,
        shadowOpacity: isDark ? 0.34 : 0.18,
        shadowRadius: isDark ? 16 : 12,
        shadowOffset: { width: isDark ? 8 : 6, height: isDark ? 8 : 6 },
        elevation: isDark ? 10 : 6,
        ...softUiShadow,
        ...softUiShadowDark,
      }}
    >
      {/* Label + icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <Text style={{
          color:         labelColor ?? (isDark ? theme.textSec : '#240046'),
          fontSize:      isTv ? 13 : 15,
          fontWeight:    '700',
          flex:          1,
          marginRight:   8,
          fontFamily:    FONT_FAMILY.bodySemiBold,
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
          borderColor:     iconBorderColor,
        }}>
          <FontAwesome name={icon} size={isTv ? 18 : 16} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text style={{
        color:         cardTextColor,
        fontSize:      isTv ? 36 : 32,
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
          color:        cardTextColor,
          fontSize:     isTv ? 13 : 12,
          marginBottom: 10,
          fontFamily:   FONT_FAMILY.body,
        }}>
          {subtitle}
        </Text>
      ) : null}

      {/* Trend + sparkline */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <Text style={{
          color:      cardTextColor,
          fontSize:   isTv ? 13 : 12,
          fontWeight: '700',
          fontFamily: FONT_FAMILY.bodySemiBold,
          flex:       1,
        }}>
          {trend}
        </Text>
        {data && data.length > 0 && (
          <MiniChart data={data} color={color} height={isTv ? 28 : 24} width={isTv ? 72 : 60} />
        )}
      </View>
    </View>
  );
}

