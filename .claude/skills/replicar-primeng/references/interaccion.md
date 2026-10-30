# Interacción: animaciones y teclado

Detalle de SKILL.md 3.6 (animaciones y transiciones) y 3.7 (accesibilidad por teclado). Lo que se
replica sale siempre del código de PrimeNG v20; los valores, de tokens `--i-*`.

## 1. Animaciones y transiciones

### 1.1 Dónde las define PrimeNG

| Efecto | Dónde leerlo | Componentes típicos |
|---|---|---|
| Overlay conectado (fade + `scaleY(0.8)` al entrar, fade al salir) | `@primeuix/styles/dist/base/index.mjs` (`.p-connected-overlay-*`) y el `animation(…)`/`trigger(…)` de `primeng-<nombre>.mjs` | select, multiselect, autocomplete, datepicker, cascadeselect, treeselect, popover, tieredmenu |
| Modal (fade + escala) y máscara | `primeng-dialog.mjs` (`trigger('animation'…)`), `.p-overlay-mask-enter/leave` en base | dialog, confirmdialog, drawer |
| Contenido plegable (`max-height`) | `.p-toggleable-content-*` en base, `trigger(…)` del componente | accordion, panel, panelmenu, fieldset |
| Fade de mensajes | `primeng-toast.mjs`, `primeng-message.mjs`, `primeng-tooltip.mjs` | toast, message, tooltip |
| Ripple | `@primeuix/styles/dist/ripple/index.mjs` (`.p-ink`, `@keyframes ripple`, 0.4s) + `pRipple` en la plantilla | button, select, multiselect, listbox, tabs, menu, tieredmenu, menubar, megamenu, paginator, splitbutton, tree, treetable, picklist, orderlist, datepicker… (`grep -l pRipple node_modules/primeng/fesm2022/*.mjs`) |

No se asumen valores: se leen duración, curva, propiedades animadas y estados `void`/`visible` del
archivo real y se anotan en el inventario (fila "Animación").

### 1.2 Cómo se escriben en `int-*`

- **Entrada/salida de elementos** (overlay, modal, toast, mensaje): `animate.enter="<clase>"` y
  `animate.leave="<clase>"` (Angular 20.2+) sobre el elemento que aparece, con clases BEM
  `.int-<id>__<elem>--enter` / `--leave` en el módulo base. Nada de `@angular/animations`.
- **Cambios de estado** (hover, checked, expandido): `transition` en la regla, con propiedades
  concretas (nunca `transition: all`).
- **Duraciones y curvas siempre por token**:
  ```scss
  --int-select-overlay-duration: var(--i-motion-duration-fast); // Aura: 0.12s
  --int-select-overlay-easing: var(--i-motion-ease-out);         // Aura: cubic-bezier(0, 0, 0.2, 1)
  ```
  Tokens disponibles: `--i-motion-duration-{fast,base,slow}`, `--i-motion-ease-{in,out,in-out,equal}`.
- **Excepción a "sin literales"**: los valores de forma de la animación que no son tokens de diseño
  (`opacity: 0`/`1`, `scale(0.8)`, `scaleY(0.8)`, `scale(2.5)` del ripple) se escriben en el
  `@keyframes` o en el estado inicial, con `// Aura: …` al lado. Nunca en un `--int-*`.
- **Overlay con CDK**: `animate.leave` se ejecuta si el elemento sale de la plantilla. Si el
  `cdkConnectedOverlay` se desacopla antes, mantener un estado `closing` (signal) y cerrar el overlay
  en `animationend`/`transitionend`. Comprobar en el navegador que la salida se ve.
- **Movimiento reducido** (obligatorio si el componente anima algo):
  ```scss
  @media (prefers-reduced-motion: reduce) {
    .int-<id>, .int-<id> * { transition-duration: 0s; animation-duration: 0s; }
  }
  ```
  El ripple, además, no se crea.

### 1.3 Ripple (solo si es compatible)

Compatible = la plantilla de PrimeNG v20 del componente usa `pRipple`. Si no lo usa, no se agrega.

- PrimeNG lo controla de forma global (`providePrimeNG({ ripple })`, apagado en Aura). Como `int-*` no
  tiene esa configuración, se expone en el componente:
  ```ts
  /** int-* extension: ripple on pointer press. PrimeNG enables it globally with providePrimeNG({ ripple }). */
  readonly ripple = input(true, { transform: booleanAttribute });
  ```
  Default `true`, salvo que la base de conocimientos (Intelica.knowledgeBase) indique lo contrario.
- Marcado: en el mismo elemento donde PrimeNG pone `pRipple` (botón, opción, pestaña), un
  `<span class="int-<id>__ink" aria-hidden="true">` creado en `pointerdown` (no con teclado ni si el
  elemento está deshabilitado), posicionado en el punto de contacto, con diámetro = lado mayor del
  elemento. Se elimina en `animationend`. El elemento lleva `position: relative; overflow: hidden`.
- Estilos: `.int-<id>__ink` (forma, `transform: scale(0)`, `pointer-events: none`) y
  `.int-<id>__ink--active` con `@keyframes int-<id>-ripple` (`scale(2.5)`, `opacity: 0`).
  Color por token: `--int-<id>-ripple-background: var(--i-…)` (Aura: `ripple.background`).
- Sin listeners si `ripple()` es `false`; los listeners manuales se limpian con `DestroyRef`.
- No va en `core/` ni se comparte entre componentes (la base se extrae a npm sola): cada componente
  lleva su ripple mínimo.

## 2. Accesibilidad por teclado

### 2.1 Inventario de teclado (fase 1)

Leer **línea a línea** los handlers de PrimeNG (`onKeyDown`, `onArrowDownKey`, `onEnterKey`,
`onEscapeKey`, `onTabKey`, `onHomeKey`, `onEndKey`, `onPageUpKey`, `onSpaceKey`, `searchOptions`…) y
escribir la tabla en el chat junto al inventario de la API:

| Elemento | Tecla | Acción | Foco después | Método de PrimeNG |
|---|---|---|---|---|
| trigger | `ArrowDown` | abre el overlay y enfoca la opción seleccionada o la primera | trigger (`aria-activedescendant`) | `onArrowDownKey` |
| opción | `Enter` / `Space` | selecciona y cierra | trigger | `onEnterKey` |
| overlay | `Escape` | cierra sin cambiar el valor | trigger | `onEscapeKey` |
| overlay | `Tab` | selecciona la enfocada y deja salir el foco | siguiente elemento | `onTabKey` |

Cada fila se implementa igual (misma tecla, misma condición, mismo `preventDefault`).

### 2.2 Reglas

- **Tab stops**: un solo tab stop por widget compuesto (listbox, menu, tabs, tree, radiogroup,
  paginator). Usar el mismo modelo que PrimeNG: `aria-activedescendant` (select, multiselect, listbox,
  autocomplete) o *roving tabindex* (`tabindex="0"` en el activo, `-1` en el resto: tabs, tree, menu).
- **Elementos nativos primero**: `<button type="button">`, `<input>`; si PrimeNG usa un `<span>`/`<div>`
  con `role`, se mantiene su rol, `tabindex` y teclas (Enter **y** Space para `role="button"`).
- **Deshabilitado**: `tabindex="-1"` (o `disabled` nativo), `aria-disabled="true"`, sin handlers activos.
- **Gestión de foco**:
  - Al cerrar un overlay con teclado o selección, el foco vuelve al trigger.
  - Modales: `cdkTrapFocus` + `cdkTrapFocusAutoCapture` (`@angular/cdk/a11y`), foco inicial como
    PrimeNG (`focusOnShow`, primer elemento enfocable o el botón de cerrar) y restaurado al cerrar.
    `Escape` cierra si `closeOnEscape`.
  - Foco programático con `FocusMonitor`/`element.focus({ preventScroll: true })` dentro de un
    `afterNextRender` o `effect()` (sincroniza con el DOM; nunca `setTimeout` arbitrario).
- **Búsqueda por tecleo** (*typeahead*): si PrimeNG la tiene (`searchValue` + timeout en select,
  listbox, tree), se replica con el mismo intervalo.
- **Scroll del activo**: la opción enfocada por teclado se mantiene visible (`scrollIntoView({ block: 'nearest' })`).
- **Foco visible**: `:focus-visible` (nunca `:focus` solo) con anillo por tokens:
  ```scss
  --int-<id>-focus-ring-width: var(--i-control-outline-width);
  --int-<id>-focus-ring-color: var(--i-control-outline-color);
  --int-<id>-focus-ring-offset: var(--i-control-outline-offset);
  ```
  Nunca `outline: none` sin reemplazo.
- **ARIA ligada al teclado**: `aria-expanded`, `aria-controls`, `aria-haspopup`, `aria-selected`,
  `aria-checked`, `aria-activedescendant`, `aria-posinset`/`aria-setsize` y los `aria-live` (toast,
  texto oculto de resultados) **iguales** a PrimeNG. Ids estables con un contador del módulo.
- **Etiquetas**: inputs `ariaLabel` / `ariaLabelledBy` con el mismo nombre que PrimeNG.

### 2.3 Validación

- En el navegador, recorrer cada fila de la tabla 2.1 (Tab, Shift+Tab, Enter, Space, Escape, flechas,
  Home/End, tecleo) y anotar el resultado en el informe. Si no se pudo abrir el navegador, decirlo.
- Comprobar que el anillo de foco se ve con teclado y no con clic.
- Opcional: un spec que despache `new KeyboardEvent('keydown', { key: 'ArrowDown' })` y verifique el
  estado (`aria-expanded`, opción activa).
