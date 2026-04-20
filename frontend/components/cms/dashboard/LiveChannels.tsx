import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StatusBadge from '../ui/StatusBadge';
import { useTheme } from '../../../hooks/useTheme';
import { FONT_FAMILY } from '../../../styles/typography';

interface Channel {
  id: string;
  name: string;
  quality: '720p' | '1080p' | '4K';
  viewers: number;
  status: 'live' | 'scheduled' | 'offline';
}

const MOCK_CHANNELS: Channel[] = [
  { id: '1', name: 'Luki Play Deportes',         quality: '1080p', viewers: 1284, status: 'live'      },
  { id: '2', name: 'Luki Play Noticias',          quality: '720p',  viewers: 847,  status: 'live'      },
  { id: '3', name: 'Luki Play Entretenimiento',   quality: '1080p', viewers: 562,  status: 'live'      },
  { id: '4', name: 'FIFA WC 2026 — Preview',      quality: '4K',    viewers: 0,    status: 'scheduled' },
];

export default function LiveChannels() {
  const { theme } = useTheme();
  const liveCount = MOCK_CHANNELS.filter((c) => c.status === 'live').length;

  return (
    <View
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FontAwesome name="tv" size={13} color={theme.textMuted} />
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
            Canales en vivo
          </Text>
        </View>
        <StatusBadge variant="live" label={`${liveCount} activos`} size="sm" />
      </View>

      {/* Channel list */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        {MOCK_CHANNELS.map((channel, index) => {
          const dotColor =
            channel.status === 'live' ? '#17D1C6'
            : channel.status === 'scheduled' ? '#FFB800'
            : 'rgba(255,255,255,0.18)';

          return (
            <View
              key={channel.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 13,
                borderBottomWidth: index < MOCK_CHANNELS.length - 1 ? 1 : 0,
                borderBottomColor: theme.border,
              }}
            >
              {/* Status dot */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: dotColor,
                  marginRight: 12,
                  shadowColor: channel.status === 'live' ? dotColor : 'transparent',
                  shadowOpacity: 0.9,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />

              {/* Name + quality */}
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={{ color: theme.text, fontSize: 13, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}
                  numberOfLines={1}
                >
                  {channel.name}
                </Text>
                <Text
                  style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2, fontFamily: FONT_FAMILY.bodySemiBold }}
                >
                  {channel.quality}
                </Text>
              </View>

              {/* Viewers (live only) */}
              {channel.status === 'live' && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10 }}
                >
                  <FontAwesome name="eye" size={9} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}>
                    {channel.viewers.toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Badge */}
              <StatusBadge
                variant={
                  channel.status === 'live' ? 'live'
                  : channel.status === 'scheduled' ? 'scheduled'
                  : 'inactive'
                }
                label={
                  channel.status === 'live' ? 'En vivo'
                  : channel.status === 'scheduled' ? 'Prog.'
                  : 'Offline'
                }
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
