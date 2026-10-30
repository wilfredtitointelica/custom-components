# Base de conocimientos (Intelica.knowledgeBase): casos `.pr`

La base de conocimientos (Intelica.knowledgeBase) es la **fuente de las variantes, los casos de uso y las maquetas
HTML** de cada componente PrimeNG customizado. Sus casos `.pr*` son la referencia autoritativa de
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

## 2. Qué extraer (tabla en el chat, en la fase 1)

| Sección de la base de conocimientos (Intelica.knowledgeBase) | Qué es | Destino en `int-<id>` |
|---|---|---|
| Clase raíz `.prChip` | estilos del DS sobre `<p-chip>` | el bloque `int-chip` ya los lleva: la base **es** el caso `.pr`; el consumidor no agrega clase |
| Variables CSS / Estilos base (`gap`, `padding`, `color`…) | valores del caso base | `--int-<id>-*: var(--i-*)` con el token que indica la base de conocimientos (Intelica.knowledgeBase); comentario `// knowledgeBase: <token> · Aura: <valor>` |
| Estados (`:hover`, `:focus-visible`, `[aria-expanded]`…) | estilos de estado | módulo base `_<id>.scss` |
| Modificadores `.prSelect--minimal` | variante visual | `.int-select--minimal` en `_select.minimal.scss` + variante `minimal`; el consumidor la activa con `class="int-select--minimal"` (sin inputs nuevos) |
| Paneles / overlays (`panelStyleClass="prSelectPanelExport"`) | estilos del overlay de un caso | mismo input de PrimeNG (`panelStyleClass`) + clase `int-select-panel--export` en el módulo del grupo |
| Bloque **HTML** de uso | maqueta del caso | `example.html` de la variante: `p-<x>` → `int-<x>`, sin la clase `.pr*` (ya es la base), modificador traducido y contenido de templates con helpers `.u-*` (SKILL.md 3.5) |
| Bloque **TS** (opciones, handlers) | datos y lógica de la demo | `example.ts` de la variante (constante tipada, `signal()` si cambia) |
| Props frecuentes | inputs habituales en el proyecto | se muestran en las variantes; **no** cambian los defaults de PrimeNG |
| Reglas ("`appendTo="body"` obligatorio") | restricciones de uso | se aplican en el `example.html` y se citan en la descripción de la variante |
| Notas | límites de lo documentado | "Diferencias" / "Limitaciones" del informe |

## 3. Variantes que salen de la base de conocimientos (Intelica.knowledgeBase)

- Cada **modificador** y cada **caso con título propio** (p. ej. "Variante Export") → una variante.
- Cada **vista alternativa** que la base de conocimientos (Intelica.knowledgeBase) muestra con contenido distinto en los templates (`#item` con
  avatar, `#selectedItem` con bandera…) → una variante de composición, maquetada con helpers `.u-*`.
- Si el caso no puede hacerse con la API de PrimeNG (necesita un input o un comportamiento que PrimeNG
  no tiene), se pregunta (SKILL.md 2.2): extensión `int-*` comentada o se omite.
- Lo que solo aparece en Figma y no en la base de conocimientos (Intelica.knowledgeBase) **no** genera variante: va a "Solo en Figma" del informe.

## 4. Conflictos

| Situación | Gana |
|---|---|
| Base de conocimientos (Intelica.knowledgeBase) y PrimeNG difieren en API, estructura o comportamiento | PrimeNG (la base de conocimientos (Intelica.knowledgeBase) se adapta y se anota) |
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
