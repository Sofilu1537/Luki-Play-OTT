import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { FONT_FAMILY } from '../../../styles/typography';
import { useTheme } from '../../../hooks/useTheme';

interface QuickAction {
  icon:         React.ComponentProps<typeof FontAwesome>['name'];
  title:        string;
  description:  string;
  path:         string;
  accentColor:  string;
}

const ACTIONS: QuickAction[] = [
  {
    icon:        'users',
    title:       'Gestionar usuarios',
    description: 'Abonados, planes y sesiones',
    path:        '/cms/users',
    accentColor: '#B07CC6',
  },
  {
    icon:        'bar-chart',
    title:       'Monitoreo',
    description: 'Salud y uptime de canales',
    path:        '/cms/monitor',
    accentColor: '#1E96FC',
  },
  {
    icon:        'tv',
    title:       'Crear canal',
    description: 'Configura un nuevo canal en vivo',
    path:        '/cms/canales',
    accentColor: '#17D1C6',
  },
  {
    icon:        'play-circle',
    title:       'Añadir componente',
    description: 'Agrega VOD o contenido destacado',
    path:        '/cms/componentes',
    accentColor: '#FFB800',
  },
];

export default function QuickActions({
  minItemWidth = 160,
  showDescription = false,
}: {
  minItemWidth?: number;
  showDescription?: boolean;
}) {
  const router = useRouter();
  const { isDark, theme } = useTheme();
  const softUiShadow = !isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadow } as any)
    : {};
  const softUiShadowDark = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadowDark } as any)
    : {};

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.title}
          onPress={() => router.push(action.path as never)}
          activeOpacity={0.72}
          style={{
            flex: 1,
            minWidth: minItemWidth,
            backgroundColor: theme.cardBg,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: theme.cardShadow,
            shadowOpacity: isDark ? 0.3 : 0.16,
            shadowRadius: isDark ? 14 : 10,
            shadowOffset: { width: isDark ? 7 : 5, height: isDark ? 7 : 5 },
            elevation: isDark ? 9 : 5,
            ...softUiShadow,
            ...softUiShadowDark,
          }}
        >
          {/* Icon */}
          <View style={{
            width:           46,
            height:          46,
            borderRadius:    12,
            backgroundColor: `${action.accentColor}18`,
            alignItems:      'center',
            justifyContent:  'center',
            borderWidth:     1,
            borderColor:     `${action.accentColor}30`,
          }}>
            <FontAwesome name={action.icon} size={18} color={action.accentColor} />
          </View>

          {/* Labels */}
          <View style={{ flex: 1 }}>
            <Text style={{
              color:        theme.text,
              fontSize:     15,
              fontWeight:   '700',
              fontFamily:   FONT_FAMILY.bodySemiBold,
            }}>
              {action.title}
            </Text>
            {showDescription ? (
              <Text style={{
                color: theme.textMuted,
                fontSize: 12,
                marginTop: 3,
                fontFamily: FONT_FAMILY.body,
              }}>
                {action.description}
              </Text>
            ) : null}
          </View>

          <FontAwesome name="chevron-right" size={11} color={theme.chevron} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

