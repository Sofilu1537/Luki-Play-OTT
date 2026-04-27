import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO_ICON = require('../assets/branding/logo.png');

/**
 * LukiPlayLogo — Replica visual del logo de Luki Play.
 *
 * Variantes:
 * - "full"    → Logo completo con fondo gradiente, "luki" + badge "play" (para login, splash)
 * - "compact" → Solo texto "luki" + badge "play" sin fondo (para sidebar, headers)
 * - "icon"    → Solo el ícono cuadrado con gradiente (para favicons, avatares)
 */

interface Props {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
}

function BokehCircle({ top, left, diameter, color }: { top: number; left: number; diameter: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: color,
      }}
    />
  );
}

export default function LukiPlayLogo({ variant = 'full', size = 120 }: Props) {
  const scale = size / 120;

  if (variant === 'icon') {
    return (
      <Image
        source={LOGO_ICON}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  if (variant === 'compact') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ alignItems: 'flex-end', marginRight: -2 }}>
          <View style={{ width: 6 * scale, height: 6 * scale, borderRadius: 99, backgroundColor: '#FFB800', marginBottom: 2 }} />
        </View>
        <Text style={{ color: '#fff', fontSize: 22 * scale, fontWeight: '900', letterSpacing: -0.8 }}>luki</Text>
        <View style={{ backgroundColor: '#FFB800', borderRadius: 6 * scale, paddingHorizontal: 8 * scale, paddingVertical: 3 * scale, marginLeft: 4 }}>
          <Text style={{ color: '#fff', fontSize: 13 * scale, fontWeight: '800' }}>play</Text>
        </View>
      </View>
    );
  }

  // variant === 'full'
  const w = size;
  const h = size;

  return (
    <View style={{ width: w, height: h, borderRadius: w * 0.22, overflow: 'hidden' }}>
      <LinearGradient
        colors={['#7B2FBE', '#5A1E9E', '#3A0C6E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: w, height: h }}
      />
      {/* Bokeh */}
      <BokehCircle top={-13 * scale} left={-18 * scale} diameter={76 * scale} color="rgba(123,47,190,0.28)" />
      <BokehCircle top={58 * scale} left={68 * scale} diameter={64 * scale} color="rgba(90,30,158,0.22)" />
      <BokehCircle top={-5 * scale} left={70 * scale} diameter={40 * scale} color="rgba(140,60,200,0.16)" />
      <BokehCircle top={75 * scale} left={35 * scale} diameter={50 * scale} color="rgba(90,30,158,0.12)" />
      {/* luki + play overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {/* Dot */}
        <View style={{ position: 'absolute', top: h * 0.2, right: w * 0.32 }}>
          <View style={{ width: w * 0.07, height: w * 0.07, borderRadius: 99, backgroundColor: '#FFB800' }} />
        </View>
        <Text style={{ color: '#fff', fontSize: w * 0.32, fontWeight: '900', letterSpacing: -1.5, marginBottom: w * 0.01 }}>luki</Text>
        <View style={{ backgroundColor: '#FFB800', borderRadius: w * 0.07, paddingHorizontal: w * 0.12, paddingVertical: w * 0.03 }}>
          <Text style={{ color: '#fff', fontSize: w * 0.18, fontWeight: '800' }}>play</Text>
        </View>
      </View>
    </View>
  );
}
