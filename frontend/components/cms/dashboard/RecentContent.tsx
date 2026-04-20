import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import StatusBadge from '../ui/StatusBadge';
import { useTheme } from '../../../hooks/useTheme';

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
  const { theme } = useTheme();

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
          <FontAwesome name="play-circle" size={13} color={theme.textMuted} />
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', fontFamily: 'Manrope' }}>
            Contenido reciente
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '600', fontFamily: 'Manrope' }}>
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
              borderBottomColor: theme.border,
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 5,
                fontFamily: 'Manrope',
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
                  <FontAwesome name="eye" size={9} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600', fontFamily: 'Manrope' }}>
                    {item.views.toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600', fontFamily: 'Manrope' }}>
                {item.addedAt}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
