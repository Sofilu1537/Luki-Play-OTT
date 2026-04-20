import React from 'react';
import { View } from 'react-native';

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
}

export default function MiniChart({ data, color, height = 32, width = 80 }: MiniChartProps) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const gap = 2;
  const barW = Math.max(3, Math.floor((width - gap * (data.length - 1)) / data.length));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, width, gap }}>
      {data.map((value, index) => {
        const normalized = (value - min) / range;
        const barHeight = Math.max(3, normalized * height);
        const opacity = 0.30 + 0.70 * (index / Math.max(data.length - 1, 1));

        return (
          <View
            key={index}
            style={{
              width: barW,
              height: barHeight,
              backgroundColor: color,
              borderRadius: 2,
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}
