import React from 'react';
import { View, Text, Platform } from 'react-native';
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
  const cardTextColor = isDark ? C.text : '#240046';
  const iconBorderColor = isDark ? `${color}35` : 'rgba(130,130,130,0.18)';
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
        backgroundColor: isDark ? C.bgTertiary : '#fff',
        borderRadius: 14,
        padding: isTv ? 20 : 18,
        margin: 5,
        borderWidth: 1,
        borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
        shadowColor: isDark ? '#000000' : '#A8B0C7',
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
          color:         labelColor ?? cardTextColor,
          fontSize:      isTv ? 11.5 : 10.5,
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

