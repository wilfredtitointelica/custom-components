# Intelica Components · guía para agentes de IA

Instrucciones para cualquier IA (Claude, Copilot, Cursor…) que replique o maquete un componente `int-*`
en este repo. Las reglas completas están en `.claude/skills/` (en especial `replicar-primeng/SKILL.md`
y `crear-componente/SKILL.md`); esto es lo mínimo para no salirse de ellas.

## Orden de prioridad de fuentes

1. **PrimeNG v20** (`node_modules/primeng`, `@primeuix/styles`, `@primeuix/themes`): API, estructura,
   comportamiento, teclado, ARIA y animaciones. Se lee, nunca se importa.
2. **Base de conocimientos** (`Intelica.knowledgeBase`, `Desarrollo/Estandares/Diseño/components/<nombre>.md`):
   solo los casos `.pr*` definen estilos, variantes y casos de uso. Se ignoran `.pt*`, `.ly*`, `.gr*`.
3. **Style Guide** (`Intelica.Style.Guide.New`): CSS de las clases `.pr*`, tokens `--i-*`, helpers `.u-*`.
4. **Figma**: solo referencia visual. No define variantes ni valores.

### Conceptos de la base de conocimientos que se corrigen

Algunos componentes de la base de conocimientos se armaron sobre un concepto equivocado. Al leerla, gana
el concepto de PrimeNG y cada caso se construye en el componente que le corresponde, aunque esté
documentado en otro archivo (reparto completo en `replicar-primeng/references/knowledge-base.md`, 1b):

| Caso de la base de conocimientos | Se construye en |
|---|---|
| `badge.md`: valor numérico / contador, `p-overlaybadge` sobre botón o icono (un badge **indica una cantidad**, como en PrimeNG) | `int-badge` |
| `badge.md`: etiqueta de estado con texto (+ icono): severidades, Caution (`prBadge--yellow`), Disabled, badge en celda de tabla | `int-tag` |
| `badge.md` "con X" y `pills.md` (`.prPillTag`, filtro aplicado) | `int-chip` (`removable`) |

## Estructura de un componente

```
src/components/<id>/version-N/
  base/<id>.ts       clase Int<Id>, selector int-<id>; primeras líneas: static status y static designer
  base/<id>.html     cabecera <!-- title / description / figma --> + marcado BEM
  styles/_index.scss solo @use
  styles/_<id>.scss  TOKENS (:root) · BLOCK · ELEMENTS · MODIFIERS · SKELETON
  styles/_<id>.<grupo>.scss  un módulo por grupo de modificadores
  variants/<slug>/example.ts + example.html       (variants/basic/ siempre) → tab Variants
  compositions/<slug>/example.ts + example.html   (opcional) → tab Compositions
```

- Sin `.component.ts`, sin `.css`, sin `variants/default/`. Variantes nuevas: `npm run new:variant`
  (skill `crear-variante`); composiciones: `npm run new:composition` (skill `crear-composicion`).
  Pasar un ejemplo de una carpeta a la otra (conserva slug y URL): `npm run move -- <id> <slug> --to composition|variant`.
- **Variant o Composition.** Una variante (`variants/`) muestra **un** input, estado o slot de la API con
  contenido mínimo. Una composición (`compositions/`) es un caso real de la base de conocimientos (KPI,
  selector de versión, fila de métricas) armado con la API que ya existe + helpers `u-*`: **no agrega API**.
  La base de conocimientos documenta PrimeNG + combinaciones de su API, así que **cada caso suyo es por
  defecto una composición**. Solo es **candidato a propiedad** (input + una variante) si cambia el
  contenedor, ningún input existente lo logra y es reutilizable; si lo que cambia es el contenido, es una composición (p. ej.
  `int-card` no tiene `appearance="data"`: el KPI es `<int-card flat>` + helpers). Un slug es único entre
  las dos carpetas (es el ancla `#<id>-<slug>`).
- Angular 20: Signals, `OnPush`, control flow `@if`/`@for`, nombres de inputs/outputs **iguales a PrimeNG**.
  Los outputs de extensión también van con `onX` (`onSelect`), nunca con el nombre de un evento nativo
  del DOM (`select`, `click`, `change`…): `(select)` escucharía también el evento nativo.
- Formatos visuales del contenedor que se excluyen entre sí van en **un** input tipado (`appearance`,
  o el nombre de PrimeNG: `severity`, `variant`, `size`), no en un booleano por formato
  (`<int-tag success>`). Booleanos solo para lo que se suma (`compact`, `outlined`, `flat`).
- Cada input, output, método público y template (`contentChild('nombre')`) lleva JSDoc `/** … */`
  **en español** (es la columna Descripción de la pestaña API); lo que no existe en PrimeNG empieza por
  `int-* extension:` (marca fija, en inglés). El resto de comentarios del código sigue en inglés. La pestaña **API** de la página se genera de ese
  JSDoc y del `:root` de `styles/_<id>.scss` (`scripts/extract-api.mjs`).
- En el JSDoc y en las descripciones de variantes y composiciones, los nombres de la API (inputs, outputs, templates, valores, clases) van **entre comillas invertidas**, como los escribe PrimeNG: "Se personaliza con los templates `header`, `title` y `footer`"; la página los muestra como código. Los templates se nombran sin `#` (`header`, no `#header`).
- El título de una variante dice lo que muestra: como en PrimeNG, salvo que su nombre no lo diga
  (la sección "Advanced" de card muestra los templates → "Template").
- Nada de `primeng`, `@primeuix`, `@angular/animations`, `any`, `::ng-deep`, clases `p-*` ni clases del
  Style Guide (`.prX`, `.ptX`, `.lyX`, `.grX`, `row`, `col-*`).

## Estilos y tokens

- Cada valor es un token del componente que apunta a uno del Style Guide, con su origen comentado:
  ```scss
  --int-chip-gap: var(--i-spacing-gap-xs); // knowledgeBase: --i-spacing-gap-xs · Figma: 4px (spacing/gap/xs) · Aura: 0.5rem
  ```
- Sin literales (`#hex`, `px`, `0.2s`). Duraciones con `--i-motion-*`, `prefers-reduced-motion` si hay
  animación, foco con `:focus-visible`.
- Contenido dentro de los templates de las variantes y composiciones: helpers `.u-*`, nunca `style` inline. Única
  excepción: el tamaño del propio componente, como PrimeNG: `<int-card [style]="{ width: '25rem' }">`
  (sin crear inputs `width`/`height` en la base para eso).
- La etiqueta `<int-*>` no lleva helpers `u-*`: su lugar en el layout del padre va en un `<div>`
  envoltorio (`<div class="u-display-flex u-flex-grow-1 u-flex-basis-0"><int-card …>`), que el
  componente llena (`.int-<id>:only-child { flex-grow: 1 }`).
- El bloque no recorta: sin `overflow` en `.int-<id>` ni `u-overflow-*` sobre un `<int-*>` (cortaría
  selects, datepickers, popovers abiertos dentro). Si hace falta recortar, va en el `__elemento` dentro
  del SCSS del componente (p. ej. `.int-card__header { overflow: hidden }`).
- Sin rastros de PrimeNG en lo visible: nada de imágenes, logos o URLs de `primefaces.org`. Una imagen de
  ejemplo es un placeholder con fondo del Style Guide (`u-background-surface` + icono `icon icon-image`).
- Iconos del Style Guide (`icon icon-*` + `icon--xs…xl`); `pi pi-*` solo si no hay equivalente, y nunca
  las dos familias en el mismo componente.
- Atributos del `<int-*>` siempre en el mismo orden: formato (`appearance`, `compact`, `flat`…), contenido
  (`header`…), estado (`selectable`, `[selected]`, `[disabled]`), `[style]`, eventos.
- Una regla que comparten varios modificadores va una sola vez (en el modificador común o el bloque),
  no repetida en cada `_<id>.<grupo>.scss`.
- Un componente que se vuelve botón (`selectable`, `role="button"`) no contiene botones, links ni inputs.
- Estado y accesibilidad viven en el componente: si falta un estado (p. ej. `disabled` en card), se
  agrega como input y la base resuelve `tabindex`, `role`, `aria-*` y teclado. Las variantes no ponen
  `[attr.aria-*]`, `[attr.tabindex]`, `role` ni `(keydown.*)` sobre un `<int-*>`.
- Todo `disabled` no se puede seleccionar ni activar: `cursor: not-allowed` y `user-select: none`, sin
  hover ni active, y la base ignora clic y teclado en el handler. Nunca `pointer-events: none`
  (ocultaría el cursor `not-allowed`).
- Las adaptaciones de comportamiento que documenta la base de conocimientos (opción *All* fija en un
  select, iconos de orden propios en una tabla…) se implementan nativas como extensión
  `/** int-* extension */`; no se vuelve al comportamiento de PrimeNG.

## Dependencias entre componentes

Si el componente usa otro `int-*` que aún no está en `done`, se deja un provisional marcado y se declara
en `requires` (lo usa la base) o `uses` (solo una variante) de `<id>.config.ts`:

```html
<!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
<input type="checkbox" class="int-multi-select__checkbox" data-dep="checkbox" />
<!-- /dep:checkbox -->
```

Un overlay (tooltip, popover) que aún no está en `done` también se maqueta visible y funcionando como lo
muestra la base de conocimientos, con `data-dep` para el Scan (nunca solo el icono): ver
`replicar-primeng` 1.6, "Overlays provisionales".

## Antes de subir

```bash
npm run check:component -- <id>   # 0 errores
npm run build
```

Si el trabajo se hizo fuera del repo y no pasa el check, en Claude Code se alinea con `/estandarizar-componente <id>`.
