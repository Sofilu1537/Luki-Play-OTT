import React from 'react';
import { View, Text, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_FAMILY } from '../../../styles/typography';
import { C } from '../CmsShell';
import { useTheme } from '../../../hooks/useTheme';

const PLAN_PRICE = 26;

interface StatsSnapshot {
  mrr:               number;
  activeSubscribers: number;
  totalSubscribers:  number;
  churned:           number;
  churnRate:         string;
}

interface MonetizationWidgetProps {
  stats:     StatsSnapshot | null;
  isLoading: boolean;
}

function MetricTile({
  label,
  value,
  sublabel,
  color,
}: {
  label:     string;
  value:     string;
  sublabel?: string;
  color:     string;
}) {
  const { isDark, theme } = useTheme();
  const cardTextColor = isDark ? C.text : theme.text;
  const softUiShadow = !isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadow } as any)
    : {};
  const softUiShadowDark = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadowDark } as any)
    : {};

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? C.bgSecondary : '#fff',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
      alignItems: 'center',
      shadowColor: isDark ? '#000000' : '#A8B0C7',
      shadowOpacity: isDark ? 0.24 : 0.14,
      shadowRadius: isDark ? 12 : 8,
      shadowOffset: { width: isDark ? 6 : 4, height: isDark ? 6 : 4 },
      elevation: isDark ? 8 : 4,
      ...softUiShadow,
      ...softUiShadowDark,
    }}>
      <Text style={{ color, fontSize: 20, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold }}>
        {value}
      </Text>
      <Text style={{
        color:         cardTextColor,
        fontSize:      10,
        fontWeight:    '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        fontFamily:    FONT_FAMILY.bodyBold,
        marginTop:     2,
        textAlign:     'center',
      }}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={{ color: cardTextColor, fontSize: 10, fontFamily: FONT_FAMILY.body, marginTop: 1, textAlign: 'center' }}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
}

export default function MonetizationWidget({ stats, isLoading }: MonetizationWidgetProps) {
  const { isDark, theme } = useTheme();
  const cardTextColor = isDark ? C.text : theme.text;
  const accentColor = '#FFB800';
  const accentSoft = 'rgba(255,184,0,0.18)';
  const accentGradient = ['rgba(255,184,0,0.16)', 'rgba(255,184,0,0.06)'] as const;
  const accentBorder = 'rgba(255,184,0,0.28)';
  const mrr           = stats?.mrr               ?? 0;
  const arr           = mrr * 12;
  const active        = stats?.activeSubscribers  ?? 0;
  const churn         = parseFloat(stats?.churnRate ?? '0');
  const churnedRevLoss = Math.round((stats?.churned ?? 0) * PLAN_PRICE);
  const softUiShadow = !isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadow } as any)
    : {};
  const softUiShadowDark = isDark && Platform.OS === 'web'
    ? ({ boxShadow: theme.softUiShadowDark } as any)
    : {};

  return (
    <View style={{
      backgroundColor: isDark ? theme.cardBg : '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? theme.softUiBorderDark : theme.softUiBorder,
      overflow: 'hidden',
      shadowColor: isDark ? '#000000' : '#A8B0C7',
      shadowOpacity: isDark ? 0.36 : 0.18,
      shadowRadius: isDark ? 16 : 12,
      shadowOffset: { width: isDark ? 8 : 6, height: isDark ? 8 : 6 },
      elevation: isDark ? 10 : 6,
      ...softUiShadow,
      ...softUiShadowDark,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? C.border : 'rgba(130,130,130,0.18)',
        gap: 8,
      }}>
        <FontAwesome name="bar-chart" size={14} color={isDark ? C.muted : '#240046'} />
        <Text style={{ color: isDark ? C.text : '#240046', fontSize: 15, fontWeight: '700', fontFamily: FONT_FAMILY.bodySemiBold }}>
          Monetización
        </Text>
      </View>

      <View style={{ padding: 14, gap: 10 }}>
        {/* MRR hero */}
        <LinearGradient
          colors={accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 12,
            padding:      16,
            borderWidth:  1,
            borderColor:  accentBorder,
            flexDirection: 'row',
            alignItems:   'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{
              color:         cardTextColor,
              fontSize:      10,
              fontWeight:    '800',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              fontFamily:    FONT_FAMILY.bodyBold,
              marginBottom:  4,
            }}>
              MRR Actual
            </Text>
            <Text style={{ color: accentColor, fontSize: 34, fontWeight: '800', fontFamily: FONT_FAMILY.bodyBold, letterSpacing: -0.5 }}>
              {isLoading ? '—' : fmtUSD(mrr)}
            </Text>
            <Text style={{ color: cardTextColor, fontSize: 12, fontFamily: FONT_FAMILY.body, marginTop: 2 }}>
              {isLoading ? '' : `${active} abonados • $${PLAN_PRICE}/mes`}
            </Text>
          </View>
          <View style={{
            width:           52,
            height:          52,
            borderRadius:    14,
            backgroundColor: accentSoft,
            alignItems:      'center',
            justifyContent:  'center',
            borderWidth:     0,
            borderColor:     'transparent',
          }}>
            <FontAwesome name="dollar" size={22} color={accentColor} />
          </View>
        </LinearGradient>

        {/* Secondary metric tiles */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MetricTile
            label="ARR"
            value={isLoading ? '—' : fmtUSD(arr)}
            sublabel="Anualizado"
            color="#17D1C6"
          />
          <MetricTile
            label="Precio plan"
            value={`$${PLAN_PRICE}`}
            sublabel="por mes"
            color="#1E96FC"
          />
          <MetricTile
            label="Pérd. churn"
            value={isLoading ? '—' : fmtUSD(churnedRevLoss)}
            sublabel={`${churn}% tasa`}
            color={churn > 3 ? '#D1105A' : '#FF7900'}
          />
        </View>
      </View>
    </View>
  );
}
