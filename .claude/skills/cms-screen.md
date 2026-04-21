# /cms-screen — Crear pantalla CMS Luki Play

Crea o reescribe una pantalla CMS del frontend (`frontend/app/cms/`) siguiendo el sistema de diseño oficial de Luki Play.

## Uso

```
/cms-screen <nombre-pantalla> [descripción opcional de lo que debe hacer]
```

**Ejemplos:**
- `/cms-screen sliders`
- `/cms-screen planes Gestión de planes con precios, features y toggle activo/inactivo`
- `/cms-screen dashboard Rediseñar dashboard con métricas reales del backend`

---

## Instrucciones para el agente

Cuando se invoque este skill, leer primero el archivo de la pantalla si ya existe (`frontend/app/cms/<nombre>.tsx`), luego implementar o reescribir siguiendo TODAS las reglas de este documento.

---

## 1. Estructura base obligatoria

Toda pantalla CMS debe:

```tsx
import React, { ... } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ... } from 'react-native';
import { useRouter } from 'expo-router';
import { useCmsStore } from '../../services/cmsStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CmsShell, { C } from '../../components/cms/CmsShell';

export default function CmsNombrePantalla() {
  const { profile } = useCmsStore();
  const router = useRouter();

  // Guard de autenticación
  useEffect(() => {
    if (!profile) router.replace('/cms/login' as never);
  }, [profile]);
  if (!profile) return null;

  return (
    <CmsShell breadcrumbs={[{ label: 'Nombre Pantalla' }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* contenido */}
      </ScrollView>
    </CmsShell>
  );
}
```

---

## 2. Paleta de colores (tokens `C`)

Usar **exclusivamente** los tokens del objeto `C` exportado por `CmsShell`. NUNCA hardcodear colores salvo los valores literales documentados aquí:

| Token | Valor | Uso |
|-------|-------|-----|
| `C.bg` | `#090909` | Fondo general |
| `C.surface` | `rgba(24,24,24,0.86)` | Cards, paneles |
| `C.lift` | `rgba(34,34,34,0.96)` | Inputs, filas tabla, celdas info |
| `C.border` | `rgba(255,255,255,0.08)` | Bordes neutros |
| `C.borderMid` | `rgba(255,184,0,0.28)` | Bordes con énfasis |
| `C.accent` | `#FFB800` | Amarillo principal, botones primarios |
| `C.accentSoft` | `rgba(255,184,0,0.12)` | Fondos con tinte dorado |
| `C.accentBorder` | `rgba(255,184,0,0.30)` | Bordes activos/seleccionados |
| `C.accentGlow` | `rgba(255,184,0,0.22)` | Glow/sombra acento |
| `C.success` / `C.cyan` | `#17D1C6` | Estado activo, saludable, OK |
| `C.danger` / `C.rose` | `#D1105A` | Error, eliminar, inactivo |
| `C.roseSoft` | `rgba(209,16,90,0.14)` | Fondo danger suave |
| `C.muted` | `rgba(250,246,231,0.38)` | Labels, hints, metadatos |
| `C.text` | `#FAF6E7` | Texto principal |
| `C.textDim` | `rgba(250,246,231,0.50)` | Texto secundario |
| `C.textSec` | `rgba(250,246,231,0.65)` | Texto medio |

**Colores adicionales** (hardcodear solo estos, no otros):
- Violeta: `#B07CC6` / soft `rgba(176,124,198,0.12)`
- Info/azul: `#1E96FC` / soft `rgba(30,150,252,0.12)`
- Naranja warning: `#FF7900` / soft `rgba(255,121,0,0.12)`
- Púrpura profundo: `#60269E` / `#240046` / `#7303C0`

**Gradiente de fondo de página** (cuando la pantalla no usa CmsShell directamente):
```
radial-gradient(circle at top left, rgba(255,184,0,0.06), transparent 30%),
radial-gradient(circle at 85% 10%, rgba(96,38,158,0.08), transparent 28%),
linear-gradient(180deg, #0A0A12 0%, #060612 100%)
```

**Gradiente acento** (botones primarios, banners):
```
linear-gradient(135deg, #FFB800 0%, #FF7900 100%)
```

---

## 3. Tipografía

**REGLA CRÍTICA: NO tocar ni modificar las fuentes Heavitas y Montserrat.** Están configuradas en `frontend/styles/typography.ts` y se usan a través de `FONT_FAMILY`. No reemplazarlas, no cambiarlas, no añadir font-family inline que las sobreescriba.

Estilos de texto estándar:
```tsx
// Título de pantalla
{ color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }

// Subtítulo de sección
{ color: C.text, fontSize: 16, fontWeight: '700' }

// Label de columna / uppercase
{ color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }

// Texto de fila tabla
{ color: C.text, fontSize: 13, fontWeight: '600' }

// Hint / ayuda
{ color: C.muted, fontSize: 11 }

// Monospace (URLs, slugs, IDs)
fontFamily: Platform.OS === 'web' ? 'monospace' : undefined
```

---

## 4. Componentes reutilizables

### StatCard — tarjeta de métrica
```tsx
<View style={{ flex: 1, minWidth: 140, backgroundColor: C.surface, borderRadius: 12,
  padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row',
  alignItems: 'center', gap: 14 }}>
  <View style={{ width: 40, height: 40, borderRadius: 10,
    backgroundColor: `${COLOR}18`, alignItems: 'center', justifyContent: 'center' }}>
    <FontAwesome name={ICON} size={18} color={COLOR} />
  </View>
  <View>
    <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.5 }}>{LABEL}</Text>
    <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{VALUE}</Text>
  </View>
</View>
```

### Badge de estado
```tsx
// Activo/Success
<View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  backgroundColor: 'rgba(23,209,198,0.12)' }}>
  <Text style={{ color: '#17D1C6', fontSize: 10, fontWeight: '700' }}>ACTIVO</Text>
</View>

// Inactivo/Danger
<View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  backgroundColor: C.roseSoft }}>
  <Text style={{ color: C.danger, fontSize: 10, fontWeight: '700' }}>INACTIVO</Text>
</View>
```

### Botón primario (acento)
```tsx
<TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
  paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  backgroundColor: C.accent }}>
  <FontAwesome name="plus" size={14} color="#1A1A2E" />
  <Text style={{ color: '#1A1A2E', fontSize: 13, fontWeight: '700' }}>Nuevo elemento</Text>
</TouchableOpacity>
```

### Botón secundario
```tsx
<TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
  borderWidth: 1, borderColor: C.border, backgroundColor: 'transparent' }}>
  <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '600' }}>Cancelar</Text>
</TouchableOpacity>
```

### Input de texto
```tsx
const webInput = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};
<TextInput
  style={{ backgroundColor: C.lift, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    color: C.text, fontSize: 13, ...webInput }}
  placeholderTextColor={C.muted}
/>
```

### Fila de filtros (search + filtros + toggle vista)
```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10,
  backgroundColor: C.surface, borderRadius: 12, padding: 12, borderWidth: 1,
  borderColor: C.border, marginBottom: 16 }}>
  {/* search */}
  <View style={{ flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.lift, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
    <FontAwesome name="search" size={13} color={C.muted} />
    <TextInput style={{ flex: 1, color: C.text, fontSize: 13, ...webInput }}
      placeholder="Buscar..." placeholderTextColor={C.muted} />
  </View>
  {/* filtro pills */}
  {/* view toggle */}
</View>
```

### Tabla
```tsx
{/* Cabecera */}
<View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
  backgroundColor: C.tableHead, borderBottomWidth: 1, borderBottomColor: C.border }}>
  {COLUMNAS.map((col) => (
    <Text key={col} style={{ flex: 1, color: C.muted, fontSize: 10,
      fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>{col}</Text>
  ))}
</View>
{/* Filas */}
{items.map((item, i) => (
  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
    {/* celdas */}
  </View>
))}
```

### Modal (formulario)
```tsx
<Modal visible={showForm} transparent animationType="fade" onRequestClose={onClose}>
  <Pressable style={{ flex: 1, backgroundColor: 'rgba(5,5,12,0.8)' }} onPress={onClose}>
    <Pressable style={{ position: 'absolute', right: 0, top: 0, bottom: 0,
      width: 520, maxWidth: '95%', backgroundColor: C.surface,
      borderLeftWidth: 1, borderLeftColor: C.border }}
      onPress={(e) => e.stopPropagation()}>
      <ScrollView>
        {/* Header */}
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.border,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Título</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome name="times" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>
        {/* Body */}
        <View style={{ padding: 20 }}>
          {/* campos */}
        </View>
        {/* Footer */}
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: C.border,
          flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
          {/* botones */}
        </View>
      </ScrollView>
    </Pressable>
  </Pressable>
</Modal>
```

### Banner de bienvenida / highlight
```tsx
<LinearGradient
  colors={['rgba(36,0,70,0.6)', 'rgba(96,38,158,0.3)', 'rgba(115,3,192,0.15)']}
  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
  style={{ borderRadius: 16, padding: 28, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(96,38,158,0.25)' }}>
  <Text style={{ color: '#FFB800', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
    Etiqueta
  </Text>
  <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
    Título
  </Text>
  <Text style={{ color: C.textDim, fontSize: 13, lineHeight: 20 }}>Descripción</Text>
</LinearGradient>
```

### Empty state
```tsx
<View style={{ backgroundColor: C.surface, borderRadius: 14, borderWidth: 1,
  borderColor: C.border, padding: 48, alignItems: 'center', gap: 14 }}>
  <View style={{ width: 60, height: 60, borderRadius: 14,
    backgroundColor: C.accentFaint, alignItems: 'center', justifyContent: 'center' }}>
    <FontAwesome name={ICON} size={26} color={C.accent} />
  </View>
  <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>Sin elementos</Text>
  <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>
    Mensaje descriptivo de qué hacer.
  </Text>
</View>
```

---

## 5. Reglas de layout y espaciado

- Padding de pantalla: `24px`
- Gap entre secciones: `20-24px`
- Gap entre elementos dentro de sección: `12-16px`
- BorderRadius cards: `12-16px`
- BorderRadius inputs/botones: `8-10px`
- BorderRadius badges/pills: `20px` (full) o `6-8px` (tag)
- Stat cards: `flexDirection: 'row', flexWrap: 'wrap'` con `flex: 1, minWidth: 140`

---

## 6. Iconografía

Usar **solo** `FontAwesome` de `@expo/vector-icons/FontAwesome`. No usar otros icon packs.

Iconos frecuentes del CMS:
```
dashboard: 'th-large'        usuarios: 'users'
componentes: 'puzzle-piece'  planes: 'star'
canales: 'tv'                categorías: 'tags'
sliders: 'image'             monitor: 'bar-chart'
notificaciones: 'bell'       analítica: 'line-chart'
propaganda: 'bullhorn'       roles: 'shield'
editar: 'pencil'             eliminar: 'trash'
ver: 'eye'                   buscar: 'search'
agregar: 'plus'              cerrar: 'times'
guardar: 'check'             copiar: 'copy'
activo: 'circle'             inactivo: 'ban'
flecha: 'chevron-right'      orden: 'sort'
```

---

## 7. Conexión con el backend

- **API calls**: usar funciones de `frontend/services/api/adminApi.ts`
- **Estado global**: usar stores Zustand en `frontend/services/`
- **Al montar**: llamar al endpoint correspondiente y sincronizar el store con `syncFromApi()`
- **Optimistic updates**: actualizar el store localmente antes de confirmar con la API
- **Manejo de errores**: mostrar banner de feedback con `C.roseSoft` / `C.danger`

Patrón de carga:
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  adminGetXxx()
    .then((data) => { store.syncFromApi(data); setLoading(false); })
    .catch((e) => { setError(e.message); setLoading(false); });
}, []);
```

---

## 8. Feedback al usuario

Banner de feedback (éxito / error):
```tsx
{feedback && (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 10, marginBottom: 16,
    backgroundColor: feedback.type === 'success' ? C.cyanSoft : C.roseSoft,
    borderWidth: 1, borderColor: feedback.type === 'success' ? '#17D1C6' : C.danger }}>
    <FontAwesome name={feedback.type === 'success' ? 'check-circle' : 'exclamation-circle'}
      size={14} color={feedback.type === 'success' ? '#17D1C6' : C.danger} />
    <Text style={{ color: feedback.type === 'success' ? '#17D1C6' : C.danger,
      fontSize: 13, flex: 1 }}>{feedback.message}</Text>
  </View>
)}
```

---

## 9. Lo que NO hacer

- ❌ Modificar `frontend/styles/typography.ts` ni las fuentes Heavitas/Montserrat
- ❌ Usar `StyleSheet.create()` — usar objetos inline como el resto del CMS
- ❌ Hardcodear colores fuera de los documentados en sección 2
- ❌ Usar `div`, `button`, `span` u otros elementos web — solo primitivas React Native
- ❌ Agregar `import { StyleSheet }` — no se usa en este proyecto
- ❌ Crear helpers, utilidades o abstracciones que no sean necesarias para la pantalla
- ❌ Usar `flexGrow` / `flexShrink` cuando `flex: 1` alcanza
- ❌ Agregar comentarios obvios — solo donde la lógica no sea evidente
