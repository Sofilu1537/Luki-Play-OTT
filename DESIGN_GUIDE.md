# LUKI PLAY — Guía de Diseño y Estrategia UX Profesional

> Versión 1.0 · Sprint 1 · Autor: UX Review Automatizado · Fecha: 2026-04-21

---

## ÍNDICE

1. [Identidad de Marca](#1-identidad-de-marca)
2. [Sistema de Color Consolidado](#2-sistema-de-color-consolidado)
3. [Sistema Tipográfico](#3-sistema-tipográfico)
4. [Espaciado y Layout](#4-espaciado-y-layout)
5. [Componentes Centrales](#5-componentes-centrales)
6. [Patrones de Interacción](#6-patrones-de-interacción)
7. [Módulos del Proyecto — Estado y Estándar](#7-módulos-del-proyecto--estado-y-estándar)
8. [Problemas Actuales y Deuda de Diseño](#8-problemas-actuales-y-deuda-de-diseño)
9. [Estrategia de Implementación Profesional](#9-estrategia-de-implementación-profesional)
10. [Checklist de Revisión de Diseño](#10-checklist-de-revisión-de-diseño)

---

## 1. IDENTIDAD DE MARCA

### Concepto de Marca

**Luki Play** es una plataforma OTT (streaming) latinoamericana orientada al hogar digital. Su identidad visual comunica:

| Dimensión | Valor |
|-----------|-------|
| **Personalidad** | Moderno · Confiable · Entretenimiento premium |
| **Tono** | Sofisticado pero accesible · Tecnológico pero cálido |
| **Audiencia** | Familias y adultos jóvenes hispanoablantes |
| **Tagline** | *"tu hogar digital"* |
| **Posicionamiento** | Streaming local con calidad internacional |

### Pilares Visuales de la Marca

```
PROFUNDIDAD          ENERGÍA              CLARIDAD
Violetas oscuros  +  Amarillo/oro dorado  +  Tipografía limpia
(cosmos, espacio)    (destaque, acción)       (Montserrat, Heavitas)
```

### Logo — Reglas de Uso

El logo `LukiPlayLogo` tiene 3 variantes. Cada una tiene un contexto específico:

| Variante | Cuándo usar | Cuándo NO usar |
|----------|------------|----------------|
| **`full`** | Splash, login, onboarding, pantallas de bienvenida | Dentro de navegación, headers pequeños |
| **`compact`** | Headers del CMS, sidebar colapsado, emails | Pantallas pequeñas con espacio limitado |
| **`icon`** | Favicon, notificaciones, avatar de app | Contextos que requieran el nombre legible |

**Espacio de protección del logo**: Siempre dejar un margen mínimo de `16px` alrededor del logo en cualquier variante.

**No hacer nunca:**
- Cambiar los colores del logo fuera del sistema de marca
- Escalar el logo por debajo de 32px de altura
- Superponer texto sobre el logo
- Usar el logo sobre fondos que no sean oscuros o blancos

### Paleta Emocional

```
PRIMARIO (Profundidad)   #240046 → #60269E   Violeta oscuro a medio
ACCIÓN (Energía)         #FFB800              Amarillo dorado
TEXTO (Claridad)         #FAF6E7              Crema cálida
ÉXITO (Confianza)        #17D1C6              Cian turquesa
PELIGRO (Alerta)         #D1105A              Rojo rosa
```

---

## 2. SISTEMA DE COLOR CONSOLIDADO

> **Problema actual detectado**: El proyecto tiene colores definidos en 4 lugares distintos (`tailwind.config.js`, `styles/theme.ts`, inline en `login.tsx`, inline en `CmsShell.tsx`). Esto genera inconsistencias. La fuente de verdad DEBE ser `styles/theme.ts`.

### 2.1 Tokens Primarios (Source of Truth)

Estos son los únicos valores a usar. Todos los demás son aliases o derivados.

```typescript
// styles/theme.ts — TOKENS CANÓNICOS

export const BRAND = {
  // Escala de marca principal
  void:        '#0D001A',   // Fondo más oscuro (gradiente extremo)
  deep:        '#240046',   // Fondo principal de app
  rich:        '#3A0C6E',   // Superficie de componentes sobre deep
  royal:       '#60269E',   // Elementos interactivos sobre rich
  vivid:       '#7B2FBE',   // Hover, énfasis, bordes activos

  // Acento
  gold:        '#FFB800',   // ACCIÓN PRIMARIA — botones, iconos activos, indicadores
  goldSoft:    'rgba(255,184,0,0.15)',  // Fondos de elementos activos

  // Texto
  cream:       '#FAF6E7',   // Texto primario
  creamMid:    'rgba(250,246,231,0.65)',  // Texto secundario
  creamLow:    'rgba(250,246,231,0.38)',  // Texto terciario/placeholder

  // Semánticos
  success:     '#17D1C6',   // Éxito, en vivo, activo
  danger:      '#D1105A',   // Error, eliminación, peligro
  warning:     '#FF7900',   // Advertencia, suspendido
  info:        '#1E96FC',   // Información, neutro
  tag:         '#B07CC6',   // Etiquetas, VOD, clasificación
} as const;
```

### 2.2 Tokens de Superficie (Tema Oscuro)

```typescript
export const DARK = {
  // Fondos por nivel (Z-axis conceptual)
  bg0:         '#0D001A',              // Capa 0: debajo de todo (gradiente login)
  bg1:         '#240046',              // Capa 1: fondo de página
  bg2:         'rgba(58,12,110,0.60)', // Capa 2: cards, paneles
  bg3:         'rgba(96,38,158,0.25)', // Capa 3: elementos flotantes, modales

  // Bordes
  borderLow:   'rgba(255,255,255,0.08)',
  borderMid:   'rgba(96,38,158,0.24)',
  borderHigh:  'rgba(255,184,0,0.40)',  // Focus, selección activa

  // Inputs
  inputBg:     'rgba(255,255,255,0.07)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputFocus:  'rgba(255,184,0,0.40)',

  // Overlay
  overlay:     'rgba(13,0,26,0.80)',   // Modales, drawers
} as const;
```

### 2.3 Tokens de Superficie (Tema CMS — Claro sobre oscuro)

```typescript
export const CMS_SURFACE = {
  cardBg:      '#FFFFFF',
  cardBorder:  'rgba(36,0,70,0.10)',
  cardShadow:  '#240046',

  labelColor:  '#60269E',
  valueColor:  '#240046',
  bodyText:    '#1A1A2E',
  mutedText:   '#64748B',
} as const;
```

### 2.4 Guía de Uso por Contexto

| Situación | Token a usar |
|-----------|-------------|
| Fondo de página app | `BRAND.deep` (#240046) |
| Fondo de tarjeta | `DARK.bg2` |
| Botón de acción principal | `BRAND.gold` background + `BRAND.deep` text |
| Botón secundario | `DARK.bg3` background + `BRAND.cream` text |
| Texto principal | `BRAND.cream` |
| Texto de apoyo | `BRAND.creamMid` |
| Placeholder / hint | `BRAND.creamLow` |
| Input enfocado | border `DARK.borderHigh` |
| Item activo en nav | `BRAND.gold` icon + `BRAND.goldSoft` background |
| Badge "en vivo" | `BRAND.success` + alpha background |
| Badge "error" | `BRAND.danger` + alpha background |

### 2.5 Gradientes Estándar

```typescript
export const GRADIENTS = {
  // Fondo principal de pantallas auth/splash
  appBackground:   ['#240046', '#0D001A'],

  // Overlay sobre imágenes de hero
  heroOverlay:     ['transparent', 'rgba(13,0,26,0.95)'],

  // Logo / elementos de marca
  brandPrimary:    ['#7B2FBE', '#5A1E9E', '#3A0C6E'],

  // Sidebar CMS
  sidebar:         ['#240046', '#1a0033'],

  // Header CMS dashboard
  cmsHeader:       ['#240046', '#60269E'],

  // Dirección: { start: {x:0,y:0}, end: {x:1,y:1} } para diagonal
  // Dirección: { start: {x:0,y:0}, end: {x:0,y:1} } para vertical
} as const;
```

---

## 3. SISTEMA TIPOGRÁFICO

### 3.1 Familias Tipográficas

| Familia | Uso | Emoción que transmite |
|---------|-----|-----------------------|
| **Heavitas** | Títulos (h1–h4), Hero, Logotipo | Impacto, modernidad, peso de marca |
| **Montserrat Bold** | Botones, badges, labels, captions | Claridad, jerarquía, legibilidad |
| **Montserrat SemiBold** | Body, descripciones, contenido | Neutralidad, lectura cómoda |
| **Montserrat Regular** | Texto de apoyo, placeholders | Levedad, información secundaria |

### 3.2 Escala Tipográfica Completa

```
DISPLAY
  hero-title    Heavitas · 40px · lineHeight 44 · tracking -0.5
  page-title    Heavitas · 34px · lineHeight 38 · tracking -0.3

ENCABEZADOS
  h1            Heavitas · 28px · lineHeight 34
  h2            Heavitas · 22px · lineHeight 28
  h3            Heavitas · 18px · lineHeight 24
  h4            Heavitas · 16px · lineHeight 22

CUERPO
  body-lg       Montserrat-SemiBold · 15px · lineHeight 23
  body          Montserrat-SemiBold · 14px · lineHeight 20
  body-sm       Montserrat-SemiBold · 13px · lineHeight 18

UTILITARIOS
  caption       Montserrat-Bold · 12px · lineHeight 16
  overline      Montserrat-Bold · 10px · lineHeight 12 · uppercase · letterSpacing 1.2
  badge         Montserrat-Bold · 9px  · lineHeight 10 · uppercase · letterSpacing 0.8
```

### 3.3 Reglas de Jerarquía

1. **Una sola fuente de display por pantalla**: solo un elemento puede usar `hero-title` o `h1` por vista.
2. **Nunca Heavitas por debajo de 14px**: pierde legibilidad.
3. **Montserrat-Regular** se reserva exclusivamente para texto de apoyo/muted, nunca para acción.
4. **Espaciado entre párrafos**: mínimo `lineHeight × 0.5` entre bloques de texto.
5. **Longitud de línea máxima**: 60–70 caracteres para confort de lectura (especialmente en web).

### 3.4 Reglas de Color de Texto

| Nivel de importancia | Token de color | Contraste WCAG |
|---------------------|---------------|---------------|
| Primario | `BRAND.cream` | AA/AAA sobre fondos oscuros |
| Secundario | `BRAND.creamMid` (65%) | AA sobre fondos oscuros |
| Deshabilitado/Hint | `BRAND.creamLow` (38%) | A (mínimo aceptable) |
| Acento/Activo | `BRAND.gold` | AA sobre fondos oscuros |
| Error | `BRAND.danger` | AA sobre fondos oscuros |
| Éxito | `BRAND.success` | AA sobre fondos oscuros |

---

## 4. ESPACIADO Y LAYOUT

### 4.1 Escala de Espaciado (Base 4px)

```
4   →  xs    Separación mínima (iconos, dots)
8   →  sm    Separación entre elementos relacionados (label + input)
12  →  md    Padding interior de componentes pequeños (badges, chips)
16  →  base  Padding estándar de tarjetas, contenedores
20  →  lg    Separación entre secciones cercanas
24  →  xl    Padding de pantallas, separación entre componentes
32  →  2xl   Separación entre secciones grandes
48  →  3xl   Separación entre bloques mayores
```

**Regla de oro**: Usar múltiplos de 4. Nunca valores impares como 7px, 13px, 15px excepto en fuentes.

### 4.2 Radio de Bordes (Border Radius)

```
4   →  r-xs    Chips, tags muy pequeños
8   →  r-sm    Inputs, items de lista
12  →  r-md    Tarjetas medianas, botones
16  →  r-lg    Tarjetas principales, modales
20  →  r-xl    Modales grandes, drawers
28  →  r-full  Badges circulares, avatares
```

**Estándar por componente**:
- Botones primarios: `12px`
- Inputs: `12px`
- Tarjetas pequeñas: `12px`
- Tarjetas de contenido: `16px`
- Modales: `20px`
- Badges de estado: `20px` (pill)

### 4.3 Grid y Layout

**App OTT (móvil):**
```
Padding horizontal de pantalla: 16px (nunca menos)
Separación entre secciones: 32px
Cards de media: 128×192px fijos (proporción 2:3)
Filas horizontales: gap 12px entre cards
```

**CMS (web/tablet):**
```
Sidebar width:          280px (expandido) / 72px (colapsado)
Main content padding:   24px
Separación de sección:  24px
Cards de stats:         flex, min 140px, gap 12px
```

### 4.4 Sistema de Elevación (Sombras)

```typescript
export const SHADOWS = {
  // Elementos sobre fondo
  card: {
    shadowColor: '#240046',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  // Modales y overlays
  modal: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },
  // Botón de acción principal
  button: {
    shadowColor: '#FFB800',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  // Tarjetas CMS blancas
  cmsCard: {
    shadowColor: '#240046',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
} as const;
```

---

## 5. COMPONENTES CENTRALES

### 5.1 Botones

#### Variantes Requeridas

| Variante | Background | Texto | Borde | Uso |
|----------|-----------|-------|-------|-----|
| **primary** | `BRAND.gold` | `BRAND.deep` | — | Acción principal de la pantalla |
| **secondary** | `DARK.bg3` | `BRAND.cream` | `DARK.borderMid` | Acción secundaria |
| **ghost** | transparent | `BRAND.gold` | `BRAND.gold` | Acción terciaria, destructiva |
| **danger** | `BRAND.danger` 15% | `BRAND.danger` | `BRAND.danger` 30% | Eliminar, cancelar |
| **disabled** | `DARK.bg3` | `BRAND.creamLow` | — | Estado inactivo |

#### Estados Obligatorios
- **default**: Estilo base
- **pressed/active**: opacity 0.75 + scale 0.97 (leve compresión)
- **loading**: Spinner en color del texto, ocultar label
- **disabled**: opacity 0.45, no interactivo

### 5.2 Inputs

#### Anatomía
```
[Label opcional — overline, creamMid]
[  [Icono izq] [Texto] [Icono der — clear/toggle]  ]  ← Input container
[Mensaje de error o hint — caption, danger/creamMid]
```

#### Estados Obligatorios
- **default**: border `DARK.borderLow`
- **focused**: border `DARK.borderHigh` (gold), label sube / se colorea
- **filled**: igual a default con texto visible
- **error**: border `BRAND.danger` 50%, mensaje de error visible
- **disabled**: opacity 0.45, no editable

### 5.3 Tarjetas de Media (Poster Cards)

```
Dimensión estándar: 128×192px (proporción 2:3)
Border radius: 12px
Overlay de gradiente en la parte inferior (para título)
Indicador de estado (LIVE/VOD) como badge superior izquierdo
Tap area: extender al componente completo
```

### 5.4 Hero Banner

```
Altura: 55-65% de viewport
Imagen de fondo: cover, con overlay heroOverlay gradient
Posición del contenido: bottom, px-4, pb-12
Título: hero-title
Metadata (géneros, año, etc.): body-sm, creamMid
Botones: fila horizontal, gap 12px
  - Play: primary button reducido
  - Info: secondary button reducido
```

### 5.5 Navigation Bar (Tab Bar)

```
Background: BRAND.deep (#0F041C / #240046)
Height: 60px
Padding: 8px top/bottom
Icon size: 24px
Label: overline (10px, uppercase)
Active: BRAND.gold icon + gold label
Inactive: creamLow icon + label
Active indicator: punto dorado o línea superior de 2px
Sin border-top visible
```

### 5.6 CMS Sidebar

```
Background: gradient sidebar (GRADIENTS.sidebar)
Width: 280px expandido / 72px colapsado
Item height: 48px
Item padding: 12px horizontal
Active item: goldSoft background + gold icon + gold text
Hover item: DARK.bg3 background
Separator: borderLow
Footer: footerText cyan (#17D1C6)
Logo en header: variante 'compact'
```

### 5.7 Badges de Estado

Seguir exactamente el sistema `StatusBadge` existente. Nunca crear badges ad-hoc.

| Estado | Uso |
|--------|-----|
| `live` | Canal en emisión ahora mismo |
| `scheduled` | Programado para el futuro |
| `vod` | Contenido bajo demanda |
| `active` | Usuario/recurso activo |
| `inactive` | Usuario/recurso inactivo |
| `suspended` | Bloqueado temporalmente |
| `info` | Información adicional |
| `success` | Completado con éxito |
| `danger` | Error o acción irreversible |
| `warning` | Precaución requerida |

---

## 6. PATRONES DE INTERACCIÓN

### 6.1 Feedback Visual Obligatorio

Todo elemento interactivo DEBE tener respuesta visual:

```
Toque / Click     → opacity 0.75-0.80 en 100ms
Hover (web/cms)   → backgroundColor levemente más claro en 150ms
Loading           → Spinner + texto opcional + deshabilitado
Éxito             → Cambio a estado success (color + icono) por 2s
Error             → Estado error (rojo) + mensaje accesible
```

### 6.2 Estados de Pantalla (Completos)

Cada pantalla/módulo debe manejar TODOS estos estados:

| Estado | Qué mostrar |
|--------|-------------|
| **Loading** | Skeleton screens (no spinners solos) |
| **Empty** | Ilustración + mensaje + CTA cuando aplique |
| **Error** | Mensaje claro + botón de reintentar |
| **Success** | Confirmación visual efímera (2-3s) |
| **Offline** | Banner superior persistente |

### 6.3 Skeleton Loading (Requerido)

Los skeleton loaders deben coincidir en shape/size con el contenido que van a reemplazar:
- Cards de media: rectangulo 128×192 con pulse animation
- Stats cards CMS: rectangulo proporcional
- Rows de contenido: placeholder de lista

```typescript
// Patrón de skeleton recomendado
const SkeletonPulse = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  // Animación: opacity 0.06 → 0.12 → 0.06, ciclo 1.5s
}
```

### 6.4 Micro-interacciones Recomendadas

| Componente | Micro-interacción |
|-----------|-------------------|
| Botón primario | Scale 0.97 en press + sombra dorada reduced |
| Tab activo | Slide indicator + fade de icono |
| Card de media | Scale 1.03 en hover (web) |
| Input con error | Shake horizontal (300ms) |
| Modal appearance | Slide-up + fade, 250ms |
| Badge LIVE | Dot pulse animation (2s loop) |

---

## 7. MÓDULOS DEL PROYECTO — ESTADO Y ESTÁNDAR

### 7.1 App OTT (Usuario Final)

#### `/(auth)/login.tsx` — Autenticación
**Estado**: Funcional. Diseño sólido.
**Mejoras requeridas**:
- [ ] Reemplazar objeto `P` (paleta local) con tokens de `theme.ts`
- [ ] Agregar estado skeleton/loading al cargar la pantalla
- [ ] Animar la transición entre los 4 sub-screens (slide horizontal)
- [ ] Verificar contraste de `textSec` (#D0C4E8) — puede ser insuficiente sobre bg

#### `/(app)/home.tsx` — Catálogo Principal
**Estado**: Funcional.
**Mejoras requeridas**:
- [ ] Skeleton loading mientras cargan las filas de media
- [ ] Estado "vacío" cuando no haya contenido
- [ ] Animar aparición de filas (staggered fade-in)
- [ ] Unificar color del tab bar con `BRAND.deep`

#### `/(app)/search.tsx` — Búsqueda
**Estado**: Placeholder. PENDIENTE de diseño.
**Debe tener**:
- Input de búsqueda prominente en la parte superior (hero de input)
- Grid de resultados 2 columnas (3 en tablet)
- Estado vacío con sugerencias de búsqueda
- Filtros por categoría (chips horizontales)
- Histórico de búsquedas recientes

#### `/(app)/favorites.tsx` — Mi Lista
**Estado**: Placeholder. PENDIENTE de diseño.
**Debe tener**:
- Grid de contenido guardado (mismas cards del catálogo)
- Estado vacío con CTA para ir a explorar
- Opción de eliminar items (swipe o long-press)
- Categorización por tipo (peliculas, series, canales)

#### `/player/[id].tsx` — Reproductor
**Estado**: Funcional.
**Mejoras requeridas**:
- [ ] Controles con fade-out automático (3s inactividad)
- [ ] Indicador de buffer (animated progress)
- [ ] Panel de calidad de stream
- [ ] Gestos: tap=play/pause, swipe horizontal=seek

---

### 7.2 CMS (Panel Administrativo)

#### `/cms/dashboard.tsx` — Dashboard
**Estado**: Funcional. Diseño referencial.
**Mejoras requeridas**:
- [ ] Aplicar skeleton a todas las stats cards
- [ ] Responsive: colapsar a 1-2 columnas en móvil
- [ ] Consistencia de shadow en tarjetas (usar `SHADOWS.cmsCard`)

#### `/cms/usuarios.tsx` — Usuarios
**Estado**: En desarrollo.
**Debe tener**:
- Tabla/lista con avatar, nombre, rol, estado, fecha
- Filtros: por rol, por estado, búsqueda por nombre
- Acciones: crear, editar, suspender, eliminar
- Modal de confirmación para acciones destructivas

#### `/cms/canales.tsx` — Canales
**Estado**: Funcional con mock data.
**Debe tener**:
- Lista con thumbnail del canal, nombre, estado badge, viewers
- Preview inline (sin salir del CMS)
- Toggle rápido de estado (live/offline)
- Acciones de edición en modal lateral (drawer)

#### `/cms/categorias.tsx` — Categorías
**Estado**: En desarrollo.
**Debe tener**:
- Lista drag-and-drop para reordenar
- Form inline de creación
- Count de contenido por categoría

---

## 8. PROBLEMAS ACTUALES Y DEUDA DE DISEÑO

### 8.1 Inconsistencias Críticas (Alta Prioridad)

| # | Problema | Dónde | Impacto |
|---|---------|-------|---------|
| 1 | Colores definidos en 4 archivos distintos sin source of truth único | `tailwind.config.js`, `theme.ts`, `login.tsx`, `CmsShell.tsx` | Mantenimiento imposible a escala |
| 2 | `login.tsx` tiene su propio objeto `P` de colores hardcodeado | `app/(auth)/login.tsx` | Deriva visual del login vs. resto |
| 3 | `CmsShell.tsx` exporta objeto `C` que reimplementa tokens de `theme.ts` | `components/cms/CmsShell.tsx` | Duplicación y divergencia |
| 4 | Tab bar usa `#FFC107` pero el token de accent es `#FFB800` (2 amarillos distintos) | `app/(app)/_layout.tsx` | Inconsistencia cromática visible |
| 5 | Fondo del hero usa `#0F041C` pero no existe como token | `components/Hero.tsx` | No escalable |

### 8.2 Ausencias de Diseño (Media Prioridad)

| # | Ausencia | Impacto |
|---|---------|---------|
| 1 | No hay skeleton loaders en ninguna pantalla | UX pobre durante carga |
| 2 | No hay estados "vacío" definidos para search/favorites | Pantallas rotas en casos reales |
| 3 | No hay sistema de micro-animaciones | Experiencia estática, poco premium |
| 4 | CMS: no hay modal/drawer estandarizado para acciones | Cada módulo inventa su propio patrón |
| 5 | No hay toast/notification system | Feedback de acciones perdido |

### 8.3 Riesgos de Accesibilidad (Alta Prioridad)

| # | Riesgo | Solución |
|---|--------|---------|
| 1 | `textSec: #D0C4E8` sobre fondo `#240046` — ratio ~3.8:1 (por debajo del 4.5 requerido) | Usar `BRAND.creamMid` en su lugar |
| 2 | Texto muted en CMS (`rgba(250,246,231,0.38)`) puede ser ilegible en algunos contextos | Verificar contexto, mínimo 0.45 de opacity |
| 3 | Botones sin `accessibilityLabel` en React Native | Agregar props de accesibilidad |
| 4 | Inputs sin `accessibilityHint` | Agregar a todos los forms |

---

## 9. ESTRATEGIA DE IMPLEMENTACIÓN PROFESIONAL

### FASE 1 — Consolidar el Fundamento (Sprint 2, 1 semana)

**Objetivo**: Una sola fuente de verdad para todos los tokens de diseño.

#### Tareas

**1.1 Limpiar y completar `styles/theme.ts`**
```
- Agregar tokens BRAND, DARK, CMS_SURFACE, SHADOWS, GRADIENTS
- Deprecar y eliminar el objeto 'C' en CmsShell.tsx
- Deprecar y eliminar el objeto 'P' en login.tsx
```

**1.2 Actualizar `tailwind.config.js`**
```
- Alinear colores 'luki.*' con los tokens de theme.ts
- Unificar 'accent: #FFC107' → '#FFB800' (gold correcto)
- Agregar tokens de spacing y border-radius
```

**1.3 Migrar componentes a tokens**
```
Prioridad alta:
  - Button.tsx         → usar BRAND.gold, BRAND.deep, SHADOWS.button
  - Input.tsx          → usar DARK.inputBg, DARK.inputBorder, DARK.inputFocus
  - Hero.tsx           → agregar #0F041C como BRAND.void o similar
  - login.tsx          → reemplazar objeto P con imports de theme.ts
  - CmsShell.tsx       → eliminar objeto C, importar de theme.ts
  - _layout.tsx        → unificar tabBarActiveTintColor a #FFB800
```

**Criterio de éxito**: Grep de colores hardcodeados en componentes = 0 resultados (excepto theme.ts).

---

### FASE 2 — Estados Incompletos (Sprint 2–3, 2 semanas)

**Objetivo**: Toda pantalla funciona dignamente en todos sus estados posibles.

#### Tareas

**2.1 Crear componente `SkeletonBlock`**
```typescript
// components/ui/SkeletonBlock.tsx
// Recibe: width, height, borderRadius
// Anima: opacity pulse 0.06 → 0.12
// Usado en: todas las pantallas durante carga
```

**2.2 Crear componente `EmptyState`**
```typescript
// components/ui/EmptyState.tsx
// Recibe: icon, title, description, ctaLabel, onCta
// Usado en: search, favorites, cualquier lista vacía
```

**2.3 Crear componente `Toast` / Sistema de notificaciones**
```typescript
// components/ui/Toast.tsx
// Variantes: success, error, info, warning
// Posición: bottom, 16px del borde, encima del tab bar
// Auto-dismiss: 3 segundos
// Stacking: máximo 3 toasts simultáneos
```

**2.4 Implementar skeletons en pantallas existentes**
```
home.tsx        → skeleton para hero + rows de media
cms/dashboard   → skeleton para stats cards
cms/usuarios    → skeleton para tabla de usuarios
cms/canales     → skeleton para lista de canales
```

---

### FASE 3 — Pantallas Pendientes (Sprint 3, 2 semanas)

**Objetivo**: Las 3 pantallas placeholder tienen diseño y funcionalidad real.

#### `search.tsx` — Diseño Propuesto
```
Layout:
  ├── Header: Input de búsqueda (full-width, prominent, auto-focus)
  ├── Chips horizontales: filtros por categoría (scrollable)
  ├── Sección "Búsquedas recientes" (cuando input vacío)
  └── Grid de resultados: 2 cols (3 en tablet), mismo card que catálogo

Estados:
  ├── Vacío/Inicial: Trending content o recomendaciones
  ├── Escribiendo: Results con highlight del término
  ├── Sin resultados: EmptyState + sugerencias
  └── Loading: SkeletonBlock grid
```

#### `favorites.tsx` — Diseño Propuesto
```
Layout:
  ├── Header: "Mi Lista" + contador de items
  ├── Ordenamiento: "Recientes" | "A-Z" | "Tipo" (tabs o dropdown)
  └── Grid: mismas cards 128×192 del catálogo, 3 cols

Estados:
  ├── Vacío: EmptyState con CTA "Ir al catálogo"
  ├── Con contenido: Grid normal
  └── Edit mode: Checkbox en cada card para eliminación masiva
```

#### Mejorar `player/[id].tsx`
```
- Controles superpuestos con fade-out en 3s
- Botón back (←) en esquina superior izquierda
- Barra de progreso (para VOD)
- Indicador de calidad del stream
- Soporte landscape obligatorio
```

---

### FASE 4 — CMS Módulos Completos (Sprint 4, 2–3 semanas)

**Objetivo**: Cada módulo del CMS tiene CRUD completo con UX coherente.

#### Patrón Estándar de Módulo CMS

Todos los módulos CMS deben seguir esta estructura:

```
CmsShell
  ├── PageHeader: título + breadcrumb + botón "Crear nuevo"
  ├── FilterBar: búsqueda + filtros dropdown (colapsable en móvil)
  ├── DataList/Table: lista principal
  │     ├── Loading: SkeletonBlock × n
  │     ├── Empty: EmptyState
  │     └── Populated: items con acciones (editar, cambiar estado, eliminar)
  └── ActionDrawer/Modal: formulario de creación/edición
        ├── Drawer lateral (desktop/tablet) — 380px
        └── Modal bottom sheet (móvil)
```

#### Módulos a Completar

| Módulo | CRUD | Filtros | Acciones |
|--------|------|---------|---------|
| Usuarios | Crear, Ver, Editar, Suspender | Rol, Estado, Búsqueda | Reset password, cambiar rol |
| Canales | Crear, Ver, Editar, Activar/Desactivar | Estado (live/off), Categoría | Preview, URL stream |
| Categorías | Crear, Editar, Reordenar, Eliminar | — | Drag-and-drop orden |
| Planes | Crear, Ver, Editar, Archivar | Estado, Precio | Asignar a usuarios |

---

### FASE 5 — Pulido y Micro-interacciones (Sprint 5, 1 semana)

**Objetivo**: La experiencia se siente premium, fluida y diferenciada.

#### Animaciones a Implementar

```typescript
// Usando Reanimated 2 (ya en el stack o fácil de agregar)

Transiciones de pantalla:
  - Auth screens: slide horizontal entre sub-screens
  - Player: fade desde catálogo

Componentes:
  - Modal/Drawer: slide-up + opacity, 250ms, easing out
  - Toast: slide-up desde abajo, 200ms
  - Tab indicator: slide horizontal entre tabs activos
  - Button press: scale 0.97, 100ms

Scroll:
  - Hero: parallax scroll (imagen se mueve al 60% de velocidad)
  - MediaRow: inertia scroll suave
```

---

## 10. CHECKLIST DE REVISIÓN DE DISEÑO

Antes de marcar cualquier pantalla como "completa", verificar:

### Colores
- [ ] Todos los colores provienen de tokens de `theme.ts` o `tailwind.config.js`
- [ ] No hay colores hexadecimales hardcodeados en el componente
- [ ] El contraste de texto cumple AA (ratio mínimo 4.5:1 para texto normal)
- [ ] Los estados interactivos tienen feedback visual de color

### Tipografía
- [ ] La pantalla tiene UN solo título de mayor jerarquía (h1 o hero-title)
- [ ] Los tamaños de fuente provienen de `typography.ts`
- [ ] Heavitas no se usa por debajo de 14px

### Espaciado
- [ ] Todos los paddings/margins son múltiplos de 4
- [ ] El padding horizontal mínimo de pantalla es 16px
- [ ] Las tarjetas tienen padding interior mínimo de 12px

### Estados
- [ ] Estado de loading implementado (skeleton o spinner)
- [ ] Estado vacío implementado (si aplica)
- [ ] Estado de error implementado
- [ ] Acciones exitosas tienen confirmación visual

### Interacción
- [ ] Todos los elementos tappable/clickable tienen feedback visual
- [ ] Los botones tienen estado `disabled` visual y funcional
- [ ] Los inputs tienen estados: default, focused, error, disabled

### Accesibilidad
- [ ] Imágenes con descripción (`accessibilityLabel`)
- [ ] Botones con label descriptivo
- [ ] Inputs con `accessibilityHint`
- [ ] Tamaño mínimo de tap target: 44×44px

### Responsive
- [ ] Funciona en iPhone SE (375px) sin overflow
- [ ] Funciona en iPad (768px+) sin elementos exageradamente grandes
- [ ] CMS es usable en 1024px y 1440px

---

## RESUMEN EJECUTIVO

**Luki Play tiene una identidad de marca sólida y diferenciada**: el sistema violeta oscuro + dorado es memorable, moderno y adecuado para una plataforma de streaming premium. El principal trabajo no es inventar una nueva estética, sino **consolidar y aplicar consistentemente la que ya existe**.

### Los 5 cambios de mayor impacto (ordenados por ROI):

1. **Consolidar colores en `theme.ts`** — elimina inconsistencias visibles en minutos
2. **Implementar skeleton loaders** — diferencia entre "app de juguete" y "producto real"
3. **Toast/notification system** — las acciones del CMS quedan silenciosas sin esto
4. **Diseñar Search y Favorites** — placeholders dejan la app incompleta para el usuario
5. **Micro-animaciones de transición** — es lo que hace que una app se sienta premium

### El principio guía para todo el equipo:

> **"Profundo como el cosmos, brillante como el oro."**
> Cada pantalla debe sentirse envolvente (violetas oscuros, gradientes de profundidad) y tener un punto focal claro de energía (el elemento dorado: el botón, el ícono activo, el indicador de estado).

---

*Guía generada automáticamente a partir del análisis del código fuente. Revisar y ajustar junto con el equipo de producto.*
