---
name: replicar-primeng
description: Replica un componente de PrimeNG v20 (p-chip, p-button, p-select, p-dialog…) como componente int-* propio de Intelica Components, sin depender de PrimeNG en runtime. Analiza su implementación real en node_modules (primeng/fesm2022, @primeuix/styles, @primeuix/themes), inventaría su API pública y genera base (Signals, OnPush, a11y), estilos SCSS BEM con tokens --i-* y una variante de documentación por característica, y valida con build y tests. Úsalo cuando el usuario diga "replica p-chip de PrimeNG", "clona el p-select", "haz un int-dialog igual al de PrimeNG", "copia el componente X de PrimeNG v20" o /replicar-primeng. Siempre pregunta primero en qué componente int-* existente se replica: si no existe, sugiere crearlo con crear-componente y se detiene; si ya tiene contenido customizado, no lo altera salvo que el usuario elija forzar.
argument-hint: "<p-selector o nombre del componente de PrimeNG>"
---

# Replicar un componente de PrimeNG v20 como `int-*`

Convierte un componente de PrimeNG v20 en un componente propio `int-<id>` que conserva su estructura,
apariencia, API y comportamiento, pero **no importa nada de PrimeNG**. PrimeNG solo se lee durante el
análisis. El resultado se integra en la documentación del proyecto como cualquier otro componente.

Referencias de esta skill (léelas cuando la fase lo pida, no antes):
- [references/primeng-v20-map.md](references/primeng-v20-map.md): dónde está cada pieza de PrimeNG en
  `node_modules`, cómo leer el código compilado y cómo traducir tokens `dt('…')` a `--i-*`.
- [references/ejemplo-p-chip.md](references/ejemplo-p-chip.md): recorrido completo con `p-chip`
  (inventario, plan, archivos y variantes esperadas).

Convenciones del proyecto (fuente de verdad, no se duplican aquí): skill `crear-componente`
(`.claude/skills/crear-componente/SKILL.md`) y la implementación de referencia `src/components/_demo_/`.

> ⚠️ **Excepción explícita a "la base se entrega solo como plantilla".** `crear-componente` deja la base
> vacía para el maquetador. Esta skill **es** la maquetación: escribe CSS, marcado y lógica porque el
> usuario pidió replicar el componente. Todo lo demás de `crear-componente` sigue vigente (cabeceras,
> `status`, `designer`, scripts, registro, nombres).
>
> 🔒 **Solo sobre componentes existentes y sin pisar lo customizado.** Siempre se pregunta el componente
> destino (1.1); si no existe se sugiere `/crear-componente` y se para. Lo que ya está customizado no se
> altera ni se sobrescribe salvo que el usuario elija **forzar** (1.2).

---

## 0. Adaptaciones fijas al proyecto

El pedido genérico ("int-chip.component.ts", `_index.css`, `variants/default/`) se adapta así. No se
vuelve a discutir en cada réplica:

| Pedido genérico | En este proyecto |
|---|---|
| `int-chip.component.ts` / `.html`, clase `IntChipComponent` | `version-N/base/chip.ts` + `chip.html` (**solo `.ts` y `.html`**: nunca `.component.ts` / `.component.html` ni prefijo `int-` en el archivo), clase `IntChip`, selector `int-chip` |
| `styles/_index.css` + `_chip.css` | `styles/_index.scss` (solo `@use`) + `_chip.scss` + `_chip.<grupo>.scss` (angular.json: `inlineStyleLanguage: scss`) |
| `@import "./_chip.removable.css"` | `@use 'chip.removable' as chip-removable;` (el `as` es obligatorio) |
| `variants/default/` | `variants/basic/` (siempre existe) + `variants/<slug>/example.ts` + `example.html` |
| Carpeta `components/` | `src/components/<id>/` con `<id>.config.ts`, `routes.ts`, `<id>-page.ts`, `version-N/` |
| Mocks "en el .ts del componente" | En la clase del `example.ts` de la variante. La base **no** lleva mocks: se extrae a npm |
| Tokens de diseño | `--i-*` del Intelica Style Guide; nunca `--doc-*` ni `dt()` de PrimeNG |
| Comentarios | En inglés, como el resto del código del repo; densidad similar a `_demo_` |
| Título y descripción | Cabecera HTML (`<!-- title: … description: … -->`), nunca en TS |

---

## 1. Fase 1 · Inspección

### 1.1 Preguntar el componente destino (siempre, antes de todo)

Esta skill **nunca crea componentes**. Lo primero, antes de leer PrimeNG, es preguntar **en qué
componente `int-*` del proyecto** se escribe la réplica, aunque el usuario solo haya dicho
"Replica p-chip":

1. Normaliza el pedido (`p-chip` → `Chip`) y lista los candidatos para proponerlos en la pregunta:
   ```bash
   ls src/components/
   grep -h "title:" src/components/*/version-*/base/*.html
   grep -h "sourceName" src/components/*/*.config.ts
   ```
   Equivalencias habituales: `p-select` → `dropdown-select`, `p-dialog` → `dialog-modal`,
   `p-inputtext`/`p-checkbox`/`p-radiobutton`/`p-textarea` → `input`, `p-tree` → `tree-view`,
   `p-toggleswitch` → `toggle-switch`, `p-tabs` → `tabs`, `p-datepicker` → `date-picker`,
   `p-fileupload` → `file-upload`, `p-listbox` → `list-box`, `p-inputotp` → `input-otp`,
   `p-progressbar` → `progress-bar`, `p-tag`/`p-chip` ↔ `pill`.
2. Pregunta: **"¿En qué componente replico `p-<nombre>`?"**, con el candidato sugerido y la versión
   (por defecto la más reciente). Aunque el candidato parezca obvio, se confirma. El diseñador y el
   estado no se preguntan: se conservan los del componente.
3. **Si el componente indicado no existe**: no se crea nada y se responde:

   > El componente **<nombre>** no existe en Intelica Components. Créalo primero con
   > `/crear-componente` y luego vuelve a pedir la réplica con `/replicar-primeng p-<nombre>`.

   No se siguen los pasos de `crear-componente` desde esta skill.

### 1.2 Revisar qué está customizado (componente existente)

En la versión elegida, clasifica **cada archivo** que la réplica tocaría:

| Estado | Cómo se detecta | Qué hacer |
|---|---|---|
| **Plantilla** | `base/<id>.html` solo con cabecera + `int-<id>`; `base/<id>.ts` solo con `status` y `designer`; `.scss` con selectores vacíos; `example.html` solo con cabecera ("Preview pending") | Se puede completar. Se conservan cabecera, `status`, `designer` y comentarios de plantilla |
| **Customizado** | Cualquier contenido más allá de la plantilla: marcado, inputs, lógica, declaraciones CSS, un ejemplo escrito, módulos de estilo con reglas | **No se altera ni se sobrescribe** |

Si hay archivos customizados, muéstralos (ruta + resumen de qué tienen) y pregunta:

> `<componente>` ya tiene contenido propio en: `<lista>`. No lo voy a modificar salvo que lo fuerces.
> ¿Qué hago?
> 1. Completar solo lo que está en plantilla y dejar intacto lo customizado (puede quedar incompleta).
> 2. **Forzar**: sobrescribir esos archivos con la réplica.
> 3. Cancelar (para conservar todo y replicar aparte, crea antes una versión nueva con `/crear-version`).

- Sin respuesta explícita "forzar" (opción 2), **ningún** archivo customizado se toca.
- Forzar aplica solo a los archivos listados; cabecera (`title`/`description`), `status` y `designer`
  se conservan siempre, incluso forzando.
- Nunca se borran ni renombran variantes, archivos de estilo ni versiones existentes, ni se edita
  `<id>.config.ts`, `inventory.ts`, `routes.ts`, `<id>-page.ts` o `catalog-groups.ts` del componente.
- Agregar archivos **nuevos** (variantes con `new:variant`, módulos `_<id>.<grupo>.scss`) no altera lo
  existente; la línea `@use` nueva en `_index.scss` sí es un cambio permitido mientras sea solo agregar.

### 1.3 Leer la implementación de PrimeNG

Sigue [references/primeng-v20-map.md](references/primeng-v20-map.md). Como mínimo lee, **completos**:

- `node_modules/primeng/fesm2022/primeng-<nombre>.mjs`: clase, `classes` (estructura y estados),
  `inlineStyles`, plantilla inline, handlers (`onKeydown`, `close`…), `ɵcmp` (inputs con `transform`,
  outputs, `host`, `queries` = templates proyectables).
- `node_modules/primeng/<nombre>/index.d.ts` y `node_modules/primeng/types/<nombre>/index.d.ts`:
  API pública documentada (JSDoc con `@defaultValue`, `@group Props|Emits|Templates`, `@deprecated`).
- `node_modules/@primeuix/styles/dist/<nombre>/index.mjs`: CSS real con `dt('…')`.
- `node_modules/@primeuix/themes/dist/aura/<nombre>/index.mjs`: valores del tema Aura (el que usa
  `src/app/app.config.ts`) y `aura/base/index.mjs` para resolver `{surface.100}`, `{primary.color}`…
- Clases heredadas e imports (`BaseComponent`, `BaseEditableHolder`, `BaseInput`, `ConnectedOverlayScrollHandler`,
  `DomHandler`, `primeng/icons`, `@angular/cdk`…): sigue cada import hasta saber qué aporta al
  comportamiento público. No asumas que todo está en un archivo.

Si un archivo no existe o la lógica vive en un paquete que no está instalado, anótalo como limitación
y continúa con lo verificable.

### 1.4 Inventario de la API (obligatorio, antes de planificar)

Escríbelo en el chat como tabla. Separa lo público de lo interno:

| Tipo | Nombre | Tipo TS | Default | Notas (transform, deprecated, efecto visual) |
|---|---|---|---|---|
| Input | … | … | … | … |
| Output | … | payload | — | cuándo se emite |
| Template / contenido | `#nombre`, `<ng-content>` | contexto | — | |
| Estado interno | `visible`, `focused`… | | | qué lo cambia |
| A11y | roles, `aria-*`, teclas | | | |
| Forms | `ControlValueAccessor`, `ngModel` | | | si hereda de `BaseEditableHolder`/`BaseInput` |
| Dependencias | CDK, iconos, overlays, servicios | | | se reemplaza por… |

**Fuera de alcance por defecto** (infraestructura de PrimeNG, no del componente): `pt` / `ptOptions`
(PassThrough), `unstyled`, `dt` (input de tokens), `pTemplate` / `PrimeTemplate`, `pBind`,
`styleClass` cuando ya está `@deprecated` en favor de `class`, `PrimeNGConfig`/traducciones globales.
Se listan en "Diferencias" del informe. Los templates por nombre (`#removeicon`, `#item`) sí se replican
con `contentChild('nombre')` + `TemplateRef`.

---

## 2. Fase 2 · Planificación

### 2.1 Plan (en el chat, breve)

Decide y muestra, sin pedir confirmación salvo lo indicado en 2.2:

1. **Archivos** a crear o modificar (rutas completas).
2. **Funcionalidades**: cada fila del inventario → implementada / descartada (con motivo).
3. **Dependencias eliminadas** y su reemplazo (p. ej. `TimesCircleIcon` → `pi pi-times-circle`;
   `DomHandler` → API del DOM; `ConnectedOverlay` → `@angular/cdk/overlay`).
4. **Variantes** (2.4) y **módulos de estilo** (3.3).
5. **Validaciones** que se ejecutarán (fase 4).

### 2.2 Lo único que se pregunta

- **Componente destino** (1.1): siempre, al inicio.
- **Archivos customizados** (1.2): completar solo la plantilla, forzar o cancelar.
- Un token sin equivalente en el Style Guide (3.3).
- Una decisión de diseño que el proyecto no resuelve (p. ej. el Style Guide define un componente
  equivalente con un aspecto distinto al de PrimeNG: ¿manda PrimeNG o el Style Guide?).

Todo lo demás (nombres, variantes, tokens, módulos) se resuelve inspeccionando. No preguntes por cada variante.

### 2.4 Variantes de documentación

Una variante = una **sección de documentación** que demuestra una característica real de la API.
Toma como guía las secciones de la documentación oficial de PrimeNG v20 para ese componente (Basic,
Icon, Image, Template, Disabled, Sizes, Severity, Forms, Accessibility…), pero **solo** las que
correspondan a inputs/outputs/templates del inventario.

- `basic` siempre (ya existe: la crea `crear-componente`).
- Una carpeta por característica: `icon`, `image`, `removable`, `template`, `disabled`, `severity`,
  `sizes`, `forms`, `filter`… Slug kebab-case, título como en PrimeNG.
- `combinations` solo si revela algo que las otras no (interacción entre atributos, conflictos de estilo).
- Nunca carpetas para atributos que no existen en PrimeNG v20 ni para extensiones propias sin marcarlas.
- Variantes existentes (vienen del Excel/Figma): **no se borran ni renombran**. Si están en plantilla
  y corresponden a una característica, se completan; si están customizadas, se aplica 1.2 (no se
  tocan salvo que se fuerce). Las que falten se crean.

Cada variante se crea con el script (nunca a mano ni copiando otra):

```bash
npm run new:variant -- <id> "<Título>" --description "<qué demuestra, qué observar>"
```

Con 3 o más variantes, aplica `ordenar-variantes` siguiendo el orden de la documentación de PrimeNG
(`npm run order:variants -- <id> basic icon image …`), sin preguntar posición.

---

## 3. Fase 3 · Implementación

### 3.1 `base/<id>.ts`

Angular 20.3 (strict, `strictTemplates`). Patrón:

```ts
import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output, signal,
  ViewEncapsulation,
} from '@angular/core';

/** <int-chip> · version 1. Replica of PrimeNG v20 p-chip without PrimeNG at runtime. */
@Component({
  selector: 'int-chip',
  templateUrl: './chip.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-chip puts its root classes on the host element.
  host: { '[class]': 'classes()', '[attr.aria-label]': 'label()' },
})
export class IntChip {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = '…';
  // inputs, outputs, state, derived values, handlers…
}
```

Reglas:

- **Primeras dos líneas de la clase**: `status` y `designer` (se conservan si ya existían; no se cambia
  `status`: el informe sugiere `cambiar-estado`).
- **API pública con los mismos nombres que PrimeNG** (inputs y outputs, incluido `onRemove`,
  `onChange`…) para que migrar sea cambiar `p-` por `int-`. Mismos defaults y mismos `transform`
  (`booleanAttribute`, `numberAttribute`). Lo que se agregue y no exista en PrimeNG se comenta como
  `/** int-* extension: … */`.
- Signals según la necesidad:
  - `input()` / `input.required()` para props; `output()` para eventos; `model()` cuando PrimeNG tiene
    `[(x)]` (`visible`, `value`, `activeIndex`…).
  - `signal()` para estado interno que cambia con la interacción; `computed()` para lo derivado
    (clases BEM, etiquetas ARIA, listas filtradas). Nunca dos estados que representen lo mismo.
  - `effect()` solo para sincronizar con algo externo (foco, overlay, `document`); nunca en lugar de `computed`.
  - Arrays/objetos en signals: `update(v => [...v, x])`, sin mutar.
- `ChangeDetectionStrategy.OnPush` siempre que funcione (todo el estado en signals lo permite).
- Clases BEM calculadas en un único `computed` (patrón `_demo_`): bloque + modificadores activos.
- Raíz igual que PrimeNG: si su `host` lleva las clases raíz (`"class": "cn(cx('root'), …)"`), el bloque
  va en el host (`host: { '[class]': 'classes()' }`; Angular conserva la `class` que ponga el
  consumidor). Si la raíz es un elemento de la plantilla, el bloque va en ese elemento y el host lleva
  `style: 'display: contents'`.
- Formularios (si PrimeNG hereda de `BaseEditableHolder`/`BaseInput`/`BaseModelHolder`):
  `ControlValueAccessor` con `NG_VALUE_ACCESSOR` (`forwardRef`), `disabled` combinado del input y de
  `setDisabledState`, `onTouched` en blur. Mismo nombre de valor que PrimeNG (`value`, `ngModel`).
- Templates proyectables: `contentChild<TemplateRef<Ctx>>('nombre')` + `NgTemplateOutlet`, con el mismo
  nombre de referencia que PrimeNG (`#removeicon`, `#item`) y un tipo para el contexto.
- Iconos: `primeicons` (`pi pi-*`, cargado en `src/styles.scss`) o la fuente `incontrol-icons` del Style
  Guide. Nunca `primeng/icons`. Si PrimeNG pinta un SVG propio sin equivalente, copiar el `path` en línea.
- Overlays, foco atrapado, posiciones, listas virtuales: `@angular/cdk` (ya instalado) en vez de
  reimplementar o importar utilidades de PrimeNG. Cada uso de CDK se justifica en un comentario.
- Animaciones: transiciones CSS o `animate.enter` / `animate.leave` (Angular 20.2+) antes que `@angular/animations`.
- Limpieza: `DestroyRef` / `takeUntilDestroyed` para listeners o suscripciones manuales; `host`
  listeners en vez de `addEventListener` cuando se pueda.
- Prohibido: imports de `primeng/*` o `@primeuix/*`, `any`, `as unknown as`, propiedades públicas sin
  uso, imports de `core/`, `service/` o `variants/` (la base se extrae a npm), datos mock.
- Comentarios (inglés): responsabilidad del componente, inputs/outputs no evidentes, signals de estado,
  `computed`, foco/a11y, diferencias con PrimeNG. Nada de comentarios que repitan la línea.

### 3.2 `base/<id>.html`

- Cabecera `<!-- title: … description: … -->` arriba, intacta.
- Misma estructura de elementos que la plantilla de PrimeNG (mismo orden, mismas condiciones), con
  clases BEM: `p-chip` → `int-chip`, `p-chip-label` → `int-chip__label`, `p-chip-remove-icon` →
  `int-chip__remove-icon`. Estados → modificadores (`p-disabled` → `int-chip--disabled`).
- Control flow moderno (`@if`, `@for` con `track` estable —id/valor, no `$index` si hay id—, `@switch`).
  Sin `*ngIf`/`ngClass`.
- Sin llamadas costosas en la plantilla: solo signals y `computed`.
- ARIA y teclado **iguales** a PrimeNG (roles, `aria-*`, `tabindex`, teclas en `onKeydown`). No añadir
  roles sin implementar su comportamiento. Si PrimeNG pone `role`/`tabindex` en un `<span>`, conservar
  el comportamiento; si un elemento nativo (`<button>`) lo cubre mejor, se puede usar como extensión
  documentada sin cambiar la API.
- Comentarios HTML en bloques: estructura principal, secciones condicionales, `@for`, ARIA no evidente.

### 3.3 `styles/`

- `_index.scss`: solo `@use`, el base primero, los modificadores con `as <id>-<grupo>`. Sin líneas a
  archivos que no existen.
- `_<id>.scss`: la plantilla de `crear-componente` 3.7 (TOKENS, BLOCK, ELEMENTS, MODIFIERS, SKELETON)
  **rellena**:
  - **TOKENS** (`:root`): `--NOTE-<ID>` + un token por cada `dt('<id>.…')` del CSS de PrimeNG, con
    nombre `--int-<id>-<parte>` (`--int-chip-padding-x`).
    > 🎯 **Regla de tokens: `--int-<id>-*: var(--i-*)`.** Los tokens primitivos (color, spacing,
    > sizing, border-radius, border-width, tipografía, sombra, opacidad, motion) se consumen **siempre**
    > del Intelica Style Guide. Cada `--int-*` es un alias de un `--i-*`, nunca un valor propio:
    > ```scss
    > --int-chip-padding-x: var(--i-spacing-150); // Aura: 0.75rem
    > ```
    - Sin literales (`#hex`, `rgb()`, `px`, `rem`, `0.6`, `0.2s`) ni valores de Aura en los `--int-*`.
      El comentario `// Aura: <valor>` solo documenta el original de PrimeNG.
    - Si el valor de Aura no existe exacto en el Style Guide, se usa el `--i-*` **más cercano** de su
      escala y la diferencia va al informe ("Diferencias"). Si no hay ninguno de esa categoría, no se
      inventa: se pregunta al usuario (2.2) qué token usar o si se crea en el Style Guide.
    - Únicas excepciones, porque no son tokens de diseño: `0`, `50%` (círculo), `currentColor`,
      `inherit`, `transparent` y `calc()` sobre otros `--int-*`/`--i-*`.
    - Ver la traducción en el mapa (sección 3). Así se personaliza por variables CSS sin una segunda
      arquitectura de tokens: el `--int-*` es el punto de ajuste del componente y el `--i-*` la fuente.
  - **BLOCK / ELEMENTS**: las reglas de `@primeuix/styles` traducidas a BEM (`&__label`), usando solo
    `var(--int-<id>-…)`. Mantener propiedades lógicas (`padding-inline`, `margin-inline-start`) como PrimeNG.
  - Estados (`:hover`, `:focus-visible`, `:disabled`, `[aria-disabled]`) en el módulo base.
  - **SKELETON** `.sk-<id>`: forma básica (mismas dimensiones, fondo neutro) o vacío si no aplica.
- `_<id>.<grupo>.scss` (uno por **grupo** de modificadores reales: `severity`, `size`, `removable`…):
  solo lo que cambia respecto de la base; `.int-<id>--<valor>`; sin `:root`.
- Prohibido: clases `p-*`, clases sueltas (`.icon`, `.active`), `::ng-deep`, selectores de etiqueta
  globales, `.doc-*` / `--doc-*`, `!important` sin motivo, anidar más de 3 niveles.
- Presupuesto: `anyComponentStyle` avisa a 4 kB y **falla a 8 kB** (angular.json, build production).
  Si se acerca, simplificar antes de partir el componente.

### 3.4 Variantes (`variants/<slug>/`)

Tras `npm run new:variant` cada carpeta trae `example.ts` (importa la base) y `example.html` (solo la
cabecera). Completar:

- `example.html`: debajo de la cabecera, uso real de `<int-<id>>` que un consumidor podría copiar.
  Sin clases de documentación ni estilos inline: si se muestran varios valores juntos (todas las
  severidades), van como componentes seguidos; la página de documentación ya les da espacio.
- Descripción de la cabecera: qué demuestra, qué atributos usa, qué observar (estado, teclado, evento)
  y limitaciones. Una o dos frases.
- `example.ts`: un solo componente exportado; datos de demostración como constante tipada en el mismo
  archivo (`const MOCK_ITEMS: readonly Item[] = […]`) expuesta en la clase; `signal()` solo si el ejemplo
  la modifica (p. ej. lista de chips que se eliminan con `onRemove`). Sin servicios, HTTP ni `*.mock.ts`.
  Los mocks alimentan inputs públicos; nunca sustituyen la API.

---

## 4. Fase 4 · Validación

Ejecuta y reporta el resultado real (si algo no se pudo ejecutar, di cuál y por qué):

```bash
npm run build                                          # docs + TS estricto + plantillas + SCSS + budgets
npm test -- --watch=false --browsers=ChromeHeadless    # incluye component-catalog.spec.ts
```

Comprobaciones con grep sobre `src/components/<id>/` (todas deben salir vacías):

```bash
grep -rnE "from ['\"](primeng|@primeuix)" src/components/<id>/
grep -rnE "class=\"([^\"]* )?p-[a-z]|selector: '(\[)?p-|^\s*\.p-[a-z]|<p-[a-z]" src/components/<id>/
grep -rnE "::ng-deep|--doc-|\.doc-|: any\b|as unknown as" src/components/<id>/
grep -rnE "^\s*--int-[a-z0-9-]+:" src/components/<id>/ | grep -v "var(--i-"   # --int-* sin --i-*: solo excepciones de 3.3
grep -rnE "class=\"([^\"]* )?(icon|label|active|disabled|container|selected)( |\")" src/components/<id>/
```

Revisión manual (lista corta, en el informe):
- Cada input/output del inventario marcado como implementado existe con el mismo nombre y default.
- Cada variante usa solo la API pública de `Int<Id>` y su descripción coincide con lo que muestra.
- Plantilla sin cálculos: solo signals/`computed`; `@for` con `track` estable.
- Sin estado duplicado; `effect()` solo con efectos externos.
- Teclado y ARIA como en PrimeNG (repasar `onKeydown` original línea a línea).
- Visual: `npm start` → `http://localhost:4321/components/<id>`; para comparar con PrimeNG, montar
  temporalmente el `p-<nombre>` en una variante **sin guardarlo** o comparar con la demo oficial. Los
  tokens `--i-*` solo existen con el Style Guide levantado (`localhost:8080`); sin él se ven los respaldos.
  Si no se puede abrir un navegador, decirlo: no afirmar fidelidad visual sin verla.

Si `build` o `test` fallan por algo ajeno al componente, se reporta sin "arreglar" otras partes.

---

## 5. Fase 5 · Informe final (en el chat)

1. Componente replicado (`p-<nombre>` → `<int-<id>>`, versión) y archivos customizados que se
   respetaron o se forzaron.
2. Archivos creados / modificados (rutas como enlaces).
3. Funcionalidades implementadas (tabla del inventario con ✅ / ➖ descartado + motivo).
4. Variantes generadas con su enlace `/components/<id>#<id>-<slug>`.
5. Dependencias externas que siguen (`@angular/cdk`, `primeicons`…) y por qué.
6. Diferencias con PrimeNG v20 (fuera de alcance de 1.4, extensiones `int-*`, tokens sin equivalente).
7. Validaciones ejecutadas con su resultado real.
8. Limitaciones conocidas y mejoras futuras.
9. Sugerencia: marcar el estado con `/cambiar-estado <id> in-progress|done`.

---

## 6. Qué NO hacer

- ❌ Importar, envolver o delegar en PrimeNG (`primeng/*`, `@primeuix/*`, `p-*`, `pTemplate`, `pBind`).
- ❌ Empezar sin preguntar el componente destino, o crear el componente desde esta skill (se sugiere
  `/crear-componente` y se para).
- ❌ Alterar o sobrescribir un archivo customizado sin que el usuario elija **forzar** (1.2).
- ❌ Cambiar cabecera, `status` o `designer`, aun forzando.
- ❌ Borrar o renombrar variantes existentes que vienen del Excel/Figma.
- ❌ Inventar inputs, outputs o variantes como si fueran de PrimeNG; las extensiones se marcan.
- ❌ Crear archivos a mano que tienen script (`new:variant`, `new:version`) o editar `src/generated/`.
- ❌ Nombrar la base `<id>.component.ts` / `<id>.component.html` o `int-<id>.*`: es `base/<id>.ts` + `base/<id>.html`.
- ❌ Usar `.css`, `_index.css` o `variants/default/`: ver tabla 0.
- ❌ Mocks en la base, servicios de mocks o archivos `*.mock.ts`.
- ❌ Tokens `--doc-*`, valores sueltos en las reglas, o `--int-*` con literales (`#hex`, `px`, `0.6`,
  `0.2s`) en lugar de `var(--i-*)` del Style Guide.
- ❌ Cambiar `status` o `designer` existentes, tocar `app.routes.ts` o configuraciones globales.
- ❌ Afirmar que build, tests o la fidelidad visual están bien sin haberlos ejecutado/visto.
