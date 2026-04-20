import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MiniChart from '../ui/MiniChart';
import { useTheme } from '../../../hooks/useTheme';

interface StatsCardProps {
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  data: number[];
}

export default function StatsCard({
  label,
  value,
  trend,
  trendPositive,
  icon,
  color,
  data,
}: StatsCardProps) {
  const { theme } = useTheme();
  const trendColor = trendPositive ? '#17D1C6' : '#D1105A';

  return (
    <View
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: theme.cardBg,
        borderRadius: 16,
        padding: 20,
        margin: 6,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: theme.textMuted,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            flex: 1,
            marginRight: 8,
            fontFamily: 'Manrope',
          }}
        >
          {label}
        </Text>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name={icon} size={15} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text
        style={{
          color: theme.text,
          fontSize: 26,
          fontWeight: '700',
          marginBottom: 10,
          letterSpacing: -0.5,
          fontFamily: 'Manrope',
        }}
      >
        {value}
      </Text>

      {/* Bottom: trend + sparkline */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <Text
          style={{
            color: trendColor,
            fontSize: 12,
            fontWeight: '700',
            fontFamily: 'Manrope',
          }}
        >
          {trend}
        </Text>
        <MiniChart data={data} color={color} height={28} width={68} />
      </View>
    </View>
  );
}
