# Luki Play OTT — Linea Grafica y Estilos

> Documento de referencia para la implementacion visual de la plataforma Luki Play.
> Basado en el Manual de Identidad Corporativa LUKI (Impact Agency) + los tokens activos en el codigo.

---

## 1. Identidad de Marca

### Logo
- **"luki"**: Tipografia sans-serif bold, minusculas redondeadas, blanco sobre fondo oscuro
- **"play"**: Encapsulado en rectangulo dorado/ambar con esquinas redondeadas (badge CTA)
- **Dot** sobre la "i": Circulo dorado/naranja como marca de personalidad
- **Fondo**: Gradiente violeta profundo con formas organicas circulares

### Personalidad
- Calida y accesible (esquinas redondeadas, minusculas)
- Premium sin ser fria (dorado sobre violeta/negro)
- Entretenimiento digital (vibrante, gradientes modernos)

### Fondos permitidos para el logo
- Blanco, Purpura, Negro, Amarillo, Rojo
- **NO permitidos**: Naranja, Verdes, Magentas/Rosa

---

## 2. Colores del Manual de Marca

### Primarios

| Nombre            | HEX       | RGB            | Uso principal                          |
|-------------------|-----------|----------------|----------------------------------------|
| Russian Violet    | `#240046` | 36, 0, 70      | Violeta profundo, fondos OTT          |
| Rebecca Purple    | `#60269E` | 96, 38, 158    | Violeta medio, superficies elevadas   |
| Selective Yellow  | `#FFB800` | 255, 184, 0    | Acento principal, CTAs                |
| Cosmic Latte      | `#FAF6E7` | 250, 246, 231  | Texto primario sobre fondos oscuros   |

### Secundarios

| Nombre            | HEX       | Uso en la app                          |
|-------------------|-----------|----------------------------------------|
| Rose Red          | `#D1105A` | Error, alertas criticas                |
| Safety Orange     | `#FF7900` | Warning, notificaciones urgentes       |
| Dodger Blue       | `#1E96FC` | Informativo, links                     |
| Robin Egg Blue    | `#17D1C6` | En vivo, streaming activo              |
| French Violet     | `#7303C0` | Gradientes premium, decorativos        |
| African Violet    | `#B07CC6` | Tags, categorias                       |
| Space Cadet       | `#22244E` | Fondos alternativos deep               |
| Wisteria          | `#AE95DA` | Decorativos suaves                     |
| Melon             | `#FFB7AD` | Highlights suaves                      |
| Celeste           | `#B9FAF8` | Info suave                             |
| Mint Green        | `#D4FAE8` | Success suave                          |

### Degradados corporativos

```css
/* Principal corporativo (logo) */
linear-gradient(120deg, #240046 0%, #60269E 100%)

/* Hero / Featured content */
linear-gradient(135deg, #240046 0%, #60269E 50%, #7303C0 100%)

/* CTA / Boton primario */
linear-gradient(135deg, #FFB800 0%, #FF7900 100%)

/* Degradado energia */
linear-gradient(135deg, #D1105A 0%, #FF7900 100%)

/* Degradado neon */
linear-gradient(135deg, #EC38BC 0%, #7303C0 100%)
```

---

## 3. Tipografia

### Fuentes del manual

| Fuente            | Peso          | Uso                                    |
|-------------------|---------------|----------------------------------------|
| **Heavitas Bold** | Bold          | Titulos principales, hero text         |
| **Montserrat**    | SemiBold 600  | Subtitulos, labels de navegacion       |
| **Montserrat**    | Regular 400   | Cuerpo de texto, parrafos              |

> Heavitas no esta disponible como web font. Usar Sora (bold/extrabold) como alternativa web.

### Fuentes activas en el CMS

| Fuente     | Peso               | Uso en el codigo                       |
|------------|---------------------|----------------------------------------|
| **Sora**   | 600, 700, 800       | Titulos, nombre de marca, numeros hero |
| **Manrope**| 400, 500, 600, 700, 800 | Body, labels, navegacion, botones  |

Google Fonts import:
```
Manrope:wght@400;500;600;700;800
Sora:wght@600;700;800
```

### Escala tipografica

| Nivel           | Tamano | Fuente       | Weight | Line-height |
|-----------------|--------|--------------|--------|-------------|
| H1 Hero         | 34px   | Sora         | 700    | 1.1         |
| H2 Seccion      | 28px   | Sora         | 700    | 1.2         |
| H3 Card         | 22px   | Sora         | 700    | 1.3         |
| H4 Subseccion   | 17px   | Sora         | 600    | 1.4         |
| Body large      | 15px   | Manrope      | 600    | 1.5         |
| Body regular    | 13-14px| Manrope      | 600    | 1.4         |
| Caption         | 12px   | Manrope      | 700    | 1.3         |
| Overline        | 10px   | Manrope      | 700-800| 1.2, ls 1.2px, UPPERCASE |
| Badge small     | 9-10px | Manrope      | 800    | 1.0         |

---

## 4. Tema CMS — "LUKI NET Gold"

### Tokens activos (`cms/components/cms/CmsShell.tsx`)

```typescript
export const C = {
  void:        '#060606',              // fondo mas profundo
  panel:       'rgba(17,17,17,0.94)',  // sidebar + topbar
  surface:     'rgba(24,24,24,0.9)',   // cards
  lift:        'rgba(34,34,34,0.94)',  // hover/active
  border:      'rgba(255,255,255,0.08)',
  borderMid:   'rgba(255,198,41,0.24)',
  accent:      '#FFC629',              // DORADO — acento principal
  accentGlow:  'rgba(255,198,41,0.24)',
  accentLight: '#FFE08A',
  accentFaint: 'rgba(255,198,41,0.12)',
  accentBorder:'rgba(255,198,41,0.34)',
  stone:       '#D7CBB8',
  green:       '#9BBF63',
  amber:       '#FFDA6B',
  rose:        '#FF7A59',
  text:        '#F5F1E8',              // texto primario (warm white)
  textSec:     '#CBC2B2',              // texto secundario
  muted:       '#827A6A',              // muted/labels
  dimmed:      '#151515',
};
```

### Variables CSS (`cms/app/globals.css`)

```css
:root {
  --luki-bg:             #060606;
  --luki-bg-elevated:    #0d0d0d;
  --luki-panel:          rgba(17,17,17,0.92);
  --luki-surface:        rgba(24,24,24,0.88);
  --luki-surface-strong: rgba(32,32,32,0.96);
  --luki-line:           rgba(255,255,255,0.08);
  --luki-line-strong:    rgba(255,198,41,0.24);
  --luki-text:           #f5f1e8;
  --luki-text-soft:      #cbc2b2;
  --luki-text-muted:     #827a6a;
  --luki-accent:         #ffc629;
  --luki-accent-strong:  #ffd54d;
  --luki-accent-soft:    rgba(255,198,41,0.12);
  --luki-accent-glow:    rgba(255,198,41,0.24);
  --luki-danger:         #ff7a59;
  --luki-success:        #9bbf63;
  --luki-shadow:         0 24px 80px rgba(0,0,0,0.42);
}
```

### Gradientes del CMS

```css
/* Background html/body */
radial-gradient(circle at top left, rgba(255,198,41,0.16), transparent 30%),
radial-gradient(circle at 85% 10%, rgba(255,213,77,0.08), transparent 28%),
linear-gradient(180deg, #090909 0%, #060606 100%)

/* Sidebar */
linear-gradient(180deg, rgba(17,17,17,0.94) 0%, rgba(12,12,12,0.98) 100%)

/* Header bar */
linear-gradient(180deg, rgba(20,20,20,0.92), rgba(13,13,13,0.88))

/* Nav item activo */
linear-gradient(135deg, rgba(255,198,41,0.18), rgba(255,198,41,0.05))

/* Avatar */
linear-gradient(135deg, rgba(255,198,41,0.28), rgba(255,198,41,0.10))

/* Grid overlay (body::before) */
72px x 72px grid lines con rgba(255,255,255,0.02), opacity 0.18
```

---

## 5. Tema Frontend Mobile — "Nebula Dark"

### Tokens activos (`frontend/components/cms/CmsShell.tsx`)

```typescript
export const C = {
  bg:          '#050B17',              // fondo profundo (navy)
  panel:       '#070E1D',              // panel/sidebar
  sidebar:     '#070E1D',
  surface:     '#0C1829',              // cards
  surfaceAlt:  '#102236',              // surface alternativa
  lift:        '#102236',              // hover/active
  border:      'rgba(255,255,255,0.11)',
  accent:      '#7B5EF8',              // VIOLETA — acento principal
  accentLight: '#A78BFA',
  accentSoft:  'rgba(123,94,248,0.16)',
  accentBorder:'rgba(123,94,248,0.28)',
  cyan:        '#22D3EE',
  green:       '#10B981',
  amber:       '#FBBF24',
  rose:        '#F43F5E',
  success:     '#10B981',
  danger:      '#F43F5E',
  muted:       '#3F5475',
  text:        '#EFF6FF',              // texto primario (cool white)
  textSec:     '#94A3B8',
  textDim:     '#94A3B8',
};
```

### Tokens Tailwind OTT (`frontend/tailwind.config.js`)

```javascript
colors: {
  luki: {
    purple:      '#4A148C',
    lightPurple: '#7c43bd',
    accent:      '#FFC107',
    background:  '#2A0E47',
    dark:        '#1A052E',
    white:       '#ffffff',
    gray:        '#9E9E9E',
  }
}
```

---

## 6. Override violeta para modulos (estilo Categorias)

Para modulos que necesiten el fondo violeta profundo visible (como Categorias, Planes), usar este override local:

```typescript
const P = {
  pageBg:       'linear-gradient(180deg, #08001a 0%, #0d0025 100%)',
  cardBg:       'linear-gradient(180deg, #0C0628 0%, #18084A 60%, #2A1268 100%)',
  cardBorder:   'rgba(96,38,158,0.28)',
  cardHover:    'rgba(96,38,158,0.45)',
  metricBg:     '#0C0628',
  metricBorder: 'rgba(96,38,158,0.22)',
  bannerBg:     'linear-gradient(135deg, #130540 0%, #1F0B5E 100%)',
  purple:       '#A78BFA',
  purpleBg:     'rgba(167,139,250,0.14)',
  purpleBorder: 'rgba(167,139,250,0.28)',
  subtleBg:     'rgba(255,255,255,0.03)',
  ctaBg:        'linear-gradient(135deg, rgba(255,198,41,0.12), rgba(255,198,41,0.04))',
};
```

### Como aplicar el wrapper

```tsx
<CmsShell title="Mi Modulo">
  <div style={{
    background: P.pageBg,
    margin: '-28px -28px 0',
    padding: '28px',
    minHeight: 'calc(100vh - 80px)',
  }}>
    {/* contenido del modulo */}
  </div>
</CmsShell>
```

---

## 7. Espaciado

Escala base de 4px.

| Token   | Valor | Uso                          |
|---------|-------|------------------------------|
| `xs`    | 4px   | Separacion minima            |
| `sm`    | 8px   | Padding interno compacto     |
| `md`    | 12px  | Gaps entre elementos         |
| `lg`    | 16px  | Padding de cards             |
| `xl`    | 20px  | Margenes de seccion          |
| `2xl`   | 24px  | Padding de contenedores      |
| `3xl`   | 32px  | Separacion entre secciones   |
| `4xl`   | 48px  | Margenes de pantalla         |

Paddings comunes en CmsShell:
- Main content: `28px` desktop, `18px` mobile
- Header: `24px 28px 0` desktop, `18px 18px 0` mobile

---

## 8. Border Radius

| Valor  | Uso                                    |
|--------|----------------------------------------|
| 6px    | Badges de estado                       |
| 8px    | Etiquetas, chips pequenos              |
| 10px   | Inputs, botones pequenos, busqueda     |
| 12px   | Botones, tags                          |
| 14px   | Tablas, avatares, secciones            |
| 16px   | Botones grandes, status                |
| 18px   | Cards de contenido, nav items          |
| 20px   | Modales, tablas contenedoras           |
| 22px   | Footer sidebar, dropdowns              |
| 24px   | Sidebar brand panel, metric cards      |
| 28px   | Header bar principal                   |
| 999px  | Pills, badges circulares, scrollbar    |

---

## 9. Sombras

```css
/* Card normal */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);

/* Card hover */
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);

/* Card violeta (modulos con P override) */
box-shadow: 0 4px 20px rgba(10, 0, 40, 0.35);
box-shadow: 0 12px 40px rgba(10, 0, 40, 0.6); /* hover */

/* Glow dorado (CTAs) */
box-shadow: 0 0 20px rgba(255, 198, 41, 0.24);
box-shadow: 0 0 32px rgba(255, 198, 41, 0.4); /* hover */

/* Sombra principal (--luki-shadow) */
box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
```

---

## 10. Componentes UI

### Boton Primario (CTA dorado)

```css
background: C.accent; /* #FFC629 */
color: #000;
font-weight: 700;
font-size: 13px;
padding: 10px 20px;
border-radius: 10px;
border: none;
/* hover: box-shadow glow dorado + scale(1.02) */
```

### Boton Secundario (outline)

```css
background: transparent;
color: C.text;
border: 1.5px solid rgba(255,255,255,0.15);
border-radius: 10px;
padding: 10px 20px;
/* hover: border-color C.accentBorder, color C.accent */
```

### Boton Danger (rojo/rosa)

```css
background: rgba(255,122,89,0.12);
color: C.rose; /* #FF7A59 */
border: 1px solid rgba(255,122,89,0.28);
border-radius: 10px;
/* hover: background intensificado */
```

### Card de modulo

```css
background: P.cardBg; /* gradiente violeta */
border: 1.5px solid P.cardBorder;
border-radius: 18px;
/* hover: transform translateY(-3px), border mas brillante, sombra intensificada */
```

### Badge de estado

```css
/* Activo (verde) */
background: rgba(155,191,99,0.14);
color: #9BBF63;
border: 1px solid rgba(155,191,99,0.28);
padding: 4px 10px;
border-radius: 6px;
font-size: 10px;
font-weight: 800;

/* Categoria (purpura) */
background: rgba(167,139,250,0.14);
color: #A78BFA;
border: 1px solid rgba(167,139,250,0.28);
```

### Input de formulario

```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 9px;
color: C.text;
font-size: 14px;
padding: 11px 14px;
/* focus: border-color C.accent, box-shadow 0 0 0 3px C.accentFaint */
```

### Modal

```css
/* Backdrop */
background: rgba(0,0,0,0.65);
backdrop-filter: blur(6px);

/* Modal card */
background: linear-gradient(160deg, rgba(22,22,22,0.98), rgba(14,14,14,0.98));
border: 1px solid C.border;
border-radius: 20px;
max-width: 540px;
```

### Metric Card (header)

```css
background: P.metricBg; /* #0C0628 */
border: 1px solid P.metricBorder;
border-radius: 14px;
padding: 16px 20px;
```

### Metric Row (dentro de card)

```css
/* Contenedor flex con 2 celdas */
background: rgba(12,6,40,0.6);
border: 1px solid P.metricBorder;
border-radius: 10px;
padding: 10px 14px;
```

### Entitlement Pill

```css
background: P.purpleBg;
color: P.purple; /* #A78BFA */
border: 1px solid P.purpleBorder;
border-radius: 999px;
padding: 3px 10px;
font-size: 10px;
font-weight: 700;
```

### Feature Tag (gris)

```css
background: rgba(255,255,255,0.04);
color: C.textSec;
border: 1px solid rgba(255,255,255,0.06);
border-radius: 8px;
padding: 4px 10px;
font-size: 10px;
font-weight: 700;
```

---

## 11. Interacciones

| Aspecto          | Directriz                                               |
|------------------|---------------------------------------------------------|
| Transiciones     | `all 0.2s ease` para hover, `0.3s ease-out` navegacion |
| Hover en cards   | `transform: translateY(-3px)` + sombra intensificada   |
| Focus visible    | `outline: 2px solid rgba(255,198,41,0.7)` offset 2px   |
| Scrollbar        | 6px ancho, thumb dorado semitransparente                |
| Backdrop blur    | `blur(6px)` en modales, `blur(20px)` en barras         |
| Selection        | `background: rgba(255,198,41,0.28)`                     |
| Skeleton loading | Pulso entre `#0C0628` y `#18084A`                       |

---

## 12. Layout del CMS

### Sidebar
- Ancho: `264px`
- Breakpoint mobile: `< 1100px`
- 12 modulos de navegacion (ver CmsShell.tsx)
- Logo "LUKI NET" con badge de notificaciones
- Estado del sistema al final

### Header
- Sticky top
- Titulo de pagina con barra de 3px dorada a la izquierda
- Icono de notificaciones (bell)
- Avatar con dropdown: Perfil, Soporte, Cerrar sesion

### Contenido principal
- Padding: `28px` desktop, `18px` mobile
- Maximo ancho: sin limite (fluid)

---

## 13. Patron visual de modulo (referencia Categorias)

Cada modulo de gestion sigue esta estructura:

```
┌─────────────────────────────────────────────────────┐
│  H2 Titulo + descripcion        │ Metric │ Metric │
├─────────────────────────────────────────────────────┤
│  🎯 Banner "Proposito del modulo" (gradiente)       │
├─────────────────────────────────────────────────────┤
│  Item destacado: icono + nombre + tags + metricas   │
│  + CTA dorado "Ver contenido asociado"              │
├─────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │Card 1│ │Card 2│ │Card 3│ │Card 4│ │Card 5│       │
│ │──────│ │──────│ │──────│ │──────│ │──────│       │
│ │badges│ │badges│ │badges│ │badges│ │badges│       │
│ │desc  │ │desc  │ │desc  │ │desc  │ │desc  │       │
│ │metric│ │metric│ │metric│ │metric│ │metric│       │
│ │tags  │ │tags  │ │tags  │ │tags  │ │tags  │       │
│ │─CTA──│ │─CTA──│ │─CTA──│ │─CTA──│ │─CTA──│       │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────────────────────┘
```

### Estructura de una Card de modulo

1. **Header**: Badges de estado (verde ACTIVO + purpura tipo) + iconos de accion (editar, eliminar)
2. **Titulo**: Nombre bold + codigo (small muted)
3. **Descripcion**: Texto secondary
4. **Precio/Valor**: Numero grande en accent + unidad en muted
5. **Limites**: Iconos + texto (dispositivos, streams, perfiles)
6. **Calidad**: Badge (HD, FHD, 4K)
7. **Entitlements**: Pills purpura
8. **Metricas**: Row con COMPONENTES | CATEGORIAS
9. **Features**: Tags gris (casting, descargas, trial)
10. **Footer CTA**: Boton con gradiente dorado sutil + flecha

---

## 14. Resumen de decisiones

| Contexto              | Tema                | Acento     | Fondo base  |
|-----------------------|---------------------|------------|-------------|
| CMS autenticado       | LUKI NET Gold       | `#FFC629`  | `#060606`   |
| CMS auth (login)      | Nebula Dark         | `#7B5EF8`  | `#050B17`   |
| App mobile (frontend) | Nebula Dark         | `#7B5EF8`  | `#050B17`   |
| Modulos con override  | Purple Deep         | `#FFC629`  | `#08001a`   |
| Marca corporativa     | Manual LUKI         | `#FFB800`  | `#240046`   |
