---
name: crear-componente
description: Convenciones y pasos para crear (o versionar) un componente int-* en Intelica Components (Angular 20 + SCSS + BEM). Pregunta título y descripción (van en la cabecera del HTML, nunca en TS) y el diseñador a cargo (static designer de la base, con status en pending), crea la estructura base como plantilla y siempre la variante variants/basic/ vacía. Úsalo al maquetar un componente nuevo o revisar las convenciones del proyecto. Para agregar solo una variante a un componente existente, usar crear-variante; para una nueva versión (version-N+1), crear-version.
---

# Crear un componente `int-*`

Guía para maquetadores. Resume las convenciones del proyecto y el paso a paso para crear un
componente nuevo, agregar ejemplos a su documentación o abrir una nueva versión (`/crear-version`).
Referencia completa: `src/components/_demo_/` (2 versiones, base, ejemplos y estilos).

> 🚫 **Regla principal: la base se entrega SOLO como plantilla.**
> Quien crea la estructura (persona o IA) no escribe código de implementación:
> - `.scss`: solo las secciones de la plantilla, el token `--NOTE-*` y los selectores vacíos. Sin CSS.
> - `base/<id>.html`: la cabecera de documentación (título y descripción, en un comentario) y un texto con el nombre del componente (`int-chip`). Sin marcado, bindings ni `<ng-content>`.
> - `base/<id>.ts`: solo el decorador `@Component` básico y la clase con **solo dos** propiedades: `static readonly status` en `'pending'` y `static readonly designer` con el diseñador (ver 3.3). Sin `input()`, `computed`, tipos de variante ni imports extra.
> - Siempre una variante `basic` (paso 3.5): `example.ts` con lo necesario y `example.html` solo con su cabecera, sin ejemplo (la página muestra "Preview pending").
>
> **El maquetador** escribe los estilos, la estructura y la lógica, e importa lo que necesite.
> Tampoco se crean módulos de estilo ni ejemplos que no se hayan pedido explícitamente (salvo `basic`, que va siempre).

---

## 1. Reglas en una línea

| Tema | Regla |
|---|---|
| Estructura | Cada `version-N/` tiene **solo** `base/`, `variants/` y `styles/`. |
| `base/` | El componente reutilizable (`<id>.ts` + `<id>.html`). Debe poder extraerse a una librería npm: no importa nada de `core/`, `service/` ni de `variants/`. |
| `variants/` | Un ejemplo de documentación por carpeta: `variants/<slug>/example.ts` + `example.html`. **Se detectan solos**: no se importan ni se registran en ningún lado. Todo componente nuevo trae `variants/basic/`. |
| Crear variantes | Siempre con `npm run new:variant` (o `/crear-variante`), nunca copiando la de otro componente. |
| `styles/` | SCSS del componente con `_index.scss` como punto de entrada (luego se moverán al repo StyleGuides). Sin subcarpetas. |
| Variantes visuales | Son **propiedades + modificadores BEM** del mismo componente (`severity="secondary"` → `.int-button--secondary`). Nunca se copia el componente ni la base. |
| Ejemplo ≠ modificador | Una carpeta de `variants/` es una **sección de la documentación**, no un modificador. Un ejemplo `severity/` puede pintar todos los valores de `severity` juntos. |
| CSS | Al crear la base: **cero declaraciones CSS**, solo plantilla. El CSS lo agrega el maquetador. |
| Nombres públicos | Prefijo `int-` + kebab-case: `<int-button>`, `.int-button`. Nunca camelCase, PascalCase ni snake_case en selectores o clases. |
| Clase TypeScript | `Int` + PascalCase del id (`IntButton`). Ejemplos: `<Id><Slug>Example` (`ButtonSeverityExample`). |
| BEM | Bloque `.int-button` · elemento `.int-button__icon` · modificador `.int-button--text`. Sin clases sueltas como `.icon`, `.active`, `.primary`. |
| Skeleton | `.sk-<id>` (ej. `.sk-button`), en la sección SKELETON del módulo base. |
| Nombres de carpeta | Ejemplos en kebab-case (`icons-border/`); versiones `version-<número>`. Lo demás se ignora con un aviso en consola. |
| Documentación | Las variantes **son las carpetas** `variants/<slug>/` que existen: cada una es una entrada del menú y una sección de la página, detectadas solas (HTML + TS). `basic` va primero y el resto en orden alfabético. No hay secciones sin carpeta. |
| Config | `<id>.config.ts` es **opcional** y solo sirve para ordenar u ocultar carpetas existentes. Un nombre en `variants` sin carpeta no se muestra. |
| Título y descripción | **Siempre en el HTML**, nunca en TS: el componente en la cabecera de `base/<id>.html`, cada variante en la de su `example.html` (ver 3.0). |
| Ejemplo pendiente | Un `example.html` vacío o **solo con comentarios** (cabecera incluida) se muestra como "Preview pending" con la ruta del archivo. Cualquier contenido fuera de los comentarios (un elemento o texto) hace que se renderice. |
| Estado | Propiedad de la clase en `base/<id>.ts`: `static readonly status: 'pending' \| 'in-progress' \| 'done' = 'pending';`. Se crea siempre en `'pending'` (chip "Pending"); el maquetador la pasa a `'in-progress'` al empezar y a `'done'` al terminar, con la skill `cambiar-estado` o `npm run set:status -- <id> <estado>`. Es por versión; `new:version` la reinicia a `'pending'`. |
| Diseñador | `static readonly designer = '<Nombre completo>';` debajo de `status` en `base/<id>.ts` (`''` = sin asignar). Se pregunta al crear; `new:version` lo copia. Se ve en Reference → Status. |
| Versiones | Cada `version-N/` se detecta sola: con una versión la página muestra "Version 1"; con más, un desplegable (`?version=N`; por defecto la más reciente). |
| Código | Cada sección muestra el código **real** de su ejemplo (pestañas HTML / TS). El switch "Code" de la barra superior abre/cierra todas; el botón "Code" de cada sección, solo la suya. |

---

## 2. Estructura de carpetas

```
src/components/
├── inventory.ts                    ← orden del menú: un import por componente (solo al crear uno)
└── button/
    ├── button.config.ts            ← id + (opcional) orden u ocultar variantes existentes
    ├── routes.ts                   ← rutas internas (/components/button); no se toca para ejemplos
    ├── button-page.ts              ← página: solo <app-doc-page componentId="button" />; no se toca
    └── version-1/                  ← una carpeta por versión: version-2/, version-3/…
        ├── base/
        │   ├── button.ts           ← <int-button>: inputs, lógica, modificadores BEM
        │   └── button.html         ← cabecera (título + descripción del componente) + estructura
        ├── variants/               ← ejemplos de la documentación (detectados por carpeta)
        │   ├── basic/              ← siempre: se crea con el componente (vacía hasta que el maquetador la escriba)
        │   │   ├── example.ts      ← componente del ejemplo: imports + datos de demostración
        │   │   └── example.html    ← cabecera (título + descripción de la variante) + uso de <int-button>
        │   ├── severity/
        │   └── disabled/
        └── styles/
            ├── _index.scss         ← punto de entrada: solo @use
            ├── _button.scss        ← base (plantilla: tokens, bloque, elementos, modificadores, skeleton)
            └── _button.<mod>.scss  ← un módulo por modificador visual (.int-button--<mod>)

src/generated/                      ← AUTOGENERADO y en .gitignore: no editar ni commitear
├── doc-registry.ts                 ← versiones y ejemplos de cada componente
└── examples/<id>.version-N.ts      ← chunk lazy por versión: componentes de ejemplo + su código
```

Cómo funciona la detección: `scripts/generate-docs.mjs` recorre `version-N/variants/<slug>/` y
escribe `src/generated/`, que **importa** los archivos (`base/<id>.html`, `example.html`,
`example.ts`) como texto: no copia su contenido. Por eso:
- **Editar** un `example.html` / `example.ts` o una cabecera se refleja al instante con `npm start` o
  con `ng serve` directo (la página se recarga sola).
- **Crear o borrar carpetas** sí necesita regenerar: lo hacen `npm start` (vigila `src/components/`),
  `npm run new:variant` (al terminar) y `npm run docs`.
La página carga solo los ejemplos de la versión elegida.

---

## 3. Paso a paso: componente nuevo

> Ejemplo: componente `Chip` (en la referencia tiene las variantes `Basic` y `Outlined`).

Orden de trabajo (cada paso se detalla abajo):

1. **3.0** Preguntar título y descripción del componente, descripción de `Basic` y diseñador.
2. **3.1–3.2** `chip.config.ts`, registro en `inventory.ts`, `routes.ts` y `chip-page.ts`.
3. **3.3–3.4** `base/chip.ts` y `base/chip.html` (con la cabecera).
4. **3.6–3.7** `styles/_index.scss` y `styles/_chip.scss` (plantilla sin CSS).
5. **3.5** `npm run new:variant -- chip Basic --description "…"` → `variants/basic/` vacía.
   Necesita `base/chip.ts`, por eso va después de la base.
6. Preguntar **"¿Deseas crear otra variante?"** → sí: `crear-variante` (título + descripción); no: seguir.
7. **3.9** Verificar.

### 3.0 Preguntar antes de crear

Antes de escribir cualquier archivo, pregunta en **un solo mensaje** lo que no se haya dado:

1. **Título** del componente: el nombre visible (`Chip`, `Dropdown / Select`). El `id` se deriva en
   kebab-case (`chip`, `dropdown-select`); confírmalo si no es obvio.
2. **Descripción** del componente: una línea (puede quedar vacía si el usuario no la tiene).
3. **Descripción de la variante `Basic`**: una línea (opcional). Su título es siempre `Basic`.
4. **Diseñador** a cargo: nombre completo. Equipo actual: **Yony León**, **Gabriela Javier**,
   **Christian Abanto** (acepta el nombre corto: "Yony", "Gabi", "Abanto"). Puede quedar vacío si aún
   no se asignó. Va en `static readonly designer` de la base (3.3), no en el HTML.

El título y la descripción se escriben **en el HTML**, en un comentario al inicio del archivo que
`scripts/generate-docs.mjs` lee y Angular no renderiza:

```html
<!--
  title: Chip
  description: Chips represent entities using icons, labels and images.
-->
```

- Componente → cabecera de `version-N/base/<id>.html` (título de la página y del menú, descripción
  bajo el título). Cada versión tiene la suya; el menú usa la de la versión más reciente.
- Variante → cabecera de `version-N/variants/<slug>/example.html` (título y descripción de la sección).
- `description:` puede quedar vacío y continuar en varias líneas.
- No poner títulos ni descripciones en `<id>.config.ts` ni en ningún `.ts`.

### 3.1 `chip.config.ts` (carpeta principal)

```ts
import { ComponentDefinition } from '../../service/catalog.model';

/**
 * Documentation config of "Chip": what the side menu and the documentation page show.
 * - Titles and descriptions are not written here: they live in the header comment of
 *   version-N/base/chip.html (component) and version-N/variants/<slug>/example.html (each variant).
 * - Variants are the version-N/variants/<slug>/ folders, detected automatically ("basic" first).
 * - variants (optional): only to order them or hide one ({ name, hidden: true }); an entry without a
 *   folder is not documented.
 * - hidden: true at the root hides the whole component.
 */
export default {
  id: 'chip',                         // kebab-case, estable: carpeta, ruta y nombre técnico
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
```

Las secciones son las carpetas `variants/<slug>/` que existen: `basic` primero y el resto en orden
alfabético. Su **slug** es el nombre de la carpeta: `Icons + Border` → `variants/icons-border/`.
No listes en `variants` variantes que aún no tienen carpeta: no se muestran. Para que aparezca una
variante, se crea su carpeta con `npm run new:variant`.

| Quiero… | Cómo |
|---|---|
| Agregar una sección | `npm run new:variant -- chip "<Título>" --description "<Descripción>"` (sección 4). |
| Cambiar título o descripción | Editar la cabecera de su `example.html`. |
| Fijar el orden | Listar las carpetas existentes en `variants`, en el orden deseado (`variants: ['Basic', 'Outlined']`). Las no listadas van después. |
| Ocultarla (menú + página) | `{ name: 'Outlined', hidden: true }` (la carpeta puede seguir existiendo). |
| Ocultar el componente completo | `hidden: true` en la raíz (sale del menú, rutas y buscador). |

Ids y anclas: `chip-basic`, `chip-outlined` → `/components/chip#chip-outlined`.

### 3.1.1 Registrar la carpeta (solo una vez)

Un componente **nuevo** se agrega una vez en `src/components/inventory.ts`, en la posición del menú:

```ts
import chip from './chip/chip.config';
// …
export const COMPONENT_INVENTORY = [ /* … */ chip, /* … */ ];
```

Si el componente está en el Excel, actualizar también `EXCEL_NAMES` en `component-catalog.spec.ts`.
El test compara con el `title:` de `base/<id>.html`; si el título visible se simplificó respecto del
Excel (`Input` ← `Input (InputText, Checkbox, …)`), poner el nombre original en `sourceName` del config.
Es el único registro manual: ejemplos y versiones se detectan solos.

### 3.2 `routes.ts` y `chip-page.ts` (carpeta principal)

```ts
// routes.ts
import { Routes } from '@angular/router';

/**
 * Internal routes of "Chip", mounted at /components/chip.
 * Add sub-views here (e.g. { path: 'playground', loadComponent: … }) without touching the global router.
 * Variants are not routes: they are #anchors inside the documentation page.
 */
export default [
  { path: '', loadComponent: () => import('./chip-page').then((m) => m.ChipPage) },
] satisfies Routes;
```

```ts
// chip-page.ts
import { Component } from '@angular/core';

import { DocPage } from '../../core/doc-page/doc-page';

/**
 * Documentation page of "Chip".
 * Sections come from <id>.config.ts + the version-N/variants/<slug>/ folders, which are detected
 * automatically: nothing is registered here. Optional intro content goes inside <app-doc-page>.
 */
@Component({
  selector: 'app-chip-page',
  imports: [DocPage],
  template: `<app-doc-page componentId="chip" />`,
})
export class ChipPage {}
```

La página **no se vuelve a tocar** para agregar ejemplos ni versiones. El router global
(`buildComponentRoutes`) monta `routes.ts` solo. **No editar `app.routes.ts`.**

### 3.3 `version-1/base/chip.ts`

Se entrega **exactamente así**: lo básico para iniciar, sin lógica.

```ts
import { Component, ViewEncapsulation } from '@angular/core';

/** <int-chip> · version 1. */
@Component({
  selector: 'int-chip',
  templateUrl: './chip.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntChip {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the progress page (Reference → Status). */
  static readonly designer = 'Christian Abanto';
}
```

- **`ViewEncapsulation.None`** es lo único fijo: el aislamiento lo da el prefijo `int-` + BEM.
- **`designer`** va siempre, justo debajo de `status`, con el nombre completo respondido en 3.0
  (`''` si no se asignó). La página **Reference → Status** lo muestra en la tabla y agrupa el avance
  por diseñador. `scripts/generate-docs.mjs` lo lee del archivo, igual que `status`.
- **`status`** va siempre, como primera línea de la clase y en **`'pending'`**: es el chip de estado
  de la página ("Pending" / "In progress" / "Done"). `scripts/generate-docs.mjs` la lee del archivo
  (no se importa nada). El tipo va escrito en línea (`'pending' | 'in-progress' | 'done'`) para que la
  base no dependa de la documentación y el editor autocomplete los valores. Después la cambia el
  maquetador (a mano, con `npm run set:status` o con la skill **`cambiar-estado`**): `in-progress` al
  empezar a maquetar, `done` al terminar esa versión.
- Sin `input()`, `computed`, tipos de variante, `host` ni imports adicionales.

Guía para el maquetador cuando implemente (patrón completo en `_demo_/version-2/base/demo.ts`):
- Variante visual como input tipado; la base no lleva modificador:
  ```ts
  export type IntChipSeverity = 'primary' | 'secondary' | 'outlined';
  readonly severity = input<IntChipSeverity>('primary');
  protected readonly classes = computed(() =>
    this.severity() === 'primary' ? 'int-chip' : `int-chip int-chip--${this.severity()}`,
  );
  ```
- Si el bloque BEM vive en el elemento raíz de la plantilla, agregar `host: { style: 'display: contents' }`.
- Booleanos como atributo (`<int-chip disabled>`): `input(false, { transform: booleanAttribute })`.
- Los estados nativos (`:disabled`, `:checked`) no son variantes de estilo: van en el módulo base.
- La base no importa nada de la documentación (`core/`, `service/`, `variants/`): así se puede extraer a npm.

### 3.4 `version-1/base/chip.html`

Se entrega **exactamente así**: la cabecera con lo respondido en 3.0 y el nombre del componente.

```html
<!--
  title: Chip
  description: Chips represent entities using icons, labels and images.
-->
int-chip
```

La cabecera se queda arriba aunque el maquetador escriba la estructura debajo.

Cuando el maquetador escriba la estructura: bloque `int-chip` en el elemento raíz y elementos
internos con nombre completo (`class="int-chip__icon"`, nunca `class="icon"`).

### 3.5 `version-1/variants/basic/` — variante inicial (siempre)

Todo componente nuevo nace con la variante `basic`, **sin preguntar si se quiere**: es la referencia
para que el maquetador vea cómo se usa el componente. Se crea con el script (requiere `base/chip.ts`),
con la descripción respondida en 3.0. No se escribe a mano ni se copia de otro componente:

```bash
npm run new:variant -- chip Basic --description "<descripción de Basic>"
```

Genera exactamente esto:

```ts
// version-1/variants/basic/example.ts
import { Component } from '@angular/core';

import { IntChip } from '../../base/chip';

@Component({
  selector: 'chip-basic-example',
  templateUrl: './example.html',
  imports: [IntChip],
})
export class ChipBasicExample {}
```

```html
<!-- version-1/variants/basic/example.html -->
<!--
  title: Basic
  description: <descripción de Basic>
-->
```

Debajo de la cabecera no hay nada: la página muestra "Preview pending" con la ruta
`version-1/variants/basic/example.html` hasta que el maquetador escriba el ejemplo (`<int-chip />`…).
Mientras tanto Angular avisa `NG8113: All imports are unused`; es esperado y desaparece al usar la base.

Si la referencia (Excel/Figma) llama distinto a la variante principal, igual se crea `basic`; las
demás se agregan como variantes adicionales.

Después pregunta: **"¿Deseas crear otra variante?"** (sí / no).
- **No** → continuar con la verificación (3.9).
- **Sí** → seguir la skill **`crear-variante`** (`.claude/skills/crear-variante/SKILL.md`). El
  componente ya se conoce: solo se preguntan el **título** y la **descripción** de la variante. Al
  terminar, repetir la pregunta.

Reglas del ejemplo (lo que se ve en la pestaña HTML / TS de la documentación es este código, tal cual):
- `example.ts` exporta **un** componente (el nombre de la clase es libre; convención `<Id><Slug>Example`).
  Importa la base con ruta relativa `../../base/<id>` y todo lo que el ejemplo use.
- Los datos de demostración viven en la clase del ejemplo (`readonly items = [...]`), no en archivos aparte.
- El HTML (debajo de la cabecera) es código que un consumidor podría copiar: sin clases de la documentación ni estilos inline. La cabecera no se muestra en la pestaña HTML.
- Un ejemplo puede mostrar varios valores juntos (sección "Severity" con los 4 botones), como PrimeNG.

### 3.6 `version-1/styles/_index.scss`

Se entrega solo con el módulo base:

```scss
// int-chip · entry point.
@use 'chip';
```

Cuando exista un módulo de modificador (3.8), se agrega su línea:

```scss
@use 'chip.outlined' as chip-outlined;
```

> ⚠️ **El `as` es obligatorio en los módulos de modificador.** Sass toma como namespace el texto
> antes del primer punto, así que `@use 'chip.outlined';` choca con `@use 'chip';`
> (`There's already a module with namespace "chip"`). Convención: `as <id>-<modificador>`.

### 3.7 `version-1/styles/_chip.scss` (base) — plantilla obligatoria

```scss
/*——————————————————————————————————————————————————————————*\
 * TOKENS
\*——————————————————————————————————————————————————————————*/

:root {
  --NOTE-CHIP: 'int-chip ( Custom )';
}

/*——————————————————————————————————————————————————————————*\
 * BLOCK ( block )
\*——————————————————————————————————————————————————————————*/

.int-chip {
}

/*——————————————————————————————————————————————————————————*\
 * ELEMENTS ( __element )
\*——————————————————————————————————————————————————————————*/

.int-chip {
}

/*——————————————————————————————————————————————————————————*\
 * MODIFIERS ( --modifier )
\*——————————————————————————————————————————————————————————*/

.int-chip {
}

/*——————————————————————————————————————————————————————————*\
 * SKELETON
\*——————————————————————————————————————————————————————————*/

.sk-chip {
}
```

- El archivo se entrega **exactamente así**: sin propiedades CSS dentro de los selectores.
- Respetar secciones, orden y comentarios.
- El token es **descriptivo** (`--NOTE-<ID-EN-MAYÚSCULAS>`), único por componente. No reemplaza tokens visuales.
- Cuando el maquetador escriba los estilos: colores, radios y tipografías salen de `src/styles.scss`
  (`--c-primary`, `--radius-sm`, `--font-sans`…), y los elementos van en ELEMENTS con `&__elemento`.

### 3.8 `version-1/styles/_chip.outlined.scss` (modificador, solo si se pidió)

```scss
/*——————————————————————————————————————————————————————————*\
 * MODIFIERS ( --modifier ) · Outlined
\*——————————————————————————————————————————————————————————*/

.int-chip--outlined {
}
```

Se entrega vacío, igual que la base. Cuando el maquetador lo complete:
- Solo lo que **cambia** respecto de la base. No repetir estilos base ni selectores vacíos.
- No redefinir `:root` ni tokens globales.
- Si el modificador afecta un elemento: `.int-chip--outlined .int-chip__icon { … }`.

### 3.9 Verificar

```bash
npm run build                                      # genera src/generated + compila TS, plantillas y SCSS
npm test -- --watch=false --browsers=ChromeHeadless
npm start                                          # /components/chip: título, descripción y "Basic" con "Preview pending"
```

Usar los scripts de `npm` (no `npx ng …` directo): antes de compilar ejecutan
`scripts/generate-docs.mjs`. Para el servidor, **`npm start`** (http://localhost:5555; otro puerto:
`npm start -- --port 4300`): además de recargar con cada edición, detecta carpetas nuevas o borradas
creadas a mano. Con `ng serve` directo las ediciones también se ven al instante, pero una carpeta creada
a mano (sin `npm run new:variant`) no aparece hasta ejecutar `npm run docs`. Si el IDE marca `src/generated/doc-registry.ts` como inexistente
(clon nuevo), ejecutar `npm run docs` una vez.

---

## 4. Agregar un ejemplo (sección de la documentación)

1. Generar la carpeta con `npm run new:variant -- <id> "<Título>" --description "<Descripción>"`
   (o con Claude: `/crear-variante`, que pregunta componente, título y descripción). Crea
   `version-N/variants/<slug>/example.ts` (importa la base correcta) + `example.html` (solo la
   cabecera). No copiar la variante de otro componente.
2. Aparece en el menú y como sección de la página, con "Preview pending" hasta que se escriba el
   ejemplo debajo de la cabecera de `example.html`.
3. Título o descripción: se cambian en la cabecera de `example.html`. Orden: opcional, en `<id>.config.ts`.

No se toca `<id>-page.ts`, `routes.ts`, `inventory.ts` ni el router global.

Si el ejemplo necesita un modificador visual nuevo (maquetador):
1. Agregar el valor al tipo del input en `base/<id>.ts` (`'primary' | 'secondary' | 'outlined'`).
2. Crear `styles/_<id>.<mod>.scss` con `.int-<id>--<mod>` y agregar `@use '<id>.<mod>' as <id>-<mod>;` en `_index.scss`.

## 5. Crear una `version-2`

1. Generarla con `npm run new:version -- <id> [--title "…"] [--description "…"]` (o con Claude:
   `/crear-version`, skill `.claude/skills/crear-version/SKILL.md`). Copia la **última** versión
   completa (`base/`, `variants/` y `styles/`) a `version-N+1/` y regenera la documentación; no se copia
   a mano. `version-N` no se borra mientras se use. El maquetador cambia lo necesario en la nueva; el
   título o la descripción de `version-N+1/base/<id>.html` mandan en el menú (versión más reciente).
2. La carpeta y sus ejemplos se detectan solos: "Version 1" pasa a ser un desplegable que abre por
   defecto la más reciente; cada versión es enlazable con `/components/<id>?version=1#<variante>`.
3. Las secciones son la unión de las carpetas `variants/<slug>/` de todas las versiones; si la
   versión elegida no tiene esa carpeta, la sección muestra "Preview pending" con la ruta a crear.
4. No confundir **versión de implementación** (carpeta `version-N`) con **variante visual**
   (ej. Tabs `V1` / `V2` del Excel, que son modificadores `.int-tabs--v2`).

---

## 6. Qué NO hacer

- ❌ Escribir CSS al crear la base (ni "valores de ejemplo" ni skeleton con estilos). Solo plantilla.
- ❌ Escribir marcado, bindings o `<ng-content>` en `base/<id>.html`. Solo la cabecera y el nombre del componente.
- ❌ Poner títulos o descripciones en `<id>.config.ts` u otro `.ts`: van en la cabecera del HTML.
- ❌ Escribir el ejemplo de `basic` al crear el componente: su `example.html` queda solo con la cabecera.
- ❌ Agregar `input()`, `computed`, tipos de variante, `host` o imports extra en `base/<id>.ts`.
- ❌ Omitir `static readonly designer` o inventar el diseñador: se pregunta (o queda `''`).
- ❌ Omitir `static readonly status`, crearla con un valor distinto de `'pending'` o cambiarla sin que el maquetador lo pida.
- ❌ Crear módulos de estilo o ejemplos que no se pidieron explícitamente (la única variante automática es `basic`).
- ❌ Preguntar si se quiere `basic`, omitirla o crearla a mano: va siempre y con `npm run new:variant`.
- ❌ Importar o registrar ejemplos a mano (en la página, en `inventory.ts`, en un mapa…).
- ❌ Editar o commitear `src/generated/` (se regenera solo).
- ❌ Copiar el componente para una variante (`button-text.ts`) o un `base/` por variante. La variante es un modificador.
- ❌ Importar desde `base/` cosas de `core/`, `service/` o `variants/`.
- ❌ Más de un componente exportado en `example.ts`, o datos de ejemplo en archivos `*.mock.ts`.
- ❌ Subcarpetas en `styles/` (`styles/button/_button.scss`).
- ❌ `.icon`, `.active`, `.primary`, `.btnPrimary`, `.int_button` en estilos propios.
- ❌ Inventar variantes que no estén en la referencia (Excel/Figma).
- ❌ `@use 'button.text';` sin `as` (rompe la compilación).
- ❌ Redefinir `:root` en los módulos de modificador.
- ❌ Registrar rutas de componentes en `app.routes.ts`.
- ❌ Nombrar carpetas distinto a `version-<número>` o a kebab-case en `variants/` (no se detectan).
- ❌ Listar en `variants` del config variantes sin carpeta para "planificarlas": no se muestran. Se crean con `npm run new:variant`.

## 7. Checklist de aceptación

- [ ] Selector y clases con `int-` + kebab-case.
- [ ] BEM: bloque, `__elemento`, `--modificador`; skeleton `.sk-<id>`.
- [ ] `version-N/` solo con `base/`, `variants/` y `styles/`.
- [ ] `base/` sin dependencias de la documentación; `styleUrl: '../styles/_index.scss'`.
- [ ] `base/<id>.ts` con `static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';` (la página muestra "Pending") y `static readonly designer = '<Nombre>';`.
- [ ] Se preguntaron título y descripción; están en la cabecera de `base/<id>.html`.
- [ ] Variante `basic` creada con `npm run new:variant` (cabecera con título y descripción, sin ejemplo); se preguntó si crear otra.
- [ ] `styles/_index.scss` solo con `@use` (modificadores con `as <id>-<mod>`, y solo los que existen).
- [ ] Módulo base de estilos con la plantilla completa (TOKENS, BLOCK, ELEMENTS, MODIFIERS, SKELETON) y **sin CSS**.
- [ ] `<id>.config.ts` sin títulos ni descripciones; importado una vez en `inventory.ts`.
- [ ] Menú y página muestran exactamente las carpetas de `variants/`; anclas `#<id>-<slug>` y pestañas HTML / TS funcionando.
- [ ] `npm run build` y `npm test` en verde.
