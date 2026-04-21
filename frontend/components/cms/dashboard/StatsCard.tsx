import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MiniChart from '../ui/MiniChart';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';

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
  const trendColor = trendPositive ? '#17D1C6' : '#D1105A';

  return (
    <View
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        margin: 6,
        borderWidth: 1,
        borderColor: 'rgba(36, 0, 70, 0.1)',
        shadowColor: '#240046',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Top row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: '#60269E',
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            flex: 1,
            marginRight: 8,
            fontFamily: FONT_FAMILY.bodyBold,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: `${color}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name={icon} size={14} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text
        style={{
          color: '#240046',
          fontSize: 24,
          fontWeight: '800',
          marginBottom: 10,
          letterSpacing: -0.3,
          fontFamily: FONT_FAMILY.bodyBold,
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
          gap: 8,
        }}
      >
        <Text
          style={{
            color: trendColor,
            fontSize: 11,
            fontWeight: '700',
            fontFamily: FONT_FAMILY.bodySemiBold,
            flex: 1,
          }}
        >
          {trend}
        </Text>
        <MiniChart data={data} color={color} height={24} width={60} />
      </View>
    </View>
  );
}
