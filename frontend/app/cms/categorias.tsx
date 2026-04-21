import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, Modal, TextInput, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import type { AdminCanal, AdminCategoria } from '../../services/api/adminApi';
import { useCategoriasStore } from '../../services/categoriasStore';
import { useChannelStore } from '../../services/channelStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';
import { LinearGradient } from 'expo-linear-gradient';

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CATEGORY_META: Record<string, {
  accent: string;
  glow: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  tag: string;
  featured?: boolean;
  contentCount: number;
  aliases?: string[];
  preview: string[];
}> = {
  peliculas: { accent: '#F59E0B', glow: 'rgba(245,158,11,0.18)', icon: 'film', tag: 'Destacada', featured: true, contentCount: 42, aliases: ['cine', 'peliculas'], preview: ['Estrenos', 'Clásicos', 'Acción'] },
  series: { accent: '#22D3EE', glow: 'rgba(180,144,255,0.18)', icon: 'list-alt', tag: 'Binge-ready', contentCount: 31, preview: ['Temporadas', 'Miniseries', 'Originales'] },
  documentales: { accent: '#10B981', glow: 'rgba(16,185,129,0.18)', icon: 'globe', tag: 'Curada', contentCount: 18, aliases: ['documental', 'documentales'], preview: ['Historia', 'Naturaleza', 'Ciencia'] },
  infantil: { accent: '#EC4899', glow: 'rgba(236,72,153,0.18)', icon: 'child', tag: 'Family-safe', contentCount: 26, aliases: ['infantil'], preview: ['Animación', 'Aprendizaje', 'Aventura'] },
  deportes: { accent: '#10B981', glow: 'rgba(16,185,129,0.18)', icon: 'futbol-o', tag: 'Live', featured: true, contentCount: 22, aliases: ['deportes'], preview: ['En vivo', 'Ligas', 'Highlights'] },
  'musica y conciertos': { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.18)', icon: 'music', tag: 'Popular', contentCount: 17, aliases: ['musica', 'música'], preview: ['Conciertos', 'Videoclips', 'Festivales'] },
  'noticias y actualidad': { accent: '#38BDF8', glow: 'rgba(56,189,248,0.18)', icon: 'newspaper-o', tag: '24/7', contentCount: 14, aliases: ['noticias'], preview: ['En vivo', 'Análisis', 'Breaking news'] },
  'estilo de vida': { accent: '#F472B6', glow: 'rgba(244,114,182,0.18)', icon: 'heart-o', tag: 'Lifestyle', contentCount: 19, preview: ['Bienestar', 'Moda', 'Hogar'] },
  educacion: { accent: '#A78BFA', glow: 'rgba(167,139,250,0.18)', icon: 'graduation-cap', tag: 'Learning', contentCount: 13, preview: ['Cursos', 'Tutoriales', 'Formación'] },
  'religioso / espiritual': { accent: '#FBBF24', glow: 'rgba(251,191,36,0.18)', icon: 'sun-o', tag: 'Editorial', contentCount: 9, preview: ['Reflexión', 'Fe', 'Comunidad'] },
  cocina: { accent: '#FB7185', glow: 'rgba(251,113,133,0.18)', icon: 'cutlery', tag: 'How-to', contentCount: 11, preview: ['Recetas', 'Chefs', 'Tips'] },
  viajes: { accent: '#60A5FA', glow: 'rgba(96,165,250,0.18)', icon: 'plane', tag: 'Explora', contentCount: 12, preview: ['Destinos', 'Turismo', 'Cultura'] },
  tecnologia: { accent: '#22C55E', glow: 'rgba(34,197,94,0.18)', icon: 'laptop', tag: 'Trend', contentCount: 16, preview: ['Gadgets', 'Reviews', 'Innovación'] },
  'gaming / esports': { accent: '#7C3AED', glow: 'rgba(124,58,237,0.18)', icon: 'gamepad', tag: 'Engagement', featured: true, contentCount: 21, preview: ['Esports', 'Gameplays', 'Torneos'] },
  'humor / comedia': { accent: '#F97316', glow: 'rgba(249,115,22,0.18)', icon: 'smile-o', tag: 'Ligera', contentCount: 15, preview: ['Stand up', 'Sketches', 'Sitcom'] },
  'reality shows': { accent: '#14B8A6', glow: 'rgba(20,184,166,0.18)', icon: 'tv', tag: 'Trending', contentCount: 20, preview: ['Concursos', 'Talento', 'Convivencia'] },
};

function matchesCategory(categoryName: string, canal: AdminCanal) {
  const normalizedCategory = normalizeKey(categoryName);
  const normalizedCanal = normalizeKey(canal.category?.nombre || '');
  const meta = CATEGORY_META[normalizedCategory];
  const aliases = meta?.aliases?.map(normalizeKey) ?? [];
  return normalizedCanal === normalizedCategory || aliases.includes(normalizedCanal);
}

export default function CmsCategorias() {
  const { profile, accessToken } = useCmsStore();
  const router = useRouter();
  const cats = useCategoriasStore((s) => s.categorias);
  const isLoading = useCategoriasStore((s) => s.isLoading);
  const storeError = useCategoriasStore((s) => s.error);
  const { fetchFromApi, add: storeAdd, update: storeUpdate, toggle: storeToggle, remove: storeRemove } = useCategoriasStore();
  const canales = useChannelStore((s) => s.channels);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewCategory, setPreviewCategory] = useState<AdminCategoria | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategoria | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '', accentColor: '#FFB800', displayOrder: 99 });
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) { router.replace('/cms/login' as never); return; }
    if (accessToken) fetchFromApi(accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

  const enrichedCategories = useMemo(() => {
    return cats.map((cat, index) => {
      const meta = CATEGORY_META[normalizeKey(cat.nombre)] ?? {
        accent: C.accent,
        glow: C.accentSoft,
        icon: (cat.icono as React.ComponentProps<typeof FontAwesome>['name']) || 'tag',
        tag: 'Curada',
        featured: false,
        contentCount: 8,
        preview: ['Colecciones', 'Destacados', 'Player'],
      };
      const relatedChannels = (canales as AdminCanal[]).filter(
        (canal) => canal.categoryId === cat.id || matchesCategory(cat.nombre, canal),
      );
      return {
        ...cat,
        meta,
        contentCount: Math.max(meta.contentCount, relatedChannels.length),
        channelCount: relatedChannels.length,
        relatedChannels,
        highlight: index < 3 || meta.featured,
      };
    });
  }, [cats, canales]);

  if (!profile) return null;

  const activeCount = enrichedCategories.filter((item) => item.activo).length;
  const featuredCount = enrichedCategories.filter((item) => item.highlight).length;
  const withLiveSignals = enrichedCategories.filter((item) => item.channelCount > 0).length;

  const selectedCategory = enrichedCategories.find((item) => item.id === selectedId) ?? enrichedCategories[0] ?? null;

  function openEdit(category: AdminCategoria) {
    setEditingCategory(category);
    const existingChannelIds = (category.channelCategories ?? []).map((cc) => cc.channel.id);
    setForm({
      nombre: category.nombre,
      descripcion: category.descripcion,
      icono: category.icono ?? '',
      accentColor: category.accentColor ?? '#FFB800',
      displayOrder: category.displayOrder ?? 99,
    });
    setSelectedChannelIds(existingChannelIds);
    setFormError('');
  }

  function openCreate() {
    setIsCreating(true);
    setForm({ nombre: '', descripcion: '', icono: '', accentColor: '#FFB800', displayOrder: 99 });
    setSelectedChannelIds([]);
    setFormError('');
  }

  function closeEdit() {
    setEditingCategory(null);
    setIsCreating(false);
    setForm({ nombre: '', descripcion: '', icono: '', accentColor: '#FFB800', displayOrder: 99 });
    setSelectedChannelIds([]);
    setFormError('');
  }

  async function saveEdit() {
    const nombre = form.nombre.trim();
    if (!nombre) { setFormError('El nombre es requerido.'); return; }
    if (form.accentColor && !/^#[0-9A-Fa-f]{6}$/.test(form.accentColor)) {
      setFormError('El color debe ser un hex válido (ej: #FFB800)');
      return;
    }
    if (!accessToken) { setFormError('Sesión expirada. Recarga la página.'); return; }
    setFormError('');
    setIsSaving(true);
    try {
      if (isCreating) {
        const created = await storeAdd(accessToken, {
          nombre,
          descripcion: form.descripcion.trim(),
          icono: form.icono.trim(),
          accentColor: form.accentColor,
          displayOrder: form.displayOrder,
          channelIds: selectedChannelIds,
        });
        setSelectedId(created.id);
      } else if (editingCategory) {
        await storeUpdate(accessToken, editingCategory.id, {
          nombre,
          descripcion: form.descripcion.trim(),
          icono: form.icono.trim(),
          accentColor: form.accentColor,
          displayOrder: form.displayOrder,
          channelIds: selectedChannelIds,
        } as any);
      }
      closeEdit();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la categoría.');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(categoryId: string) {
    if (!accessToken) return;
    await storeToggle(accessToken, categoryId);
  }

  async function deleteCategory(categoryId: string, nombre: string) {
    if (!window.confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    if (!accessToken) return;
    try {
      await storeRemove(accessToken, categoryId);
      if (selectedId === categoryId) setSelectedId(null);
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.');
    }
  }

  return (
    <CmsShell breadcrumbs={[{ label: 'Categorías' }]}>
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ color: C.textDim, fontSize: 13, marginTop: 12 }}>Cargando categorías...</Text>
        </View>
      ) : storeError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <FontAwesome name="exclamation-triangle" size={32} color={C.rose} />
          <Text style={{ color: C.rose, fontSize: 14, marginTop: 12, textAlign: 'center' }}>{storeError}</Text>
          <TouchableOpacity onPress={() => accessToken && fetchFromApi(accessToken)} style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.accent }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 16, flexWrap: 'wrap' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 22, fontWeight: '800' }}>Categorías</Text>
            <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>
              Clasificación principal del contenido que el admin publica para la experiencia del player.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={openCreate}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, backgroundColor: C.accent }}
            >
              <FontAwesome name="plus" size={12} color="white" />
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }}>Nueva categoría</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, minWidth: 130 }}>
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>ACTIVAS</Text>
              <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>{activeCount}</Text>
            </View>
            <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, minWidth: 130 }}>
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>DESTACADAS</Text>
              <Text style={{ color: C.accentLight, fontSize: 18, fontWeight: '900' }}>{featuredCount}</Text>
            </View>
            <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, minWidth: 130 }}>
              <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>CON SEÑAL</Text>
              <Text style={{ color: C.cyan, fontSize: 18, fontWeight: '900' }}>{withLiveSignals}</Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 18 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome name="tags" size={16} color={C.accentLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: '800', marginBottom: 6 }}>Propósito del módulo</Text>
              <Text style={{ color: C.textDim, fontSize: 12, lineHeight: 18 }}>
                Aquí se define el tipo de categoría al que pertenece cada contenido. Esta clasificación organiza filas, navegación y descubrimiento dentro del player.
              </Text>
            </View>
          </View>
        </View>

        {cats.length === 0 ? null : (
          <>
            {selectedCategory ? (
              <LinearGradient
                colors={[`${selectedCategory.meta.accent}28`, 'rgba(12,24,41,0.96)', 'rgba(12,24,41,1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 20 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                  <View style={{ flex: 1, minWidth: 280 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: selectedCategory.meta.glow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                        <FontAwesome name={selectedCategory.meta.icon} size={18} color={selectedCategory.meta.accent} />
                      </View>
                      <View>
                        <Text style={{ color: C.text, fontSize: 22, fontWeight: '900' }}>{selectedCategory.nombre}</Text>
                        <Text style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>Sección editorial del catálogo OTT</Text>
                      </View>
                    </View>
                    <Text style={{ color: C.textDim, fontSize: 13, lineHeight: 20, maxWidth: 720 }}>{selectedCategory.descripcion}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {selectedCategory.meta.preview.map((tag) => (
                        <View key={tag} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                          <Text style={{ color: C.text, fontSize: 11, fontWeight: '700' }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                    <View style={{ minWidth: 132, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>CONTENIDOS</Text>
                      <Text style={{ color: C.text, fontSize: 20, fontWeight: '900' }}>{selectedCategory.contentCount}</Text>
                    </View>
                    <View style={{ minWidth: 132, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>CANALES</Text>
                      <Text style={{ color: C.cyan, fontSize: 20, fontWeight: '900' }}>{selectedCategory.channelCount}</Text>
                    </View>
                    <TouchableOpacity style={{ minWidth: 150, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/cms/canales' as never)}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>Ver contenido asociado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            ) : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {enrichedCategories.map((cat) => {
                const isHovered = hoveredId === cat.id;
                const isSelected = selectedId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedId(cat.id)}
                    onHoverIn={() => setHoveredId(cat.id)}
                    onHoverOut={() => setHoveredId((current) => (current === cat.id ? null : current))}
                    style={{
                      width: '100%',
                      maxWidth: 336,
                      minWidth: 270,
                      borderRadius: 22,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: isSelected ? `${cat.meta.accent}66` : isHovered ? `${cat.meta.accent}44` : C.border,
                      backgroundColor: C.surface,
                      shadowColor: cat.meta.accent,
                      shadowOpacity: isHovered || isSelected ? 0.18 : 0.04,
                      shadowRadius: isHovered || isSelected ? 24 : 10,
                      shadowOffset: { width: 0, height: 12 },
                      elevation: isHovered || isSelected ? 14 : 3,
                      transform: [{ translateY: isHovered ? -4 : 0 }],
                    }}
                  >
                    <LinearGradient colors={[`${cat.meta.accent}26`, 'rgba(12,24,41,0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, minHeight: 148 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cat.meta.glow, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                            <FontAwesome name={cat.meta.icon} size={18} color={cat.meta.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }} numberOfLines={2}>{cat.nombre}</Text>
                            <Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{cat.id.toUpperCase()}</Text>
                          </View>
                        </View>

                        {(isHovered || isSelected) ? (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(13,0,32,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }} onPress={() => openEdit(cat)}>
                              <FontAwesome name="pencil" size={12} color={C.cyan} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(13,0,32,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }} onPress={() => toggleCategory(cat.id)}>
                              <FontAwesome name={cat.activo ? 'pause' : 'play'} size={11} color={cat.activo ? C.amber : C.green} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(13,0,32,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreviewCategory(cat)}>
                              <FontAwesome name="eye" size={12} color={C.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(255,122,89,0.14)', borderWidth: 1, borderColor: 'rgba(255,122,89,0.24)', alignItems: 'center', justifyContent: 'center' }} onPress={() => deleteCategory(cat.id, cat.nombre)}>
                              <FontAwesome name="trash" size={11} color={C.rose} />
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: cat.activo ? 'rgba(16,185,129,0.16)' : 'rgba(244,63,94,0.14)', borderWidth: 1, borderColor: cat.activo ? 'rgba(16,185,129,0.22)' : 'rgba(244,63,94,0.22)' }}>
                          <Text style={{ color: cat.activo ? C.green : C.rose, fontSize: 10, fontWeight: '800' }}>{cat.activo ? 'ACTIVA' : 'PAUSADA'}</Text>
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                          <Text style={{ color: cat.meta.accent, fontSize: 10, fontWeight: '800' }}>{cat.meta.tag}</Text>
                        </View>
                        {cat.highlight ? (
                          <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: `${cat.meta.accent}22`, borderWidth: 1, borderColor: `${cat.meta.accent}33` }}>
                            <Text style={{ color: cat.meta.accent, fontSize: 10, fontWeight: '800' }}>POPULAR</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={{ color: C.textDim, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>{cat.descripcion}</Text>
                    </LinearGradient>

                    <View style={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border }}>
                          <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>CONTENIDOS</Text>
                          <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>{cat.contentCount}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border }}>
                          <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>CANALES</Text>
                          <Text style={{ color: C.cyan, fontSize: 18, fontWeight: '900' }}>{cat.channelCount}</Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                        {cat.meta.preview.map((tag) => (
                          <View key={tag} style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: C.lift }}>
                            <Text style={{ color: C.textDim, fontSize: 10, fontWeight: '700' }}>{tag}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: isSelected ? `${cat.meta.accent}22` : C.lift, borderWidth: 1, borderColor: isSelected ? `${cat.meta.accent}33` : C.border }} onPress={() => setPreviewCategory(cat)}>
                        <View>
                          <Text style={{ color: C.text, fontSize: 12, fontWeight: '800' }}>Preview editorial</Text>
                          <Text style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>Ver señales y contenido asociado</Text>
                        </View>
                        <FontAwesome name="arrow-right" size={12} color={isSelected ? cat.meta.accent : C.textDim} />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      )}

      <Modal visible={Boolean(previewCategory)} transparent animationType="fade" onRequestClose={() => setPreviewCategory(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          {previewCategory ? (
            <View style={{ width: '100%', maxWidth: 720, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
              <LinearGradient colors={[`${(CATEGORY_META[normalizeKey(previewCategory.nombre)]?.accent ?? C.accent)}28`, 'rgba(12,24,41,1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 24, fontWeight: '900' }}>{previewCategory.nombre}</Text>
                    <Text style={{ color: C.textDim, fontSize: 13, marginTop: 6, lineHeight: 20 }}>{previewCategory.descripcion}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPreviewCategory(null)}>
                    <FontAwesome name="times" size={18} color={C.muted} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={{ padding: 20 }}>
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 }}>CANALES RELACIONADOS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                  {enrichedCategories.find((item) => item.id === previewCategory.id)?.relatedChannels.length ? (
                    enrichedCategories.find((item) => item.id === previewCategory.id)?.relatedChannels.map((canal) => (
                      <View key={canal.id} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: C.lift, borderWidth: 1, borderColor: C.border }}>
                        <Text style={{ color: C.text, fontSize: 11, fontWeight: '700' }}>{canal.nombre}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: C.textDim, fontSize: 12 }}>Aún no hay canales directamente asociados.</Text>
                  )}
                </View>

                <TouchableOpacity style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, backgroundColor: C.accent }} onPress={() => { setPreviewCategory(null); router.push('/cms/canales' as never); }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>Ir al contenido asociado</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal visible={Boolean(editingCategory) || isCreating} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={{ flex: 1, backgroundColor: 'rgba(13,0,32,0.72)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 620, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{isCreating ? 'Nueva categoría' : 'Editar categoría'}</Text>
                  <Text style={{ color: C.textDim, fontSize: 12, marginTop: 4 }}>
                    {isCreating ? 'Define nombre, descripción e ícono de la nueva categoría.' : 'Ajuste visual del catálogo editorial en CMS.'}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeEdit}>
                  <FontAwesome name="times" size={18} color={C.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }}>
              <View style={{ padding: 20, gap: 12 }}>
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>NOMBRE <Text style={{ color: C.rose }}>*</Text></Text>
                <TextInput
                  value={form.nombre}
                  onChangeText={(value) => setForm((current) => ({ ...current, nombre: value }))}
                  placeholder="Ej: Contenido Adulto, Tu Cancha…"
                  placeholderTextColor={C.muted}
                  style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, ...webInput }}
                />
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>DESCRIPCIÓN</Text>
                <TextInput
                  value={form.descripcion}
                  onChangeText={(value) => setForm((current) => ({ ...current, descripcion: value }))}
                  placeholder="Describe cómo se presenta esta sección en el player"
                  placeholderTextColor={C.muted}
                  multiline
                  numberOfLines={4}
                  style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, minHeight: 90, textAlignVertical: 'top', ...webInput }}
                />
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>ÍCONO (clase FontAwesome)</Text>
                <TextInput
                  value={form.icono}
                  onChangeText={(value) => setForm((current) => ({ ...current, icono: value }))}
                  placeholder="Ej: futbol-o, film, music, child…"
                  placeholderTextColor={C.muted}
                  style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, ...webInput }}
                />

                {/* Color de acento */}
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>COLOR DE ACENTO</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(form.accentColor) ? form.accentColor : '#FFB800', borderWidth: 1, borderColor: C.border }} />
                  <TextInput
                    value={form.accentColor}
                    onChangeText={(value) => setForm((current) => ({ ...current, accentColor: value }))}
                    placeholder="#FFB800"
                    placeholderTextColor={C.muted}
                    style={{ flex: 1, backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, ...webInput }}
                  />
                </View>

                {/* Orden de display */}
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>ORDEN DE VISUALIZACIÓN</Text>
                <TextInput
                  value={String(form.displayOrder)}
                  onChangeText={(value) => setForm((current) => ({ ...current, displayOrder: parseInt(value, 10) || 99 }))}
                  placeholder="99"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, ...webInput }}
                />

                {/* Channel Selector */}
                <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700', marginTop: 4 }}>CANALES ASOCIADOS</Text>
                <Text style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>Selecciona los canales que pertenecen a esta categoría.</Text>
                <View style={{ backgroundColor: C.lift, borderRadius: 10, borderWidth: 1, borderColor: C.border, maxHeight: 180, overflow: 'hidden' }}>
                  <ScrollView nestedScrollEnabled>
                    {(canales as AdminCanal[]).length === 0 ? (
                      <Text style={{ color: C.muted, fontSize: 12, padding: 12 }}>No hay canales disponibles.</Text>
                    ) : (
                      (canales as AdminCanal[]).map((canal) => {
                        const isSelected = selectedChannelIds.includes(canal.id);
                        return (
                          <TouchableOpacity
                            key={canal.id}
                            onPress={() => setSelectedChannelIds((prev) =>
                              isSelected ? prev.filter((id) => id !== canal.id) : [...prev, canal.id]
                            )}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 }}
                          >
                            <View style={{
                              width: 18, height: 18, borderRadius: 4, borderWidth: 2,
                              borderColor: isSelected ? C.accent : C.border,
                              backgroundColor: isSelected ? C.accent : 'transparent',
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              {isSelected ? <FontAwesome name="check" size={10} color="white" /> : null}
                            </View>
                            <Text style={{ color: isSelected ? C.text : C.textDim, fontSize: 12, flex: 1 }} numberOfLines={1}>{canal.nombre}</Text>
                            <Text style={{ color: C.muted, fontSize: 10 }}>{canal.status}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
                {selectedChannelIds.length > 0 && (
                  <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>{selectedChannelIds.length} canal(es) seleccionado(s)</Text>
                )}

                {formError ? (
                  <Text style={{ color: C.rose, fontSize: 12, fontWeight: '700' }}>{formError}</Text>
                ) : null}
              </View>
              </ScrollView>

              <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.lift }} onPress={closeEdit} disabled={isSaving}>
                  <Text style={{ color: C.textDim, fontSize: 12, fontWeight: '700' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: isSaving ? C.muted : C.accent, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={saveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? <ActivityIndicator size={12} color="white" /> : null}
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '800' }}>
                    {isSaving ? 'Guardando…' : isCreating ? 'Crear categoría' : 'Guardar cambios'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </CmsShell>
  );
}
