import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import {
  adminListComponentes,
  adminToggleComponente,
  adminSyncComponenteCategorias,
  adminListCategorias,
  AdminComponente,
  AdminCategoria,
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

  // Category management state
  const [allCategorias, setAllCategorias] = useState<AdminCategoria[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [managingCategories, setManagingCategories] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      adminListComponentes(accessToken),
      adminListCategorias(accessToken),
    ]).then(([comps, cats]) => {
      setComponentes(comps);
      setAllCategorias(cats);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const openCategoryManager = (comp: AdminComponente) => {
    setManagingId(comp.id);
    setManagingCategories((comp.categories ?? []).map((c) => c.id));
  };

  const toggleCategory = (catId: string) => {
    setManagingCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  };

  const saveCategories = async () => {
    if (!accessToken || !managingId) return;
    setIsSyncing(true);
    try {
      await adminSyncComponenteCategorias(accessToken, managingId, managingCategories);
      setComponentes((prev) =>
        prev.map((c) =>
          c.id === managingId
            ? { ...c, categories: allCategorias.filter((cat) => managingCategories.includes(cat.id)) }
            : c,
        ),
      );
      setManagingId(null);
    } catch (e) {
      console.error('Sync categories failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.cyanSoft, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="puzzle-piece" size={18} color={C.cyan} />
            </View>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: '800' }}>
              Componentes
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
                  backgroundColor: C.greenSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="check-circle" size={18} color={C.green} />
              </View>
              <Text
                style={{
                  color: C.green,
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
                  backgroundColor: C.roseSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="times-circle" size={18} color={C.rose} />
              </View>
              <Text
                style={{
                  color: C.rose,
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
                  backgroundColor: C.cyanSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome name="th-large" size={18} color={C.cyan} />
              </View>
              <Text
                style={{
                  color: C.cyan,
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
              color: C.text,
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
            backgroundColor: C.cyanSoft,
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(180,144,255,0.24)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <FontAwesome name="info-circle" size={16} color={C.cyan} />
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
                              color: C.text,
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
                                ? C.greenSoft
                                : C.roseSoft,
                              borderRadius: 4,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                color: comp.activo ? C.green : C.rose,
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
                              ? C.greenSoft
                              : C.roseSoft,
                            justifyContent: 'center',
                            paddingHorizontal: 2,
                            borderWidth: 1,
                            borderColor: comp.activo
                              ? 'rgba(16,185,129,0.28)'
                              : 'rgba(244,63,94,0.28)',
                          }}
                        >
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: comp.activo
                                ? C.green
                                : C.rose,
                              alignSelf: comp.activo
                                ? 'flex-end'
                                : 'flex-start',
                              shadowColor: comp.activo
                                ? C.green
                                : C.rose,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.5,
                              shadowRadius: 6,
                            }}
                          />
                        </TouchableOpacity>
                      )}
                      <Text
                        style={{
                          color: comp.activo ? C.green : C.rose,
                          fontSize: 9,
                          fontWeight: '700',
                        }}
                      >
                        {comp.activo ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  </View>

                  {/* Category manager button */}
                  <TouchableOpacity
                    onPress={() => managingId === comp.id ? setManagingId(null) : openCategoryManager(comp)}
                    style={{
                      marginTop: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start',
                      backgroundColor: C.cyanSoft,
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: 'rgba(34,211,238,0.2)',
                    }}
                  >
                    <FontAwesome name="tags" size={11} color={C.cyan} />
                    <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '700' }}>
                      Categorías {(comp.categories?.length ?? 0) > 0 ? `(${comp.categories!.length})` : ''}
                    </Text>
                    <FontAwesome name={managingId === comp.id ? 'chevron-up' : 'chevron-down'} size={9} color={C.cyan} />
                  </TouchableOpacity>

                  {/* Inline category panel */}
                  {managingId === comp.id && (
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
                      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>
                        CATEGORÍAS ASIGNADAS
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                        {allCategorias.map((cat) => {
                          const selected = managingCategories.includes(cat.id);
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              onPress={() => toggleCategory(cat.id)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 6,
                                borderWidth: 1,
                                backgroundColor: selected ? `${color}18` : C.surface,
                                borderColor: selected ? `${color}50` : C.border,
                              }}
                            >
                              <FontAwesome
                                name={selected ? 'check-square' : 'square-o'}
                                size={13}
                                color={selected ? color : C.muted}
                              />
                              <Text style={{ color: selected ? C.text : C.muted, fontSize: 12, fontWeight: selected ? '700' : '400' }}>
                                {cat.nombre}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={saveCategories}
                          disabled={isSyncing}
                          style={{
                            flex: 1,
                            backgroundColor: color,
                            borderRadius: 8,
                            paddingVertical: 9,
                            alignItems: 'center',
                            opacity: isSyncing ? 0.6 : 1,
                          }}
                        >
                          {isSyncing
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Guardar</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setManagingId(null)}
                          style={{
                            paddingHorizontal: 16,
                            borderRadius: 8,
                            paddingVertical: 9,
                            borderWidth: 1,
                            borderColor: C.border,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: C.muted, fontSize: 13 }}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
