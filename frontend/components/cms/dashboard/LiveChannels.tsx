import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useChannelStore } from '../../../services/channelStore';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';

const HEALTH_CONFIG: Record<HealthStatus, { color: string; label: string; glow: boolean }> = {
  HEALTHY:     { color: '#17D1C6', label: 'ACTIVO',  glow: true  },
  DEGRADED:    { color: '#FFB800', label: 'DEGRADADO', glow: false },
  OFFLINE:     { color: '#D1105A', label: 'OFFLINE',  glow: false },
  MAINTENANCE: { color: '#B07CC6', label: 'MANT.',    glow: false },
};

function StatusPill({ status }: { status: HealthStatus }) {
  const cfg = HEALTH_CONFIG[status] ?? HEALTH_CONFIG.OFFLINE;
  return (
    <View style={{
      backgroundColor: `${cfg.color}18`,
      borderRadius:    4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderWidth:     1,
      borderColor:     `${cfg.color}35`,
    }}>
      <Text style={{ color: cfg.color, fontSize: 8, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold, letterSpacing: 0.5 }}>
        {cfg.label}
      </Text>
    </View>
  );
}

export default function LiveChannels() {
  const { channels } = useChannelStore();

  const healthy     = channels.filter(c => c.healthStatus === 'HEALTHY').length;
  const degraded    = channels.filter(c => c.healthStatus === 'DEGRADED').length;
  const offline     = channels.filter(c => c.healthStatus === 'OFFLINE').length;
  const maintenance = channels.filter(c => c.healthStatus === 'MAINTENANCE').length;

  const topChannels = [...channels]
    .sort((a, b) => b.viewerCount - a.viewerCount)
    .slice(0, 5);

  const SUMMARY = [
    { count: healthy,     color: '#17D1C6', label: 'Activos'    },
    { count: degraded,    color: '#FFB800', label: 'Degradados' },
    { count: offline,     color: '#D1105A', label: 'Offline'    },
    { count: maintenance, color: '#B07CC6', label: 'Mant.'      },
  ];

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     C.border,
      overflow:        'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        justifyContent:   'space-between',
        paddingHorizontal: 18,
        paddingVertical:  14,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome name="tv" size={12} color={C.muted} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
            Estado de canales
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#17D1C6' }} />
          <Text style={{ color: '#17D1C6', fontSize: 11, fontWeight: '700', fontFamily: FONT_FAMILY.bodyBold }}>
            {healthy} {healthy === 1 ? 'activo' : 'activos'}
          </Text>
        </View>
      </View>

      {/* Health summary tiles */}
      <View style={{
        flexDirection:    'row',
        paddingHorizontal: 14,
        paddingVertical:  12,
        gap:              8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        {SUMMARY.map(item => (
          <View key={item.label} style={{
            flex:            1,
            backgroundColor: `${item.color}12`,
            borderRadius:    8,
            paddingVertical: 8,
            alignItems:      'center',
            borderWidth:     1,
            borderColor:     `${item.color}25`,
          }}>
            <Text style={{ color: item.color, fontSize: 18, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold, lineHeight: 22 }}>
              {item.count}
            </Text>
            <Text style={{ color: C.muted, fontSize: 9, fontFamily: FONT_FAMILY.bodyBold, letterSpacing: 0.3, textAlign: 'center' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Channel rows */}
      {channels.length === 0 ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={{ color: C.muted, fontSize: 12, fontFamily: FONT_FAMILY.body }}>
            Sin canales configurados
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          {topChannels.map((ch, i) => {
            const cfg = HEALTH_CONFIG[ch.healthStatus as HealthStatus] ?? HEALTH_CONFIG.OFFLINE;
            return (
              <View key={ch.id} style={{
                flexDirection:     'row',
                alignItems:        'center',
                paddingHorizontal: 8,
                paddingVertical:   11,
                borderBottomWidth: i < topChannels.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}>
                {/* Health dot */}
                <View style={{
                  width:         8,
                  height:        8,
                  borderRadius:  4,
                  backgroundColor: cfg.color,
                  marginRight:   12,
                  shadowColor:   cfg.glow ? cfg.color : 'transparent',
                  shadowOpacity: 0.7,
                  shadowRadius:  4,
                  shadowOffset:  { width: 0, height: 0 },
                }} />

                {/* Name + tech */}
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{ color: C.text, fontSize: 12, fontWeight: '600', fontFamily: FONT_FAMILY.bodySemiBold }}
                    numberOfLines={1}
                  >
                    {ch.nombre}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginTop: 1, fontFamily: FONT_FAMILY.body }}>
                    {ch.resolution} · {ch.streamProtocol}
                  </Text>
                </View>

                {/* Viewer count */}
                {ch.viewerCount > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10 }}>
                    <FontAwesome name="eye" size={9} color={C.muted} />
                    <Text style={{ color: C.muted, fontSize: 10, fontFamily: FONT_FAMILY.body }}>
                      {ch.viewerCount.toLocaleString()}
                    </Text>
                  </View>
                )}

                <StatusPill status={ch.healthStatus as HealthStatus} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

