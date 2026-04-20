import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant =
  | 'live' | 'scheduled' | 'vod' | 'active'
  | 'inactive' | 'suspended' | 'tag'
  | 'info' | 'success' | 'danger' | 'warning';

interface StyleDef { bg: string; color: string; dot: boolean }

const STYLES: Record<BadgeVariant, StyleDef> = {
  live:      { bg: 'rgba(23,209,198,0.15)',  color: '#17D1C6', dot: true  },
  scheduled: { bg: 'rgba(255,184,0,0.14)',   color: '#FFB800', dot: false },
  vod:       { bg: 'rgba(176,124,198,0.15)', color: '#B07CC6', dot: false },
  active:    { bg: 'rgba(23,209,198,0.12)',  color: '#17D1C6', dot: true  },
  inactive:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)', dot: false },
  suspended: { bg: 'rgba(255,121,0,0.14)',   color: '#FF7900', dot: false },
  tag:       { bg: 'rgba(176,124,198,0.14)', color: '#B07CC6', dot: false },
  info:      { bg: 'rgba(30,150,252,0.14)',  color: '#1E96FC', dot: false },
  success:   { bg: 'rgba(23,209,198,0.14)',  color: '#17D1C6', dot: false },
  danger:    { bg: 'rgba(209,16,90,0.14)',   color: '#D1105A', dot: false },
  warning:   { bg: 'rgba(255,121,0,0.14)',   color: '#FF7900', dot: false },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ variant, label, size = 'sm' }: StatusBadgeProps) {
  const s = STYLES[variant] ?? STYLES.info;
  const fontSize = size === 'sm' ? 9 : 11;
  const px = size === 'sm' ? 7 : 10;
  const py = size === 'sm' ? 3 : 5;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: s.bg,
        borderRadius: 20,
        paddingHorizontal: px,
        paddingVertical: py,
        gap: 4,
        alignSelf: 'flex-start',
      }}
    >
      {s.dot && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: s.color,
            shadowColor: s.color,
            shadowOpacity: 0.9,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
      <Text
        style={{
          color: s.color,
          fontSize,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
