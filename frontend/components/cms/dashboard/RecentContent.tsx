import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StatusBadge from '../ui/StatusBadge';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';

interface ContentItem {
  id: string;
  title: string;
  type: 'vod' | 'live';
  views: number;
  addedAt: string;
}

const MOCK_CONTENT: ContentItem[] = [
  { id: '1', title: 'Resumen Copa América 2025',       type: 'vod',  views: 4821, addedAt: 'Hace 2h'     },
  { id: '2', title: 'Noticias Ecuador — Edición noche',type: 'live', views: 1102, addedAt: 'Hace 4h'     },
  { id: '3', title: 'Documental: Fútbol Ecuatoriano',  type: 'vod',  views: 3290, addedAt: 'Ayer'        },
  { id: '4', title: 'Highlights Liga Pro Semana 14',   type: 'vod',  views: 7830, addedAt: 'Ayer'        },
  { id: '5', title: 'Show de Noticias — Mañana',       type: 'live', views: 540,  addedAt: 'Hace 3 días' },
];

export default function RecentContent() {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FontAwesome name="play-circle" size={13} color={C.muted} />
          <Text style={{ color: C.text, fontSize: 13, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
            Contenido reciente
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
            Ver todo
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        {MOCK_CONTENT.map((item, index) => (
          <View
            key={item.id}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 11,
              borderBottomWidth: index < MOCK_CONTENT.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <Text
              style={{
                color: C.text,
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 6,
                fontFamily: FONT_FAMILY.bodySemiBold,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <StatusBadge
                  variant={item.type === 'vod' ? 'vod' : 'live'}
                  label={item.type.toUpperCase()}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <FontAwesome name="eye" size={9} color={C.muted} />
                  <Text style={{ color: C.muted, fontSize: 10, fontWeight: '500', fontFamily: FONT_FAMILY.bodySemiBold }}>
                    {item.views.toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: '500', fontFamily: FONT_FAMILY.bodySemiBold }}>
                {item.addedAt}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
