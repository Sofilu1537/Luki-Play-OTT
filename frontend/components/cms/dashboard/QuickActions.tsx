import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';
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

export default function QuickActions() {
  const router = useRouter();
  const { isDark, theme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.title}
          onPress={() => router.push(action.path as never)}
          activeOpacity={0.72}
          style={{
            flex:            1,
            minWidth:        160,
            backgroundColor: isDark ? C.bgTertiary : 'rgba(255,255,255,0.92)',
            borderRadius:    14,
            padding:         16,
            borderWidth:     1,
            borderColor:     isDark ? C.borderMid : 'rgba(130,130,130,0.34)',
            flexDirection:   'row',
            alignItems:      'center',
            gap:             12,
            shadowColor:     '#240046',
            shadowOpacity:   isDark ? 0 : 0.08,
            shadowRadius:    isDark ? 0 : 20,
            shadowOffset:    { width: 0, height: 6 },
            elevation:       isDark ? 0 : 2,
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
              color:        isDark ? C.text : theme.text,
              fontSize:     15,
              fontWeight:   '700',
              fontFamily:   FONT_FAMILY.bodySemiBold,
            }}>
              {action.title}
            </Text>
          </View>

          <FontAwesome name="chevron-right" size={11} color={isDark ? C.muted : theme.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

