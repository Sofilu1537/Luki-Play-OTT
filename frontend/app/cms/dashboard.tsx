import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getDateStr(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDisplayName(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  color,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.rose : C.textSec;
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus';

  return (
    <View style={{
      flex: 1,
      minWidth: 190,
      backgroundColor: C.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.border,
      margin: 6,
    }}>
      {/* Top accent bar */}
      <View style={{ height: 3, backgroundColor: color }} />

      <View style={{ padding: 22 }}>
        {/* Icon */}
        <View style={{
          width: 42, height: 42,
          borderRadius: 12,
          backgroundColor: `${color}18`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <FontAwesome name={icon} size={17} color={color} />
        </View>

        {/* Value */}
        <Text style={{
          color: C.text,
          fontSize: 38,
          fontWeight: '900',
          letterSpacing: -1.5,
          marginBottom: 4,
          lineHeight: 42,
        }}>
          {value}
        </Text>

        {/* Label */}
        <Text style={{
          color: C.textSec,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.2,
        }}>
          {label}
        </Text>

        {/* Trend */}
        {trend && trendLabel && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: C.border,
          }}>
            <FontAwesome name={trendIcon as React.ComponentProps<typeof FontAwesome>['name']} size={9} color={trendColor} />
            <Text style={{ color: trendColor, fontSize: 11, fontWeight: '600' }}>{trendLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function CmsDashboard() {
  const { profile } = useCmsStore();
  const router = useRouter();

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  if (!profile) return null;

  const displayName = getDisplayName(profile.email);
  const greeting = getGreeting();
  const dateStr = getDateStr();
  const roleLabel =
    profile.role === 'SUPERADMIN' ? 'Super Administrador'
    : profile.role === 'SOPORTE' ? 'Soporte Técnico'
    : profile.role;

  return (
    <CmsShell breadcrumbs={[{ label: 'Inicio' }]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.void }}
        contentContainerStyle={{ padding: 32, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Greeting Banner ── */}
        <View style={{
          backgroundColor: C.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: C.accentBorder,
          padding: 36,
          marginBottom: 32,
          overflow: 'hidden',
        }}>
          {/* Decorative glow element */}
          <View style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: C.accentGlow,
          }} />
          <View style={{
            position: 'absolute',
            bottom: -80,
            right: 120,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: 'rgba(34,211,238,0.06)',
          }} />

          {/* Role badge */}
          <View style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            backgroundColor: C.accentFaint,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: C.accentBorder,
            marginBottom: 20,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent }} />
            <Text style={{ color: C.accentLight, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
              {roleLabel.toUpperCase()}
            </Text>
          </View>

          {/* Greeting text */}
          <Text style={{
            color: C.textSec,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 2,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            {greeting}
          </Text>
          <Text style={{
            color: C.text,
            fontSize: 32,
            fontWeight: '900',
            letterSpacing: -1,
            marginBottom: 8,
            lineHeight: 36,
          }}>
            {displayName}
          </Text>
          <Text style={{
            color: C.muted,
            fontSize: 12,
            fontWeight: '500',
            letterSpacing: 0.3,
            textTransform: 'capitalize',
          }}>
            {dateStr}
          </Text>
        </View>

        {/* ── Section header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Text style={{
            color: C.text,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Métricas del sistema
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </View>

        {/* ── Metric Cards ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 40 }}>
          <MetricCard
            label="Usuarios registrados"
            value="20"
            icon="users"
            color={C.accent}
            trend="up"
            trendLabel="2 nuevos este mes"
          />
          <MetricCard
            label="Contratos activos"
            value="16"
            icon="file-text-o"
            color={C.cyan}
            trend="neutral"
            trendLabel="Sin cambios recientes"
          />
          <MetricCard
            label="Canales activos"
            value="4"
            icon="tv"
            color={C.green}
            trend="neutral"
            trendLabel="Todos operativos"
          />
          <MetricCard
            label="Planes disponibles"
            value="4"
            icon="credit-card"
            color={C.amber}
            trend="neutral"
            trendLabel="Revisión pendiente"
          />
        </View>

        {/* ── System status row ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Text style={{
            color: C.text,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Estado del sistema
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Backend API',   status: 'Operativo', color: C.green },
            { label: 'Base de datos', status: 'Operativo', color: C.green },
            { label: 'Streaming CDN', status: 'Operativo', color: C.green },
            { label: 'Auth Service',  status: 'Operativo', color: C.green },
          ].map((item) => (
            <View key={item.label} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: C.surface,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: C.border,
              minWidth: 160,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
              <View>
                <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>{item.label}</Text>
                <Text style={{ color: item.color, fontSize: 10, fontWeight: '500', marginTop: 1 }}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </CmsShell>
  );
}
