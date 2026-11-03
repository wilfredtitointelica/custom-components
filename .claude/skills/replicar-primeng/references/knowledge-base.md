# Base de conocimientos (Intelica.knowledgeBase): casos `.pr`

La base de conocimientos (Intelica.knowledgeBase) es la **fuente de las composiciones (casos de uso) y
las maquetas HTML** de cada componente PrimeNG customizado: documenta PrimeNG y **combinaciones** de su
API, así que cada caso es por defecto una composición (`compositions/<slug>/`), salvo los **candidatos a
propiedad** (sección 2b), que agregan un input. Sus casos `.pr*` son la referencia autoritativa de
implementación y estilos (prioridad 2, detrás de PrimeNG; SKILL.md "Orden de prioridad").

## 1. Dónde leer

| Fuente | Cuándo |
|---|---|
| MCP `knowledgeBaseMcp` (si está conectado) | Primera opción: `list_directory` con `Desarrollo/Estandares/Diseño/components` y `read_note` con `Desarrollo/Estandares/Diseño/components/<nombre>.md` (`search_notes` si el nombre no es obvio) |
| Repo local `C:\christian\repos\Intelica.knowledgeBase` | Si el MCP no conecta o tarda: se lee igual, sin preguntar. Avisar en el informe qué fuente se usó |

```bash
KNOWLEDGE_BASE=C:/christian/repos/Intelica.knowledgeBase/Desarrollo/Estandares/Diseño
ls $KNOWLEDGE_BASE/components/                         # un .md por componente PrimeNG customizado
cat $KNOWLEDGE_BASE/components/<nombre>.md              # select.md, chip.md, toggleswitch.md…
```

Nombre del archivo = nombre de PrimeNG sin `p-` (`p-select` → `select.md`, `p-toggleswitch` →
`toggleswitch.md`). Si hay dos (`confirm-dialog.md` y `confirmdialog.md`), se leen los dos y se
reporta si se contradicen.

### Qué se lee y qué se ignora

| Se lee | Se ignora |
|---|---|
| `components/<nombre>.md`: secciones con la clase raíz `.pr<Nombre>`, sus tokens, estilos base, estados, modificadores `.pr<Nombre>--*`, paneles (`.pr<Nombre>Panel*`), HTML de uso, props frecuentes y notas | Casos `.pt*`, `.ly*`, `.gr*`, `row`/`col-*` (aunque aparezcan en el mismo archivo) |
| Referencias cruzadas a otro `components/<otro>.md` **solo** si describen otro caso `.pr` que este compone | `patterns/`, `patterns.md`, `guardrails.md`, `base.md`, `tokens.md`, `utilities.md` y cualquier otro archivo |

Para tokens y helpers no se usa la base de conocimientos (Intelica.knowledgeBase): se verifican en el Style Guide (prioridad 3).

## 1b. Conceptos equivocados: reparto de casos entre componentes

Algunos archivos de la base de conocimientos agrupan bajo un nombre casos que en PrimeNG son componentes
distintos. Gana el concepto de PrimeNG: cada caso se construye en su componente, aunque esté documentado
en otro archivo. Al replicar, estandarizar o sincronizar uno de estos componentes se leen **todos** los
archivos de su fila y se toman solo los casos que le tocan.

**Badge.** `badge.md` abarca visualmente badges, tags y chips. En PrimeNG un badge **indica una cantidad**
(notificaciones, contador); una etiqueta de estado es un tag y un elemento que se quita es un chip.

| Caso | Archivos de la KB | Componente | Cómo |
|---|---|---|---|
| Valor numérico / contador; `p-overlaybadge` sobre botón o icono | `badge.md` (secciones "Badge sobre botón", tamaños) | `int-badge` | API de `p-badge` / `p-overlaybadge`; severidades de `.prBadge` solo para el contador |
| Etiqueta de estado con texto (+ icono de 12px): Info, Success, Warning, Danger, Default, Caution (`prBadge--yellow`), Disabled (`prBadge--disabled`); badge en celda de tabla | `badge.md` (estados, "Variante con ícono", "Uso sin ícono", "Badge en celda de tabla") + `tag.md` | `int-tag` | API de `p-tag` (`value`, `severity`, `icon`); Caution y Disabled son valores de `severity` o candidatos a propiedad (2b); la celda de tabla es una composición |
| Badge "con X" / filtro aplicado (`.prPillTag` sobre `p-tag`) | `badge.md` ("Regla de identificación") + `pills.md` + `chip.md` | `int-chip` | API de `p-chip` (`removable`, `onRemove`); el filtro aplicado es una composición |

- Los estilos `.prBadge*` y `.prPillTag` se leen como referencia visual del caso y se traducen a los
  tokens del componente destino (`--int-tag-*`, `--int-chip-*`), con `// knowledgeBase: badge.md · <token>`.
- La nota de `badge.md` "`p-chip` no existe en el DS — no usar" no aplica en este repo.
- `int-pill` no recibe casos de `badge.md` ni de `pills.md`. La forma "pill" es el input `rounded` de
  `p-tag`: va en `int-tag` como propiedad `rounded` (+ variante), no como componente aparte. Qué pasa con
  `int-pill` está por decidir.
- En la tabla de la fase 1 (sección 2), los casos que se van a otro componente se listan con su destino
  ("→ `int-tag`") y no se implementan en el componente que se está replicando.

## 2. Qué extraer (tabla en el chat, en la fase 1)

| Sección de la base de conocimientos (Intelica.knowledgeBase) | Qué es | Destino en `int-<id>` |
|---|---|---|
| Clase raíz `.prChip` | estilos del DS sobre `<p-chip>` | el bloque `int-chip` ya los lleva: la base **es** el caso `.pr`; el consumidor no agrega clase |
| Variables CSS / Estilos base (`gap`, `padding`, `color`…) | valores del caso base | `--int-<id>-*: var(--i-*)` con el token que indica la base de conocimientos (Intelica.knowledgeBase); comentario `// knowledgeBase: <token> · Aura: <valor>` |
| Estados (`:hover`, `:focus-visible`, `[aria-expanded]`…) | estilos de estado | módulo base `_<id>.scss` |
| Modificadores `.prSelect--minimal` | caso visual | composición `minimal` con la API existente; solo si es **candidato a propiedad** (2b): `.int-select--minimal` en `_select.minimal.scss`, activado por un input (2b) + variante que lo muestra aislado |
| Paneles / overlays (`panelStyleClass="prSelectPanelExport"`) | estilos del overlay de un caso | mismo input de PrimeNG (`panelStyleClass`) + clase `int-select-panel--export` en el módulo del grupo |
| Bloque **HTML** de uso | maqueta del caso | `example.html` de la composición: `p-<x>` → `int-<x>`, sin la clase `.pr*` (ya es la base), modificador traducido y contenido de templates con helpers `.u-*` (SKILL.md 3.5) |
| Bloque **TS** (opciones, handlers) | datos y lógica de la demo | `example.ts` de la composición (constante tipada, `signal()` si cambia) |
| Props frecuentes | inputs habituales en el proyecto | se muestran en las composiciones; **no** cambian los defaults de PrimeNG |
| Reglas ("`appendTo="body"` obligatorio") | restricciones de uso | se aplican en el `example.html` y se citan en la descripción de la composición |
| **Adaptaciones** (JS/CSS que cambia el comportamiento natural de PrimeNG: la opción *All* fija en un select, iconos de orden propios en una tabla…) | lo que el proyecto necesitó y PrimeNG no daba | se implementa **de forma nativa** en el componente como extensión `/** int-* extension */` (input, template o lógica en la base), sin copiar el parche. Ver sección 4 |
| Notas | límites de lo documentado | "Diferencias" / "Limitaciones" del informe |

## 2b. Candidatos a propiedad y cómo se activan (columna "Activación" de la tabla)

Por defecto un modificador `.pr<Nombre>--*` **no agrega API**: es una composición. Es **candidato a
propiedad** solo si cumple las tres (SKILL.md 2.4): cambia el **contenedor** (borde, sombra, fondo,
padding, radio, densidad), **ningún input existente** ni combinación lo logra, y es **reutilizable**
fuera de ese caso. Con duda en la tercera, se pregunta. Para cada candidato, la activación:

| Si el modificador… | Se activa con | Ejemplo |
|---|---|---|
| Lo que lo distingue es el **contenido** (KPI, fila de métricas, badge) o se logra combinando inputs que ya existen | **nada en la API**: es una **composición** en `compositions/<slug>/` (skill `crear-composicion`, tab Compositions) | `.prCard--data` → `<int-card flat>` + helpers; `mini`/`version` → `<int-card compact selectable>` |
| Corresponde a un input de PrimeNG (`severity`, `variant`, `size`, `raised`…) | ese input, con sus valores | `.prButton--outlined` → `variant="outlined"` |
| Cambia el **contenedor** y se **excluye** con otros (no tiene sentido llevar dos a la vez) | un valor de **un** input tipado `appearance` (tipo exportado `Int<Id>Appearance`) | `.prMessage--inline`, `--banner` → `appearance="inline" \| "banner"` |
| Se **suma** a cualquier otro (densidad, borde, fondo) | un booleano con `booleanAttribute` | `.prCard--compact`, `--outlined`, `--noBg`, `--group` → `compact`, `outlined`, `flat`, `tinted` |
| Tiene una escala de valores (gap, tamaño) | un input tipado con esos valores | `content-gap-small/medium/large` → `contentGap="small"` |

- Duda sobre si dos se excluyen: mira si la base de conocimientos, el SCSS `.pr*` o Figma los muestra
  juntos alguna vez. Si nunca aparecen juntos y pisan las mismas propiedades (borde, padding, sombra),
  se excluyen.
- Nunca un booleano estético con nombre de dato (`data`, `group`, `items`, `list`): parece pedir un array.
- La clase CSS sigue el valor (`.int-message--banner`); solo cambia cómo se activa:
  `'[class.int-message--banner]': "appearance() === 'banner'"` en el `host`.

## 3. Composiciones (y variantes) que salen de la base de conocimientos (Intelica.knowledgeBase)

- Cada **modificador**, cada **caso con título propio** (p. ej. "Variante Export", card KPI) y cada
  **vista alternativa** con contenido distinto en los templates (`#item` con avatar, `#selectedItem` con
  bandera…) → una **composición** (`compositions/<slug>/`, tab Compositions, skill `crear-composicion`),
  maquetada con la API + helpers `.u-*`.
- Solo un **candidato a propiedad** aprobado (2b) agrega además un input y **una variante** que muestra
  ese input aislado (`variants/<slug>/`, tab Variants). El caso completo sigue siendo composición.
- Si el caso necesita un input o un comportamiento que PrimeNG no tiene y la base de conocimientos lo
  resolvió con una **adaptación**, se implementa como extensión `int-*` sin preguntar (sección 4). Solo
  se pregunta (SKILL.md 2.2) si no queda claro qué hace la adaptación o si contradice otra.
- Lo que solo aparece en Figma y no en la base de conocimientos (Intelica.knowledgeBase) **no** genera variante ni composición: va a "Solo en Figma" del informe.

## 4. Conflictos

| Situación | Gana |
|---|---|
| Base de conocimientos (Intelica.knowledgeBase) y PrimeNG difieren en API o estructura (nombres de inputs, elementos, orden) | PrimeNG (la base de conocimientos se adapta y se anota) |
| La base de conocimientos documenta una **adaptación** del comportamiento de PrimeNG (la opción *All* que no quedaba fija, iconos de orden que PrimeNG no deja cambiar) | La base de conocimientos: el comportamiento adaptado es el deseado. Se implementa nativo como extensión `int-*`, conservando los nombres de PrimeNG en todo lo demás, y se anota en "Extensiones" del informe |
| Base de conocimientos (Intelica.knowledgeBase) y PrimeNG/Aura difieren en un valor visual | Base de conocimientos (Intelica.knowledgeBase, vía su token `--i-*`) |
| Base de conocimientos (Intelica.knowledgeBase) y el SCSS del Style Guide (`.pr*`) difieren | base de conocimientos (Intelica.knowledgeBase); la diferencia va al informe para corregir una de las dos fuentes |
| La base de conocimientos (Intelica.knowledgeBase) no documenta algo (un estado, un elemento) | SCSS `.pr*` del Style Guide; si tampoco, PrimeNG traducido a tokens (SKILL.md 3.3) |
| La base de conocimientos (Intelica.knowledgeBase) y Figma difieren | base de conocimientos (Intelica.knowledgeBase); Figma va a "Diferencias con Figma" |
| No existe `components/<nombre>.md` | Se continúa con Style Guide + PrimeNG y se reporta "sin caso `.pr` en la base de conocimientos (Intelica.knowledgeBase)" |

## 5. Style Guide: el CSS real de los casos `.pr`

Para reproducir lo que la base de conocimientos (Intelica.knowledgeBase) describe, leer el SCSS del caso (prioridad 3):

```bash
SG=C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css
ls $SG/components/<nombre>/            # _index.scss + _<nombre>.scss
```

Las reglas `.pr<Nombre> .p-<x>-<parte>` se traducen a BEM (`.int-<x>__<parte>`) con los mismos `--i-*`.
Se lee y se traduce; **nunca** se copia el selector `.pr*` ni se aplica la clase en el código.
