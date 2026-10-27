---
name: replicar-primeng
description: Replica un componente de PrimeNG v20 (p-chip, p-button, p-select, p-dialog…) como componente int-* propio de Intelica Components, sin depender de PrimeNG en runtime. Analiza su implementación real en node_modules (primeng/fesm2022, @primeuix/styles, @primeuix/themes), inventaría su API pública y genera base (Signals, OnPush, a11y), estilos SCSS BEM con tokens --i-* y una variante de documentación por característica, y valida con build y tests. Úsalo cuando el usuario diga "replica p-chip de PrimeNG", "clona el p-select", "haz un int-dialog igual al de PrimeNG", "copia el componente X de PrimeNG v20" o /replicar-primeng. Acepta un link de Figma (Link to selection) como referencia visual: Figma manda en la apariencia, PrimeNG en el comportamiento y los valores siempre salen de los tokens --i-* del Style Guide; recorre el frame padre del link para no perder tamaños, estados, colores ni formatos. El contenido que va dentro de los templates del componente (#item, #header, cuerpo proyectado) se maqueta en las variantes con las clases helper .u-* del Style Guide. Si el componente compone otro int-* (multiselect → checkbox), lo declara en requires y, si ese aún no está done, usa un provisional marcado que luego reemplaza /resolver-dependencias. Siempre pregunta primero en qué componente int-* existente se replica: si no existe, sugiere crearlo con crear-componente y se detiene; si ya tiene contenido customizado, no lo altera salvo que el usuario elija forzar.
argument-hint: "<p-selector o nombre del componente de PrimeNG> [link de Figma]"
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
- [references/figma.md](references/figma.md): cómo usar un link de Figma como referencia visual y
  traducir sus valores a tokens `--i-*` (solo si el usuario da el link).
- [references/helpers.md](references/helpers.md): clases helper `.u-*` del Style Guide para maquetar el
  contenido que va **dentro de los templates** del componente en las variantes (3.5).

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
| Contenido de los templates en la demo (`flex gap-2`, PrimeFlex/Tailwind) | Clases helper `.u-*` del Style Guide en el `example.html` (3.5) |
| Clases del Style Guide (`.prCard`, `.pt*`, `.ly*`, `.gr*`, `row`/`col-*`) | **Nunca.** Del Style Guide solo se usan tokens `--i-*` y helpers `.u-*` |
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
2. Pregunta, en un solo mensaje:
   - **"¿En qué componente replico `p-<nombre>`?"**, con el candidato sugerido y la versión (por
     defecto la más reciente). Aunque el candidato parezca obvio, se confirma.
   - **"¿Tienes un link de Figma (Link to selection) del componente? (opcional)"**, salvo que ya venga
     en el pedido. Con link se sigue 1.5; sin link, la apariencia sale de PrimeNG + Style Guide.

   El diseñador y el estado no se preguntan: se conservan los del componente.
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
  Única excepción: agregar ids a `requires` de `<id>.config.ts` (1.6).
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
| Componentes compuestos | `p-checkbox`, `p-chip`, `p-button`… usados en la plantilla | | | `int-*` equivalente + su estado (1.6) |

**Fuera de alcance por defecto** (infraestructura de PrimeNG, no del componente): `pt` / `ptOptions`
(PassThrough), `unstyled`, `dt` (input de tokens), `pTemplate` / `PrimeTemplate`, `pBind`,
`styleClass` cuando ya está `@deprecated` en favor de `class`, `PrimeNGConfig`/traducciones globales.
Se listan en "Diferencias" del informe. Los templates por nombre (`#removeicon`, `#item`) sí se replican
con `contentChild('nombre')` + `TemplateRef`.

### 1.5 Referencia visual de Figma (solo si hay link)

Procedimiento completo en [references/figma.md](references/figma.md). En resumen:

1. Del link (`figma.com/design/:fileKey/…?node-id=1-2`) saca `fileKey` y `nodeId` (`1-2` → `1:2`).
2. Con el MCP de Figma: `create_session` (fileKey + tarea) y luego, sobre ese nodo,
   `get_screenshot` (referencia visual), `get_variable_defs` (variables usadas) y `get_design_context`
   (medidas y estructura; antes, cargar la skill `figma-design-to-code` como pide el MCP). Si el MCP no
   está disponible o pide autorización, avisar y seguir sin Figma.
3. **Recorre el frame padre** del link (el link suele ser solo el primer diseño): detecta **ejes**
   (tamaños, estados, colores) y **formatos** (group, chart, large…) y muestra la **tabla de
   clasificación** (references/figma.md, sección 3). Lo que coincide con PrimeNG o es un pseudo-estado se
   implementa sin preguntar; lo demás va a las preguntas de 2.2.
4. Arma la **tabla visual** en el chat: cada medida/color/estado de Figma → variable de Figma →
   token `--i-*` del Style Guide → `--int-<id>-*`; por cada valor de eje, solo lo que cambia.
   Si el diseño muestra **contenido dentro de los templates** (la fila de un `#item`, el cuerpo de un
   dialog), arma además la **tabla de contenido**: capa → propiedad → destino (helper `.u-*` o
   modificador con tokens, 3.5).
5. **Guarda los links** en la cabecera de `version-N/base/<id>.html`: `figma:` (el link del usuario;
   vacía por defecto; si falta, se agrega debajo de `description:`; si ya tenía otro link, se pregunta
   antes de reemplazarlo) y `figma-frame:` (el frame recorrido). Son los únicos cambios permitidos en la
   cabecera. La página muestra un chip "Figma" que abre el diseño, y `/actualizar-replica` los usa para
   comparar después:
   ```html
   <!--
     title: Chip
     description: Chip represents people using icons, labels and images.
     figma: https://www.figma.com/design/<fileKey>/<name>?node-id=12-345
     figma-frame: https://www.figma.com/design/<fileKey>/<name>?node-id=12-300
   -->
   ```
6. Cada `--int-*` que salga de Figma lleva el comentario `// Figma: <valor> (<variable>) · Aura: <valor>`
   (**obligatorio**; con `[Eje=Valor]` si sale de un eje): es la huella con la que `/actualizar-replica`
   detecta qué cambió en el diseño.

Reparto de responsabilidades (no se discute en cada réplica):

| Aspecto | Manda |
|---|---|
| API, estructura de elementos, estados internos, teclado, ARIA, eventos | **PrimeNG** |
| Medidas, espaciados, radios, colores, tipografía, sombras, iconos y estados que se ven en el diseño | **Figma** |
| Valores CSS | **Style Guide** (`--i-*`): Figma dice *qué* valor; el token del Style Guide es *cómo* se escribe |
| Contenido del consumidor dentro de los templates (variantes) | **Style Guide** (helpers `.u-*`): Figma dice el layout; el helper es *cómo* se escribe |
| Lo que Figma no muestra (un estado, una variante) | PrimeNG traducido a tokens (3.3) |

- Figma nunca se copia como CSS literal (`#hex`, `px`, `font-family`): cada valor se resuelve a un `--i-*`.
- Variantes o estados que aparecen en Figma pero no existen en la API de PrimeNG v20 no se inventan:
  se listan y se pregunta si se agregan como **extensión `int-*`** (2.2).

### 1.6 Dependencias entre componentes `int-*`

Cada maquetador replica su componente, pero algunos componen otros (`p-multiselect` usa `p-checkbox` y
`p-chip`; `p-paginator` usa `p-select`). Nadie se bloquea esperando al otro:

1. De la plantilla de PrimeNG (1.3), lista cada componente PrimeNG que usa y su `int-*` equivalente
   (tabla de 1.1; ojo: hoy `p-checkbox`/`p-radiobutton` viven dentro de `input`, así que se pregunta si
   el destino es `input` o un componente propio). Los iconos y el CDK no son dependencias de este tipo.
2. Lee el estado de la versión más reciente de cada uno:
   ```bash
   grep -n "static readonly status\|static readonly designer" src/components/<dep>/version-*/base/<dep>.ts
   ```
3. Según el estado:

| Estado de la dependencia | Qué hace la réplica |
|---|---|
| `done` | Compone el componente real: importa `Int<Dep>` de `../../../<dep>/version-N/base/<dep>` y usa `<int-<dep>>` con su API pública |
| `pending` / `in-progress` | **Provisional**: el marcado nativo mínimo equivalente (`<input type="checkbox">`, `<button>`, `<span>`) con clases BEM **del componente actual** (`int-multi-select__checkbox`) y estilos mínimos en su SCSS; nada de copiar la réplica del otro |
| No existe | Igual que pendiente, y en el informe se sugiere crearlo con `/crear-componente` |

4. Cada provisional queda **marcado** para encontrarlo después (el texto exacto importa):
   ```html
   <!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
   <input type="checkbox" class="int-multi-select__checkbox" … />
   <!-- /dep:checkbox -->
   ```
   y `// TODO(dep:checkbox provisional)` en el TS/SCSS que solo existe por el provisional.
   El provisional respeta la API y el ARIA que PrimeNG le daría al hijo (rol, `aria-checked`…).
5. Agrega el id a `requires` de `src/components/<id>/<id>.config.ts` (crea la propiedad si falta; no
   toques el resto del config). La página muestra el chip "Requires …" con el estado de la dependencia
   y Reference → Status la columna "Requiere":
   ```ts
   export default {
     id: 'multi-select',
     requires: ['checkbox', 'pill'],
     loadRoutes: () => import('./routes'),
   } satisfies ComponentDefinition;
   ```
6. En el informe (5) se lista cada dependencia: estado, diseñador a cargo y si quedó provisional.
   Cuando la dependencia pase a `done`, el provisional se reemplaza con `/resolver-dependencias <dep>`.

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

- **Componente destino** y **link de Figma opcional** (1.1): siempre, al inicio.
- **Archivos customizados** (1.2): completar solo la plantilla, forzar o cancelar.
- Un token sin equivalente en el Style Guide (3.3), también para un valor de Figma.
- Variantes o estados de Figma que PrimeNG no tiene (1.5): ¿extensión `int-*` o se omiten?
- Formatos del frame de Figma (1.5, ❓ de la tabla de clasificación): ¿variante de composición,
  modificador o componente aparte?
- Dependencia ambigua (1.6): p. ej. checkbox → ¿`input` o un componente propio?
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
- Con Figma: cada **eje** implementado tiene su variante (`sizes`, `disabled`, `severity`…) mostrando
  todos sus valores, y cada **formato** aceptado como composición la suya (`group`, `chart`…).
- Nunca carpetas para atributos que no existen en PrimeNG v20 ni para extensiones propias sin marcarlas.
- Variantes existentes (vienen del Excel/Figma): **no se borran ni renombran**. Si están en plantilla
  y corresponden a una característica, se completan; si están customizadas, se aplica 1.2 (no se
  tocan salvo que se fuerce). Las que falten se crean.

Cada variante se crea con el script (nunca a mano ni copiando otra):

```bash
npm run new:variant -- <id> "<Título>" --description "<qué demuestra, qué observar>"
```

**Idioma de las descripciones:** si la documentación de PrimeNG trae la descripción (como la del
componente), se copia tal cual. Si no la trae (lo habitual en las variantes) y hay que redactarla,
se escribe **en español**. Los títulos siguen como en PrimeNG.

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
- Permitido: importar la **base** de otro `int-*` declarado en `requires` y en `done`
  (`../../../<dep>/version-N/base/<dep>`), nunca sus variantes ni sus estilos sueltos (1.6).
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
    > 🎯 **Regla de tokens: `--int-<id>-*: var(--i-*)`.** Los tokens (color, spacing, sizing,
    > border-radius, border-width, tipografía, sombra, opacidad, motion, etc.) se consumen **siempre**
    > del Intelica Style Guide. Cada `--int-*` es un alias de un `--i-*`, nunca un valor propio, y se
    > prefiere el **alias con escala** del Style Guide (`xs`, `sm`, `md`, `lg`, `xl`) sobre la escala
    > numérica (`--i-spacing-100`):
    > ```scss
    > --int-chip-gap: var(--i-spacing-gap-sm);              // Aura: 0.5rem
    > --int-chip-padding-x: var(--i-spacing-container-lg);  // Aura: 0.75rem
    > ```
    - Sin literales (`#hex`, `rgb()`, `px`, `rem`, `0.6`, `0.2s`) ni valores de Aura en los `--int-*`.
      El comentario `// Aura: <valor>` solo documenta el original de PrimeNG (con Figma:
      `// Figma: <valor> (<variable>) · Aura: <valor>`, ver references/figma.md).
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
  solo lo que cambia respecto de la base; `.int-<id>--<valor>`; sin `:root`. También un grupo por
  **formato de contenido** de una variante (`_card.data.scss` → `.int-card--data &__<elem>`), pero solo
  con estados visuales u otra cosa no estructural que ningún helper cubre (3.5); la estructura va con helpers.
- Del Style Guide solo se consumen tokens `--i-*`: ningún selector ni CSS copiado de sus clases
  (`.prCard`, `.pt*`, `.ly*`, `.gr*`…).
- Prohibido: clases `p-*`, clases sueltas (`.icon`, `.active`), `::ng-deep`, selectores de etiqueta
  globales, `.doc-*` / `--doc-*`, `!important` sin motivo, anidar más de 3 niveles.
- Presupuesto: `anyComponentStyle` avisa a 4 kB y **falla a 8 kB** (angular.json, build production).
  Si se acerca, simplificar antes de partir el componente.

### 3.4 Variantes (`variants/<slug>/`)

Tras `npm run new:variant` cada carpeta trae `example.ts` (importa la base) y `example.html` (solo la
cabecera). Completar:

- `example.html`: debajo de la cabecera, uso real de `<int-<id>>` que un consumidor podría copiar.
  Sin clases de documentación ni estilos inline: si se muestran varios valores juntos (todas las
  severidades), van como componentes seguidos; la página de documentación ya les da espacio. El
  contenido que va dentro de los templates del componente se maqueta con helpers `.u-*` (3.5).
- Descripción de la cabecera: qué demuestra, qué atributos usa, qué observar (estado, teclado, evento)
  y limitaciones. Una o dos frases, en español cuando la redactas tú (ver 2.4).
- `example.ts`: un solo componente exportado; datos de demostración como constante tipada en el mismo
  archivo (`const MOCK_ITEMS: readonly Item[] = […]`) expuesta en la clase; `signal()` solo si el ejemplo
  la modifica (p. ej. lista de chips que se eliminan con `onRemove`). Sin servicios, HTTP ni `*.mock.ts`.
  Los mocks alimentan inputs públicos; nunca sustituyen la API.

### 3.5 Contenido de los templates: clases helper del Style Guide

Además de los tokens, cuando hay que **maquetar contenido dentro de los templates** del componente
replicado (`<ng-template #item>`, `#header`, `#footer`, `#empty`…, o lo proyectado con `<ng-content>`:
cuerpo de un dialog, de una card), ese contenido se escribe con las **clases helper `.u-*` del
Style Guide** (`utilities/_helpers.scss`) para acercarse al diseño de Figma. Detalle, catálogo y tabla
de traducción en [references/helpers.md](references/helpers.md).

- Aplica al `example.html` de las variantes (marcado del consumidor). La **base** y su SCSS siguen con
  BEM + `--int-*` → `--i-*`: nunca helpers en `base/<id>.html`.
- Figma → helper con el mismo token: auto layout → `u-display-flex`/`u-flex-column` + `u-gap-*` +
  `u-align-items-*`/`u-justify-content-*`; padding/margin → `u-p*-{0..5}`/`u-m*-{0..5}`; texto →
  `u-text-*`, `u-heading-*`, `u-bold`; color → `u-color-*`; radio/sombra/borde → `u-radius-*`,
  `u-shadow-*`, `u-b*-*`.
- 🔒 **Del Style Guide solo TOKENS y HELPERS**: nada de `.prCard`, `.prButton`, `.pt*`, `.ly*`, `.gr*`,
  clases de proyectos ni `row`/`col-*`, en ningún archivo.
- Por capa de contenido:
  1. **Estructura** (flex, gap, padding, margin, alineación, tamaño, overflow) → helpers.
  2. **Visual estático** con helper exacto (texto, peso, color, radio, sombra, bordes) → helpers.
  3. **Estados visuales** (hover, active, focus, seleccionado, disabled) **u otra cosa no estructural
     sin helper** → modificador `.int-<id>--<grupo>` con `&__<elem>` en `_<id>.<grupo>.scss` (3.3),
     solo con `--int-*` → `--i-*`. Solo eso; la estructura sigue en helpers.
- Si el contenido es otro componente (botón, chip, avatar), se usa su `int-*` en `done`, no se imita con
  helpers; si no está en `done`, marcado nativo mínimo + helpers.
- Estructura sin helper exacto: el más cercano de la escala y la diferencia al informe. Nunca `style`
  inline, SCSS en la carpeta de la variante, clases de PrimeFlex/Tailwind (de la demo de PrimeNG o de
  `get_design_context`) ni clases `u-*` inventadas.

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
grep -rnE "style=\"|\[style\.|class=\"([^\"]* )?(flex|gap-[0-9]|items-|justify-|text-(sm|xs|lg)|p-[0-9]|m-[0-9])( |\")" src/components/<id>/version-*/variants/   # contenido sin helpers (3.5)
grep -rnE "\bu-[a-zA-Z0-9-]+" src/components/<id>/version-*/base/   # helpers en la base: prohibido (3.5)
grep -rnE "\.?\b(pr|pt|ly|gr)[A-Z][a-zA-Z]*|class=\"([^\"]* )?(row|col(-[a-z0-9]+)*)( |\")" src/components/<id>/   # clases del Style Guide que no son u-* (3.5)
```

Cada clase `u-*` usada en las variantes debe existir en el Style Guide (no debe imprimir nada):

```bash
grep -rhoE "\bu-[a-zA-Z0-9-]+" src/components/<id>/version-*/variants/ | sort -u | while read c; do
  grep -qE "\.$c\b" C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css/utilities/_helpers.scss || echo "no existe: $c"
done
```

Dependencias (1.6), no deben salir vacías sino coincidir con lo reportado:

```bash
grep -rn "dep:[a-z-]* provisional" src/components/<id>/     # un bloque por dependencia no done
grep -n "requires" src/components/<id>/<id>.config.ts        # todas las dependencias detectadas
```

Revisión manual (lista corta, en el informe):
- Cada input/output del inventario marcado como implementado existe con el mismo nombre y default.
- Cada variante usa solo la API pública de `Int<Id>` y su descripción coincide con lo que muestra.
- Plantilla sin cálculos: solo signals/`computed`; `@for` con `track` estable.
- Sin estado duplicado; `effect()` solo con efectos externos.
- Teclado y ARIA como en PrimeNG (repasar `onKeydown` original línea a línea).
- Visual: `npm start` → `http://localhost:4321/components/<id>`; para comparar con PrimeNG, montar
  temporalmente el `p-<nombre>` en una variante **sin guardarlo** o comparar con la demo oficial. Los
  tokens `--i-*` solo existen con el Style Guide levantado (`localhost:8080`); sin él el componente queda
  sin tokens. Si no se puede abrir un navegador, decirlo: no afirmar fidelidad visual sin verla.
- Con Figma: comparar el resultado con el `get_screenshot` del nodo (estructura, medidas, colores,
  estados) y revisar que cada fila de la tabla visual (1.5) terminó en un `--int-*` → `--i-*` y cada
  fila de la tabla de contenido en un helper `.u-*` (3.5).

Si `build` o `test` fallan por algo ajeno al componente, se reporta sin "arreglar" otras partes.

---

## 5. Fase 5 · Informe final (en el chat)

1. Componente replicado (`p-<nombre>` → `<int-<id>>`, versión) y archivos customizados que se
   respetaron o se forzaron.
2. Archivos creados / modificados (rutas como enlaces).
3. Funcionalidades implementadas (tabla del inventario con ✅ / ➖ descartado + motivo).
4. Variantes generadas con su enlace `/components/<id>#<id>-<slug>`.
5. Dependencias externas que siguen (`@angular/cdk`, `primeicons`…) y por qué; y **componentes
   `int-*` requeridos** (1.6): estado, diseñador a cargo, real o provisional, y
   "cuando esté done: `/resolver-dependencias <dep>`".
5b. Con Figma: tabla de ejes y formatos con lo decidido; formatos que quedaron como componente aparte.
6. Diferencias con PrimeNG v20 (fuera de alcance de 1.4, extensiones `int-*`, tokens sin equivalente)
   y, con Figma, diferencias con el diseño (valores aproximados a un token o a un helper `.u-*`, lo que
   Figma no mostraba).
7. Validaciones ejecutadas con su resultado real.
8. Limitaciones conocidas y mejoras futuras.
9. Sugerencia: marcar el estado con `/cambiar-estado <id> in-progress|done`.

---

## 6. Qué NO hacer

- ❌ Importar, envolver o delegar en PrimeNG (`primeng/*`, `@primeuix/*`, `p-*`, `pTemplate`, `pBind`).
- ❌ Empezar sin preguntar el componente destino, o crear el componente desde esta skill (se sugiere
  `/crear-componente` y se para).
- ❌ Alterar o sobrescribir un archivo customizado sin que el usuario elija **forzar** (1.2).
- ❌ Cambiar cabecera, `status` o `designer`, aun forzando (salvo agregar la línea `figma:`, 1.5).
- ❌ Omitir el comentario `// Figma: …` de un token que viene de Figma: sin él no se puede actualizar.
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
- ❌ Copiar valores de Figma como literales (`#hex`, `px`) o el código que genera `get_design_context`
  (React/Tailwind): es referencia; se escribe en Angular + BEM + `--int-*` → `--i-*`.
- ❌ Cambiar la API o el comportamiento de PrimeNG porque Figma muestra otra cosa: Figma manda en lo
  visual, PrimeNG en el comportamiento.
- ❌ Leer solo el nodo del link de Figma: se recorre su frame padre (ejes y formatos).
- ❌ Esperar a otro maquetador, copiar su réplica o editar su componente: se usa un provisional marcado
  `dep:<id> provisional` y se declara en `requires`.
- ❌ Usar un provisional sin marcar o importar un `int-*` que no está en `done`.
- ❌ Maquetar el contenido de los templates de las variantes con `style` inline, SCSS propio o clases de
  PrimeFlex/Tailwind en vez de helpers `.u-*`; usar helpers en la base o inventar clases `u-*` (3.5).
- ❌ Usar del Style Guide algo que no sean tokens `--i-*` y helpers `.u-*` (`.prCard`, `.pt*`, `.ly*`,
  `.gr*`, `row`/`col-*`) o copiar su CSS.
- ❌ Poner estructura (flex, gap, padding…) en un modificador de contenido cuando la resuelve un helper:
  el modificador solo lleva estados u otra cosa no estructural (3.5).
