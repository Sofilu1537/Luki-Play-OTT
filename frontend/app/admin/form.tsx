import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, Image,
    Platform, ActivityIndicator, SafeAreaView, KeyboardAvoidingView,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAdminStore } from '../../services/adminStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type ImageMode = 'url' | 'upload';

const PRESET_TAGS = [
    'Acción', 'Aventura', 'Deportes', 'Noticias', 'Entretenimiento',
    'Películas', 'Series', 'Música', 'Infantil', 'Documentales',
    'Comedia', 'Terror', 'Drama', 'Sci-Fi', 'Anime',
];

// Resize + compress image to JPEG 0.75, max 800px — reduces localStorage usage
const compressImageWeb = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
        const img = new (window as any).Image();
        img.onload = () => {
            const MAX = 800;
            let { naturalWidth: w, naturalHeight: h } = img;
            if (w > MAX || h > MAX) {
                const ratio = Math.min(MAX / w, MAX / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

const INPUT_STYLE = {
    backgroundColor: '#1A052E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A148C',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
} as const;

const LABEL_STYLE = {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: 1,
};

const ERROR_STYLE = { color: '#f87171', fontSize: 12, marginTop: 5 } as const;

/**
 * Add / Edit channel form for the Admin Panel.
 *
 * When the route param `id` is present the form operates in edit mode and
 * pre-populates fields from the existing channel. Without `id` it creates
 * a new channel.
 *
 * Fields:
 * - `title`        — required channel display name.
 * - `videoUrl`     — required stream URL (HLS, MP4, or live).
 * - `imageUrl`     — required cover image (URL or base64 from file upload).
 * - `description`  — optional channel synopsis.
 * - `selectedTags` — multi-select genre tags from `PRESET_TAGS`.
 *
 * Image modes (web only for upload):
 * - "URL"    — direct image URL input.
 * - "Upload" — file picker with client-side JPEG compression (max 800 px, 0.75 quality).
 *
 * On save, calls `addChannel` or `updateChannel` from {@link useAdminStore}
 * and navigates back to `/admin/panel`.
 *
 * Route protection: Redirects to `/admin` when `isAdminAuth` is false.
 */
export default function AdminForm() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { channels, addChannel, updateChannel, isAdminAuth } = useAdminStore();

    const existing = id ? channels.find((c) => c.id === id) : null;
    const isEditing = !!existing;

    // Form state
    const [title, setTitle] = useState(existing?.title ?? '');
    const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? '');
    const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
    const [description, setDescription] = useState(existing?.description ?? '');
    const [selectedTags, setSelectedTags] = useState<string[]>(existing?.tags ?? []);
    const [imageMode, setImageMode] = useState<ImageMode>('url');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    // Route protection
    useEffect(() => {
        if (!isAdminAuth) router.replace('/admin' as any);
    }, [isAdminAuth]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    // Web file picker — auto-compresses image before storing in localStorage
    const pickImageFile = useCallback(() => {
        if (Platform.OS !== 'web') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('Imagen muy grande', 'Selecciona una imagen menor a 10 MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const raw = ev.target?.result as string;
                const compressed = await compressImageWeb(raw);
                setImageUrl(compressed);
                setErrors((prev) => ({ ...prev, imageUrl: '' }));
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, []);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!title.trim()) errs.title = 'El título es requerido';
        if (!videoUrl.trim()) errs.videoUrl = 'La URL del video es requerida';
        else if (!videoUrl.trim().startsWith('http')) errs.videoUrl = 'Debe ser una URL válida (https://...)';
        if (!imageUrl.trim()) errs.imageUrl = 'La imagen del canal es requerida';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 300));
        const data = {
            title: title.trim(),
            videoUrl: videoUrl.trim(),
            imageUrl: imageUrl.trim(),
            description: description.trim(),
            tags: selectedTags,
        };
        if (isEditing && id) {
            updateChannel(id as string, data);
        } else {
            addChannel(data);
        }
        setSaving(false);
        router.replace('/admin/panel' as any);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1A052E' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 20, paddingVertical: 14,
                borderBottomWidth: 1, borderBottomColor: '#2A0E47',
            }}>
                <TouchableOpacity
                    style={{
                        width: 38, height: 38,
                        backgroundColor: '#2A0E47', borderRadius: 10,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: '#3D1A6E',
                    }}
                    onPress={() => router.back()}
                >
                    <FontAwesome name="arrow-left" size={15} color="white" />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: 'white', fontSize: 19, fontWeight: '800' }}>
                        {isEditing ? 'Editar Canal' : 'Agregar Canal'}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>
                        {isEditing ? `Editando: ${existing?.title}` : 'Nuevo contenido de streaming'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── TÍTULO ── */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={LABEL_STYLE}>TÍTULO DEL CANAL *</Text>
                        <TextInput
                            style={[INPUT_STYLE, errors.title ? { borderColor: '#f87171' } : {},
                                Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                            placeholder="Ej: Canal 35 HD, HBO Max, ESPN..."
                            placeholderTextColor="#4b5563"
                            value={title}
                            onChangeText={(t) => { setTitle(t); setErrors((p) => ({ ...p, title: '' })); }}
                        />
                        {errors.title ? <Text style={ERROR_STYLE}>{errors.title}</Text> : null}
                    </View>

                    {/* ── URL DEL VIDEO ── */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={LABEL_STYLE}>URL DEL VIDEO *</Text>
                        <TextInput
                            style={[INPUT_STYLE, errors.videoUrl ? { borderColor: '#f87171' } : {},
                                Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                            placeholder="https://...playlist.m3u8"
                            placeholderTextColor="#4b5563"
                            value={videoUrl}
                            onChangeText={(t) => { setVideoUrl(t); setErrors((p) => ({ ...p, videoUrl: '' })); }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                            <FontAwesome name="info-circle" size={11} color="#6b7280" />
                            <Text style={{ color: '#6b7280', fontSize: 11 }}>
                                Soporta HLS (.m3u8), MP4 y streams en vivo
                            </Text>
                        </View>
                        {errors.videoUrl ? <Text style={ERROR_STYLE}>{errors.videoUrl}</Text> : null}
                    </View>

                    {/* ── IMAGEN ── */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={LABEL_STYLE}>IMAGEN DEL CANAL *</Text>

                        {/* Mode toggle */}
                        <View style={{
                            flexDirection: 'row', backgroundColor: '#2A0E47',
                            borderRadius: 12, padding: 4, marginBottom: 14,
                            alignSelf: 'flex-start', gap: 2,
                        }}>
                            {(['url', 'upload'] as ImageMode[]).map((mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={{
                                        paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9,
                                        backgroundColor: imageMode === mode ? '#4A148C' : 'transparent',
                                    }}
                                    onPress={() => setImageMode(mode)}
                                >
                                    <Text style={{
                                        fontSize: 13, fontWeight: '600',
                                        color: imageMode === mode ? 'white' : '#6b7280',
                                    }}>
                                        {mode === 'url' ? '🔗  URL' : '📁  Subir archivo'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {imageMode === 'url' ? (
                            <TextInput
                                style={[INPUT_STYLE, errors.imageUrl ? { borderColor: '#f87171' } : {},
                                    Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                                placeholder="https://ejemplo.com/portada.jpg"
                                placeholderTextColor="#4b5563"
                                value={imageUrl}
                                onChangeText={(t) => { setImageUrl(t); setErrors((p) => ({ ...p, imageUrl: '' })); }}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        ) : (
                            /* Upload zone (web only) */
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#2A0E47',
                                    borderRadius: 14,
                                    borderWidth: 2,
                                    borderColor: errors.imageUrl ? '#f87171' : '#4A148C',
                                    borderStyle: 'dashed',
                                    padding: 28,
                                    alignItems: 'center',
                                    gap: 10,
                                    opacity: Platform.OS !== 'web' ? 0.5 : 1,
                                }}
                                onPress={Platform.OS === 'web' ? pickImageFile : undefined}
                                disabled={Platform.OS !== 'web'}
                            >
                                <View style={{
                                    width: 56, height: 56, backgroundColor: '#1A052E',
                                    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FontAwesome name="cloud-upload" size={26} color="#7c43bd" />
                                </View>
                                <Text style={{ color: '#7c43bd', fontWeight: '700', fontSize: 15 }}>
                                    {imageUrl && imageUrl.startsWith('data:')
                                        ? '✓  Imagen cargada — clic para cambiar'
                                        : 'Seleccionar imagen'}
                                </Text>
                                <Text style={{ color: '#6b7280', fontSize: 12 }}>
                                    {Platform.OS === 'web'
                                        ? 'JPG, PNG, WEBP – máx. 5 MB'
                                        : 'Disponible solo en versión web'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {errors.imageUrl ? <Text style={ERROR_STYLE}>{errors.imageUrl}</Text> : null}

                        {/* Live image preview */}
                        {imageUrl ? (
                            <View style={{ marginTop: 14 }}>
                                <Text style={{ ...LABEL_STYLE, marginBottom: 6 }}>VISTA PREVIA</Text>
                                <View style={{ position: 'relative' }}>
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={{
                                            width: '100%', height: 190,
                                            borderRadius: 14, backgroundColor: '#2A0E47',
                                        }}
                                        resizeMode="cover"
                                    />
                                    <View style={{
                                        position: 'absolute', bottom: 10, right: 10,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 11 }}>Vista previa</Text>
                                    </View>
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {/* ── DESCRIPCIÓN ── */}
                    <View style={{ marginBottom: 20 }}>
                        <Text style={LABEL_STYLE}>DESCRIPCIÓN (opcional)</Text>
                        <TextInput
                            style={[INPUT_STYLE, { textAlignVertical: 'top', minHeight: 90 },
                                Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}]}
                            placeholder="Descripción del canal o contenido..."
                            placeholderTextColor="#4b5563"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* ── GÉNEROS / ETIQUETAS ── */}
                    <View style={{ marginBottom: 32 }}>
                        <Text style={LABEL_STYLE}>GÉNEROS (opcional)</Text>
                        <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>
                            Selecciona los que apliquen.
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {PRESET_TAGS.map((tag) => {
                                const active = selectedTags.includes(tag);
                                return (
                                    <TouchableOpacity
                                        key={tag}
                                        onPress={() => toggleTag(tag)}
                                        style={{
                                            paddingHorizontal: 14, paddingVertical: 8,
                                            borderRadius: 20,
                                            backgroundColor: active ? '#FFC107' : '#1A052E',
                                            borderWidth: 1,
                                            borderColor: active ? '#FFC107' : '#4A148C',
                                            flexDirection: 'row', alignItems: 'center', gap: 5,
                                        }}
                                    >
                                        {active && <FontAwesome name="check" size={10} color="#1A052E" />}
                                        <Text style={{
                                            color: active ? '#1A052E' : '#9ca3af',
                                            fontWeight: '600', fontSize: 13,
                                        }}>{tag}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── GUARDAR ── */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#FFC107', borderRadius: 14, paddingVertical: 18,
                            alignItems: 'center', opacity: saving ? 0.75 : 1,
                            shadowColor: '#FFC107', shadowOpacity: 0.4, shadowRadius: 16,
                            shadowOffset: { width: 0, height: 6 },
                        }}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#1A052E" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <FontAwesome name="save" size={18} color="#1A052E" />
                                <Text style={{ color: '#1A052E', fontWeight: '800', fontSize: 16 }}>
                                    {isEditing ? 'Guardar Cambios' : 'Guardar Canal'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}