# Clases helper del Style Guide para el contenido de los templates

Los tokens `--i-*` (SKILL.md 3.3) resuelven el **componente**: lo que vive en la base y su SCSS. Pero
muchos componentes reciben **contenido del consumidor** dentro de sus templates: el `#item` de un
`int-select`, el `#header`/`#footer` de un `int-dialog`, el cuerpo proyectado con `<ng-content>` de una
card, el `#content` de un tooltip… Ese contenido se maqueta en el `example.html` de la variante, que **no
tiene SCSS propio**. Para acercarlo al diseño de Figma se usan las **clases helper** del Style Guide
(`.u-*`), las mismas que usan las vistas de los proyectos Intelica.

## 1. Dónde se usan (y dónde no)

| Lugar | Helpers `.u-*` | Por qué |
|---|---|---|
| Contenido dentro de un template proyectable de la variante (`<ng-template #item>…</ng-template>`, `#header`, `#footer`, `#empty`…) | ✅ | Es marcado del consumidor: así lo escribiría una vista real |
| Contenido proyectado con `<ng-content>` en la variante (cuerpo de dialog/card/panel) | ✅ | Igual que arriba |
| Contenedor de la variante para mostrar varias instancias o grupos (fila de severidades, grupo con fondo + grupo sin fondo) | ✅ solo layout: `u-display-flex u-flex-column u-gap-xl` entre grupos, `u-gap-lg`/`u-gap-xl` + `u-flex-wrap` en cada fila, `u-full-width` y `u-px-*` para alinear bordes entre grupos | Sustituye a estilos inline; sin él los grupos quedan pegados o centrados a medio ancho |
| Variante con varios formatos o combinaciones (data card, group, chart…) | ✅ un bloque por formato: título arriba (`<p class="u-m-0 u-text-md u-bold">`) y la muestra debajo (`u-flex-column u-gap-md`), separados por `<div class="u-divider-horizontal u-my-0" aria-hidden="true">`. Pocas instancias por muestra (2–3), con `u-text-nowrap` en textos cortos | Nunca `<table>` para maquetar la variante |
| Estados visuales del contenido u otra cosa no estructural sin helper | ❌ → modificador `_<id>.<grupo>.scss` con tokens (1b) | Los helpers no expresan estados |
| `base/<id>.html` (estructura del propio componente) | ❌ | La base usa BEM `int-<id>__*` + `--int-*` → `--i-*`; se extrae a npm y no puede depender de helpers |
| `styles/*.scss` | ❌ | Ahí se escriben reglas con tokens, no clases helper |

Fuente de verdad del catálogo (cargado por el bundle del Style Guide, botón **STYLEGUIDES**,
`localhost:8080`, igual que los tokens):

```bash
grep -oE "^\s*\.u-[a-zA-Z0-9_-]+" C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css/utilities/_helpers.scss
```

Documentación con tablas: skill `angular-designer`, `references/utilities.md`.

> 🔒 **Del Style Guide solo se usan TOKENS y HELPERS.** Tokens `--i-*` en el SCSS (vía
> `--int-<id>-*`) y clases helper `.u-*` en el marcado. Ninguna otra clase del Style Guide, en ningún
> archivo: nada de `.prCard`, `.prButton`, `.pt*`, `.ly*`, `.gr*`, clases de proyectos ni `row` /
> `col-*` de bootstrap-grid. Tampoco se copia su CSS.

## 1b. Helpers o modificador

Para cada capa del contenido de un template en una variante:

1. **Estructura** (flex, dirección, gap, padding, margin, alineación, tamaño, overflow) → helpers `.u-*`.
   `u-overflow-*` solo sobre el contenido del template, **nunca sobre el `<int-*>`**: recortaría los
   overlays (select, datepicker, popover) abiertos dentro. Si el componente necesita recortar (imagen
   del header de una card), lo hace su SCSS en el `__elemento` (`&__header { overflow: hidden }`).
2. **Visual estático** con helper exacto del mismo token (`u-text-*`, `u-bold`, `u-color-*`,
   `u-radius-*`, `u-shadow-*`, bordes `u-b*-*`) → helpers `.u-*`.
3. **Estados visuales** (hover, active, focus, seleccionado, disabled) **u otra cosa que no sea
   estructura y ningún helper cubre** → modificador propio `.int-<id>--<grupo>` con elementos
   `&__<elem>` en `styles/_<id>.<grupo>.scss` (+ `@use` en `_index.scss`), escrito solo con
   `var(--int-<id>-*)` → `var(--i-*)`. El modificador lleva **solo eso**; la estructura sigue en helpers.

Ejemplo, card de datos:

```html
<int-card class="int-card--data">
  <div class="u-display-flex u-flex-column u-gap-xs">
    <div class="int-card__metric u-display-flex u-align-items-center u-gap-xs u-px-1">
      <span class="u-text-sm u-color-body">Total fees</span>
    </div>
    <div class="u-display-flex u-justify-content-center u-gap-xs">
      <span class="u-heading-2xl">1,250</span>
    </div>
  </div>
</int-card>
```

```scss
// _card.data.scss · only what helpers cannot express: the hover state of the metric row
.int-card--data .int-card__metric:hover {
  background-color: var(--int-card-data-metric-hover-background);
}
```

## 2. Catálogo resumido

| Necesidad en Figma | Helper |
|---|---|
| Auto layout horizontal / vertical | `u-display-flex` (+ `u-flex-column`), `u-display-inline-flex`, `u-flex-wrap` |
| Gap del auto layout | `u-gap-{none,xs,sm,md,lg,xl,2xl}`; por eje `u-gap-{sm..2xl}-x` / `-y` |
| Alineación | `u-justify-content-{center,left,right,end,between,around,evenly}`, `u-align-items-{center,baseline}`, `u-align-self-stretch` |
| Crecer / ocupar ancho | `u-flex-grow-1`, `u-flex-grow-0`, `u-flex-basis-0`, `u-full-width`, `u-full-height`, `u-auto-width`, `u-min-content` |
| Padding / margin | `u-{p,px,py,pt,pb,ps,pe}-{0..5}`, `u-{m,mx,my,mt,mb,ms,me}-{0..5,auto}` · escala `--i-spacing-container-*`: 1=xs 4px, 2=sm 6px, 3=md 8px, 4=lg 12px, 5=xl 16px |
| Tamaño de texto | `u-text-{2xs,xs,sm,md,lg,xl,2xl..5xl}` (size + line-height), `u-text-lineHeight-*` |
| Títulos | `u-heading-{xl,2xl..6xl}` |
| Peso | `u-bold`, `u-normal`, `u-light` |
| Comportamiento de texto | `u-text-ellipsis`, `u-text-nowrap`, `u-text-preline`, `u-text-breakWord`, `u-text-breakAll`, `u-text-{left,center,right}` |
| Color de texto | `u-color-{primary,secondary,neutral,surface,info,error,success,warning,body,white}`, `u-color-grey-500`, `u-color-teal-500`, `u-color-product-{a..e}`, `u-color-trend-{positive,negative,neutral}` |
| Fondo | `u-background-{white,surface}` |
| Bordes / separadores | `u-bs-*`, `u-be-*`, `u-bt-*`, `u-bm-*`, `u-divider-{horizontal,vertical}` |
| Radio / sombra | `u-radius-{none,xs,sm,md,lg,xl}`, `u-shadow-{none,xs..xl}` |
| Otros | `u-overflow-*`, `u-relative`/`u-absolute`, `u-dot`, `u-pointer`, `u-text-link`, `u-hyperlink`, `u-panel`, `u-hide-empty` |

Si el catálogo de `_helpers.scss` cambió, manda el archivo, no esta tabla.

## 3. Cómo traducir el contenido de Figma

Con link de Figma (SKILL.md 1.5), al recorrer el frame identifica las capas que **no son del
componente** sino contenido de un template (la fila de una opción con avatar + nombre + email, el cuerpo
de un dialog, el pie con botones). Para cada una:

1. Lee con `get_design_context` su auto layout (dirección, gap, padding, alineación), tipografía y color.
2. Traduce cada propiedad a un helper con el **mismo token** (Figma `spacing/gap/sm` → `u-gap-sm`;
   padding 12px → `u-p-4`; texto `body/sm` → `u-text-sm`; `color/error/700` → `u-color-error`).
3. Muestra en el chat la **tabla de contenido**, junto a la tabla visual:

| Template / capa | Propiedad | Figma (valor · variable) | Destino |
|---|---|---|---|
| `#item` fila | auto layout horizontal, centrado | — | helper `u-display-flex u-align-items-center` |
| `#item` fila | gap | 8px · `spacing/gap/sm` | helper `u-gap-sm` |
| `#item` email | font-size | 12px · `body/xs` | helper `u-text-xs` |
| `#item` email | color | #6B7280 · `color/grey/500` | helper `u-color-grey-500` |
| `#item` fila :hover | background | #F2F2F5 · `color/grey/100` | modificador `--int-<id>-<grupo>-item-hover-background` → `--i-color-grey-100` |

Orden de preferencia:

1. **Componente `int-*` en `done`** si el contenido es otro componente (botón, chip, avatar): se usa el
   componente, no se imita con helpers. Si no está en `done`, el marcado nativo mínimo + helpers entre
   `<!-- dep:<id> provisional · replace with <int-<id>> when <id> is done -->` y `<!-- /dep:<id> -->`, con
   `data-dep="<id>"` en su elemento raíz (lo resalta el botón Scan dependencies de la página), y
   el id en `uses` del config (SKILL.md 1.6) para que `/resolver-dependencias` lo reemplace.
2. **Helper exacto** (mismo token) para estructura y visual estático.
3. **Estructura sin helper exacto**: el helper más cercano de la misma escala; la diferencia va a
   "Diferencias" del informe.
4. **Estado visual u otra cosa no estructural sin helper**: modificador `_<id>.<grupo>.scss` con
   tokens (1b). Nunca CSS literal ni clases del Style Guide distintas de `.u-*`.

Sin link de Figma, el contenido de los templates replica el de la demo de PrimeNG v20 traducido a
helpers (sus clases `flex items-center gap-2` de PrimeFlex/Tailwind → `u-display-flex
u-align-items-center u-gap-sm`).

## 4. Prohibido en el contenido de los templates

- `style="…"` / `[style.*]` con valores de diseño, `<style>` en la variante o SCSS dentro de la carpeta
  de la variante (lo no estructural va al modificador del componente en `styles/`, 1b).
- Clases de Tailwind/PrimeFlex (`flex`, `gap-2`, `text-sm`) que trae la demo de PrimeNG o el código de
  `get_design_context`.
- Clases `.doc-*`, `p-*` o BEM del componente (`int-<id>__*`) para maquetar contenido del consumidor.
- Inventar clases `u-*` que no existen en `_helpers.scss`.
- Cualquier clase del Style Guide que no sea `.u-*`: `.prCard`, `.prButton`, `.pt*`, `.ly*`, `.gr*`,
  clases de proyectos, `row` / `col-*`; ni copiar su CSS a un modificador.
- Modificadores con reglas de estructura (`display: flex`, `gap`, `padding`, `justify-content`…) que
  resuelve un helper: el modificador solo lleva estados u otra cosa no estructural (1b).
