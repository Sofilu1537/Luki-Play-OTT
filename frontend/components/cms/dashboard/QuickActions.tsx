import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';

interface QuickAction {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
  path: string;
  accentColor: string;
}

const ACTIONS: QuickAction[] = [
  {
    icon: 'tv',
    title: 'Agregar canal',
    description: 'Configura un nuevo canal en vivo',
    path: '/cms/canales',
    accentColor: '#17D1C6',
  },
  {
    icon: 'play-circle',
    title: 'Subir contenido',
    description: 'Agrega VOD o contenido destacado',
    path: '/cms/componentes',
    accentColor: '#FFB800',
  },
  {
    icon: 'credit-card',
    title: 'Gestionar planes',
    description: 'Edita planes de suscripción',
    path: '/cms/planes',
    accentColor: '#B07CC6',
  },
];

export default function QuickActions() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.path}
          onPress={() => router.push(action.path as never)}
          activeOpacity={0.75}
          style={{
            flex: 1,
            minWidth: 180,
            backgroundColor: theme.cardBg,
            borderRadius: 14,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: `${action.accentColor}18`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${action.accentColor}30`,
            }}
          >
            <FontAwesome name={action.icon} size={17} color={action.accentColor} />
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: '700',
                marginBottom: 3,
                fontFamily: 'Manrope',
              }}
            >
              {action.title}
            </Text>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 11,
                fontWeight: '500',
                lineHeight: 15,
                fontFamily: 'Manrope',
              }}
            >
              {action.description}
            </Text>
          </View>

          <FontAwesome name="chevron-right" size={10} color={theme.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
