import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminListComponentes,
  adminToggleComponente,
  AdminComponente,
} from '../../services/api/adminApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

const TIPO_COLORS: Record<string, string> = {
  VOD: '#8B5CF6',
  DESTACADOS: '#F59E0B',
  LIVE: '#EF4444',
  SERIES: '#0EA5E9',
  RADIO: '#10B981',
  PPV: '#EC4899',
  KIDS: '#F472B6',
  DEPORTES: '#22D3EE',
  MUSICA: '#A78BFA',
  NOTICIAS: '#64748B',
};

export default function CmsComponentes() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const [componentes, setComponentes] = useState<AdminComponente[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile, router]);

  useEffect(() => {
    if (!accessToken) return;
    adminListComponentes(accessToken)
      .then(setComponentes)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleToggle = async (id: string) => {
    if (!accessToken || toggling) return;
    setToggling(id);
    try {
      const updated = await adminToggleComponente(accessToken, id);
      setComponentes((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    } catch (e) {
      console.error('Toggle failed', e);
    } finally {
      setToggling(null);
    }
  };

  if (!profile) return null;

  const activeCount = componentes.filter((c) => c.activo).length;
  const inactiveCount = componentes.filter((c) => !c.activo).length;

  const filtered = componentes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.tipo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q)
    );
  });

  const webInput =
    Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  return (
    <CmsShell breadcrumbs={[{ label: 'Componentes' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <View>
            <Text
              style={{ color: 'white', fontSize: 22, fontWeight: '800' }}
            >
              Componentes
            </Text>
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
              Activa o desactiva los tipos de contenido visibles para los abonados
            </Text>
          </View>
        </View>

        {/* Stats cards */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 18,
              flex: 1,
              minWidth: 140,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#14532D',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="check-circle" size={18} color="#4ADE80" />
              </View>
              <Text
                style={{
                  color: '#4ADE80',
                  fontSize: 28,
                  fontWeight: '900',
                }}
              >
                {activeCount}
              </Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>
              Componentes Activos
            </Text>
          </View>

          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 18,
              flex: 1,
              minWidth: 140,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#3F1515',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="times-circle" size={18} color="#F87171" />
              </View>
              <Text
                style={{
                  color: '#F87171',
                  fontSize: 28,
                  fontWeight: '900',
                }}
              >
                {inactiveCount}
              </Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>
              Componentes Inactivos
            </Text>
          </View>

          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 12,
              padding: 18,
              flex: 1,
              minWidth: 140,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: '#1E3A5F',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="th-large" size={18} color="#60A5FA" />
              </View>
              <Text
                style={{
                  color: '#60A5FA',
                  fontSize: 28,
                  fontWeight: '900',
                }}
              >
                {componentes.length}
              </Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600' }}>
              Total Componentes
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 12,
            marginBottom: 20,
          }}
        >
          <FontAwesome name="search" size={13} color={C.muted} />
          <TextInput
            style={{
              flex: 1,
              color: 'white',
              paddingVertical: 10,
              paddingHorizontal: 10,
              fontSize: 13,
              ...webInput,
            }}
            placeholder="Buscar componente por nombre o tipo..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Info banner */}
        <View
          style={{
            backgroundColor: '#1E3A5F22',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#1E3A5F',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <FontAwesome name="info-circle" size={16} color="#60A5FA" />
          <Text style={{ color: '#93C5FD', fontSize: 12, flex: 1 }}>
            Los componentes activos se muestran en la app del abonado. Desactiva
            un componente para ocultarlo sin eliminarlo del sistema.
          </Text>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((comp) => {
              const color = TIPO_COLORS[comp.tipo] ?? '#64748B';
              const isToggling = toggling === comp.id;
              return (
                <View
                  key={comp.id}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 12,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: comp.activo ? `${color}40` : C.border,
                    opacity: comp.activo ? 1 : 0.7,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {/* Left: icon + info */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        gap: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: `${color}22`,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: `${color}30`,
                        }}
                      >
                        <FontAwesome
                          name={comp.icono as any}
                          size={22}
                          color={color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 16,
                              fontWeight: '700',
                            }}
                          >
                            {comp.nombre}
                          </Text>
                          <View
                            style={{
                              backgroundColor: `${color}22`,
                              borderRadius: 4,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                color,
                                fontSize: 9,
                                fontWeight: '800',
                                letterSpacing: 1,
                              }}
                            >
                              {comp.tipo}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: comp.activo
                                ? '#14532D'
                                : '#3F1515',
                              borderRadius: 4,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                color: comp.activo ? '#4ADE80' : '#F87171',
                                fontSize: 9,
                                fontWeight: '800',
                                letterSpacing: 0.5,
                              }}
                            >
                              {comp.activo ? 'ACTIVO' : 'INACTIVO'}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            color: C.muted,
                            fontSize: 12,
                            lineHeight: 18,
                          }}
                          numberOfLines={2}
                        >
                          {comp.descripcion}
                        </Text>
                        <Text
                          style={{
                            color: C.muted,
                            fontSize: 10,
                            marginTop: 6,
                            fontStyle: 'italic',
                          }}
                        >
                          Orden: {comp.orden}
                        </Text>
                      </View>
                    </View>

                    {/* Right: toggle */}
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      {isToggling ? (
                        <ActivityIndicator color={color} size="small" />
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleToggle(comp.id)}
                          style={{
                            width: 52,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: comp.activo
                              ? '#14532D'
                              : '#3F1515',
                            justifyContent: 'center',
                            paddingHorizontal: 2,
                            borderWidth: 1,
                            borderColor: comp.activo
                              ? '#4ADE8040'
                              : '#F8717140',
                          }}
                        >
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: comp.activo
                                ? '#4ADE80'
                                : '#F87171',
                              alignSelf: comp.activo
                                ? 'flex-end'
                                : 'flex-start',
                              shadowColor: comp.activo
                                ? '#4ADE80'
                                : '#F87171',
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.5,
                              shadowRadius: 6,
                            }}
                          />
                        </TouchableOpacity>
                      )}
                      <Text
                        style={{
                          color: comp.activo ? '#4ADE80' : '#F87171',
                          fontSize: 9,
                          fontWeight: '700',
                        }}
                      >
                        {comp.activo ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </CmsShell>
  );
}
