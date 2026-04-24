import React from 'react';
import { View, Text, Image } from 'react-native';

const LOGO_ICON = require('../assets/branding/logo.jpeg');

/**
 * LukiPlayLogo — Logo de Luki Play.
 *
 * Variantes:
 * - "full"    → Imagen real del branding (para login, splash)
 * - "compact" → Solo texto "luki" + badge "play" sin fondo (para sidebar, headers)
 * - "icon"    → Imagen cuadrada con border radius (para favicons, avatares)
 */

interface Props {
  variant?: 'full' | 'compact' | 'icon';
  size?: number;
}

export default function LukiPlayLogo({ variant = 'full', size = 120 }: Props) {
  const scale = size / 120;

  if (variant === 'icon') {
    return (
      <View style={{ width: size, height: size, borderRadius: size * 0.22, overflow: 'hidden' }}>
        <Image
          source={LOGO_ICON}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
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

  // variant === 'full' — usa la imagen real del branding
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, overflow: 'hidden' }}>
      <Image
        source={LOGO_ICON}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}
