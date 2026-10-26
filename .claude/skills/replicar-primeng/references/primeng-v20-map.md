# Mapa de PrimeNG v20 en `node_modules`

Verificado con `primeng@20.4.0`, `@primeuix/styles@1.2.5` y `@primeuix/themes` (preset Aura, el que
registra `src/app/app.config.ts`). Si la versión cambia, comprobar las rutas con `ls` antes de usarlas.

## 1. Dónde está cada pieza

`<n>` = nombre del paquete en minúsculas, sin guiones: `chip`, `select`, `inputtext`, `datepicker`,
`toggleswitch`, `dialog`.

| Pieza | Ruta | Qué buscar |
|---|---|---|
| Componente compilado | `primeng/fesm2022/primeng-<n>.mjs` | `const classes`, `inlineStyles`, clase del componente, handlers, `ɵcmp` |
| API tipada + JSDoc | `primeng/<n>/index.d.ts` | inputs con `@defaultValue`, `@group Props / Emits / Templates`, `@deprecated` |
| Tipos públicos | `primeng/types/<n>/index.d.ts` | interfaces de eventos, contextos de templates, `PassThrough` (se ignora) |
| CSS real | `@primeuix/styles/dist/<n>/index.mjs` | string `style` con reglas `.p-<n>…` y `dt('<n>.…')` |
| CSS común | `@primeuix/styles/dist/base/index.mjs` | `.p-disabled` (`opacity: dt('disabled.opacity')`, `pointer-events: none`), `.pi` (`icon.size`), máscaras y animaciones de overlay |
| Tokens del componente (Aura) | `@primeuix/themes/dist/aura/<n>/index.mjs` | `root`, `icon`, `colorScheme.light/dark`… con referencias `{surface.100}` |
| Primitivos y semánticos (Aura) | `@primeuix/themes/dist/aura/base/index.mjs` | paletas (`slate`, `emerald`…), `borderRadius`, `semantic.primary`, `focusRing`, `disabled.opacity`, `transition.duration`, `formField.*` |
| Clases base | `primeng/fesm2022/primeng-basecomponent.mjs`, `primeng-baseinput.mjs`, `primeng-baseeditableholder.mjs`, `primeng-basemodelholder.mjs` | qué hereda: CVA, `disabled`, `invalid`, `fluid`, `size`, `variant` |
| Utilidades DOM | `@primeuix/utils` (importado como `DomHandler`, `focus`, `find`…) | se reemplazan por API del DOM o CDK |
| Iconos | `primeng/fesm2022/primeng-icons.mjs` | `TimesCircleIcon`, `ChevronDownIcon`… → `pi pi-*` o el `path` SVG en línea |
| Overlays | `primeng/fesm2022/primeng-overlay.mjs`, `ConnectedOverlayScrollHandler` | → `@angular/cdk/overlay` |

Extraer el CSS legible (el string está escapado):

```bash
node -e "const s=require('fs').readFileSync('node_modules/@primeuix/styles/dist/<n>/index.mjs','utf8');console.log(eval(s.match(/var style=(\"[\s\S]*?\");/)[1]))"
```

Si el archivo no usa `var style=` (cambia entre versiones), abrirlo con `Read` y buscar las reglas `.p-<n>`.

## 2. Cómo leer el componente compilado

1. **`ɵcmp`** (una línea larga): `selector`, `inputs` (`["disabled","disabled",booleanAttribute]` =
   input con `transform`), `outputs`, `host` (clases, `aria-*`, `style.display` en el host), `queries`
   (`predicate: ["removeicon"]` = template por referencia `#removeicon`), `hostDirectives`, `template`.
2. **`const classes`**: estructura de elementos y estados → BEM.
   `root: ({instance}) => ['p-chip', {'p-disabled': instance.disabled}]` →
   bloque `.int-chip` + modificador `.int-chip--disabled`.
3. **`inlineStyles`** (si existe): estilos calculados en runtime → `computed` + binding `[style.x]`.
4. **Plantilla inline**: orden de elementos, `*ngIf` (→ `@if`), `ng-template` de reserva (`else`),
   `[attr.tabindex]`, `role`, `aria-*`, `(keydown)`.
5. **Handlers** (`close`, `onKeydown`, `onInputFocus`…): copiar la lógica, no la forma. Teclas exactas.
6. **`onAfterContentInit` con `templates.forEach(... getType())`**: mecanismo `pTemplate`. Solo se
   replica la vía por referencia (`#nombre`) con `contentChild`.
7. **`config.getTranslation(TranslationKeys.ARIA)[…]`**: textos ARIA globales de PrimeNG. Sin
   configuración global en `int-*`: usar el texto por defecto en inglés del locale de PrimeNG
   (`primeng/fesm2022/primeng-config.mjs`, objeto `aria`, p. ej. `removeLabel: 'Remove'`) y exponerlo
   como input opcional marcado `int-* extension` si hace falta cambiarlo.
8. **`pt`, `ptm()`, `ptms()`, `pBind`, `$pc…`, `_componentStyle`, `unstyled`, `dt`**: infraestructura de
   PassThrough y theming de PrimeNG. Se ignora (va a "Diferencias").
9. **`@deprecated`**: no se replica salvo que siga siendo la única forma de hacer algo.

## 3. Traducción de tokens `dt('…')` → `--int-<id>-*` → `--i-*`

1. Lista cada `dt('<n>.<ruta>')` del CSS del componente. `dt('chip.padding.x')` → token
   `--int-chip-padding-x`.
2. Resuelve su valor en `aura/<n>/index.mjs` (y `colorScheme.light`; dark no aplica salvo que el
   proyecto lo pida). Si es una referencia (`{surface.100}`, `{focus.ring.color}`), resuélvela en
   `aura/base/index.mjs` hasta llegar a un literal.
3. Busca el `--i-*` equivalente en el Style Guide (fuente:
   `C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css/tokens/_tokens.*.scss`,
   o en la app con el diálogo "Style Guide" de la barra superior). Orden de preferencia:
   1. Token de componente del Style Guide si existe (`--i-badge-*`, `--i-button-*`, `--i-form-field-*`).
   2. Token semántico (`--i-text-color-*`, `--i-icon-color-*`, `--i-background-*`, `--i-focus-*`).
   3. **Alias con escala xs · sm · md · lg · xl** (preferidos sobre la escala numérica):
      `--i-spacing-gap-*` (separación entre elementos), `--i-spacing-container-*` (padding interno),
      `--i-sizing-*`, `--i-border-radius-*`, `--i-border-width-*`, `--i-typography-font-size-*`,
      `--i-icon-size-*`, `--i-shadow-*-*`.
   4. Escala numérica (`--i-spacing-150`, `--i-sizing-200`, `--i-color-grey-100`…) solo cuando no hay
      alias con ese valor (colores de paleta, valores fuera de xs–xl).
   5. Sin equivalente exacto: el `--i-*` más cercano, anotando la diferencia.
   6. Sin ningún token de esa categoría: **no** se pone un literal; se pregunta al usuario.
4. Declara en TOKENS (`:root` de `_<id>.scss`) siempre como alias: `--int-<id>-<parte>: var(--i-…);`
   con `// Aura: <valor>` como comentario. Los valores vienen **solo** del Style Guide.
5. En las reglas usa solo `var(--int-<id>-…)`.

Equivalencias frecuentes (Aura → `--i-*`, por valor; confirmar que el token existe):

| Aura | Valor | `--i-*` (alias primero) |
|---|---|---|
| gap `0.25rem` / `0.5rem` / `0.75rem` / `1rem` | 4 / 8 / 12 / 16 px | `--i-spacing-gap-xs` / `-sm` / `-md` / `-lg` |
| padding `0.25rem` / `0.5rem` / `0.75rem` / `1rem` | 4 / 8 / 12 / 16 px | `--i-spacing-container-xs` / `-md` / `-lg` / `-xl` (6px = `-sm`) |
| `borderRadius.xs` / `sm` / `md` / `lg` / `xl` | 2 / 4 / 6 / 8 / 12 px | `--i-border-radius-xs` / `-sm` / `-md` / `-lg` / `-xl` |
| `16px` (chip) / `50%` / pill | — | `--i-border-radius-200` (sin alias) / `50%` literal / `--i-border-radius-full` |
| `1rem` icono · `2rem` imagen | 16 / 32 px | `--i-sizing-xs` / `--i-sizing-lg` |
| `{surface.100}` · `{surface.800}` | `#f1f5f9` · `#1e293b` | `--i-color-grey-100` · `--i-color-grey-800` (gris de marca, no idéntico) |
| `focus.ring.width` / `offset` | 1px / 2px | `--i-border-width-10` / `--i-spacing-25` |
| `focus.ring.color` (`{primary.color}`) | emerald 500 | `--i-focus-border-color` o `--i-color-primary-600` |
| `disabled.opacity` | `0.6` | `--i-opacity-semi` (0.5, el más cercano; anotar diferencia) |
| `transition.duration` | `0.2s` | `--i-motion-duration-fast` (150ms) · curva: `--i-motion-ease-in-out` |
| font-size base | 1rem (16px) | `--i-typography-font-size-200` (el Style Guide usa 14px en controles: `-150`; decidir según el componente equivalente) |

Diferencia esperada: el primario de Aura es **emerald** y el del Style Guide es **azul**; los grises de
Aura son `slate`/`zinc` y los del Style Guide `grey` de marca. Usar los del Style Guide y anotarlo en
"Diferencias": la réplica es fiel en estructura, medidas y estados, y adopta la paleta del proyecto.

## 4. Dependencias habituales y su reemplazo

| PrimeNG | Reemplazo en `int-*` |
|---|---|
| `BaseComponent`, `BaseStyle`, `PARENT_INSTANCE` | nada (estilos por SCSS, sin inyección de estilos) |
| `BaseInput` / `BaseEditableHolder` / `BaseModelHolder` | `ControlValueAccessor` propio + `model()`/`input()` |
| `PrimeTemplate`, `SharedModule` | `contentChild('<ref>')` + `NgTemplateOutlet` |
| `Bind` / `pBind` / `pt` | nada |
| `primeng/icons` | `primeicons` (`pi pi-times-circle`) o SVG en línea |
| `DomHandler`, `@primeuix/utils` | API del DOM; `@angular/cdk/a11y` (`FocusTrap`, `FocusMonitor`, `LiveAnnouncer`) |
| `Overlay`, `ConnectedOverlayScrollHandler`, `ZIndexUtils` | `@angular/cdk/overlay` (`CdkConnectedOverlay`) |
| `Scroller` (virtual scroll) | `@angular/cdk/scrolling` |
| `Ripple` (`pRipple`) | omitir (Aura lo desactiva por defecto) o extensión CSS documentada |
| `@angular/animations` (`trigger`) | transiciones CSS o `animate.enter` / `animate.leave` |
| `PrimeNG.getTranslation` / `TranslationKeys` | textos por defecto + input opcional de extensión |
| `uuid('pn_id_')` | contador propio en el módulo (`let nextId = 0`) o `inject(_IdGenerator)` de CDK |
