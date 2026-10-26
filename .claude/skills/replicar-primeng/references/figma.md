# Referencia visual de Figma

Solo aplica cuando el usuario da un link de Figma ("Copy link to selection") del componente. Figma es la
**referencia visual**; PrimeNG sigue mandando en API y comportamiento, y todo valor CSS se escribe con
tokens `--i-*` del Style Guide (SKILL.md 1.5 y 3.3).

## 1. Leer el link

| Link | fileKey | nodeId |
|---|---|---|
| `figma.com/design/:fileKey/:name?node-id=12-345` | `:fileKey` | `12:345` (`-` → `:`) |
| `figma.com/design/:fileKey/branch/:branchKey/:name?node-id=…` | `:branchKey` | igual |
| `figma.com/make/…`, `figma.com/board/…` (FigJam) | no son diseños de componente: pedir un link de `design` | — |

Sin `node-id` el link apunta al archivo entero: pedir el "Link to selection" del componente (o del
component set con todas sus variantes, mejor aún).

## 2. Consultar el MCP de Figma

Orden (lo exige el MCP):

1. `create_session` con el `fileKey` y una descripción corta ("Replicar p-chip como int-chip").
   Reutilizar el `sessionId` en las llamadas siguientes.
2. Cargar la skill `figma-design-to-code` (o, si no está instalada, el recurso
   `skill://figma/figma-design-to-code/SKILL.md` del MCP) **antes** de `get_design_context`.
3. Sobre el `nodeId`:
   - `get_screenshot`: imagen de referencia para comparar al final (fase 4).
   - `get_variable_defs`: variables de Figma aplicadas (colores, spacing, radios, tipografía).
   - `get_design_context`: medidas, estructura de capas, auto layout, estados/variantes. Su código
     (React/Tailwind) es **solo referencia**: no se copia.
   - `get_metadata` si el nodo es un component set grande, para elegir la variante a inspeccionar.

Si el MCP no está conectado o pide autorización: avisar ("el conector de Figma necesita autorización en
la configuración de conectores de claude.ai") y continuar **sin Figma**, como si no hubiera link.

## 3. Tabla visual (en el chat, antes de planificar)

Una fila por valor que se ve en el diseño. Columnas fijas:

| Elemento / estado | Propiedad | Figma (valor) | Variable de Figma | `--i-*` del Style Guide | `--int-<id>-*` |
|---|---|---|---|---|---|
| raíz | gap | 8px | `spacing/gap/sm` | `--i-spacing-gap-sm` | `--int-chip-gap` |
| raíz | background | #F2F2F5 | `color/grey/100` | `--i-color-grey-100` | `--int-chip-background` |
| quitar :hover | color | #2351B3 | — (hex suelto) | `--i-color-blue-600` (mismo valor) | `--int-chip-remove-icon-hover-color` |

Cómo resolver la columna `--i-*`:

1. **Con variable de Figma**: las variables del Style Guide se exportan de Figma (colecciones
   Foundations → Alias → Semantics → Components, ver cabecera de `_tokens.figma.scss`). El nombre se
   traduce en kebab-case con prefijo `--i-` (`spacing/gap/sm` → `--i-spacing-gap-sm`). Confirmar que existe:
   ```bash
   grep -rn -- "--i-spacing-gap-sm" C:/christian/repos/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css/tokens/
   ```
2. **Sin variable (valor suelto)**: buscar el `--i-*` con ese mismo valor, prefiriendo el alias con
   escala xs–xl (mapa, sección 3). Anotarlo en la fila: "valor suelto en Figma".
3. **Sin token con ese valor**: el más cercano y la diferencia al informe, o preguntar (SKILL.md 2.2).
   Nunca literal.

## 4. Figma contra PrimeNG

| Situación | Qué hacer |
|---|---|
| Figma y PrimeNG difieren en medidas, colores, radios, tipografía | Gana Figma (vía token) |
| Figma muestra un estado que PrimeNG también tiene (hover, focus, disabled) | Estilo de Figma, comportamiento de PrimeNG |
| PrimeNG tiene un estado que Figma no dibuja | Estilo de PrimeNG traducido a tokens; anotarlo |
| Figma muestra una variante/estado sin equivalente en la API de PrimeNG v20 | No se inventa: se pregunta si va como extensión `int-*` (input nuevo comentado `int-* extension`) |
| Figma usa otra estructura de capas (envoltorios, auto layout) | Se mantiene la estructura de elementos de PrimeNG; el auto layout se traduce a flex/gap en BEM |
| Icono distinto en Figma | `pi pi-*` o `incontrol-icons` equivalente; si no hay, preguntar |

## 5. Comentarios en `_<id>.scss`

Con Figma, el comentario del token documenta las dos fuentes:

```scss
--int-chip-gap: var(--i-spacing-gap-sm); // Figma: 8px (spacing/gap/sm) · Aura: 0.5rem
```

## 6. Validación e informe

- Comparar el resultado en `localhost:4321/components/<id>` (con el Style Guide levantado) con el
  `get_screenshot`. Si no se puede ver el navegador, decirlo: no afirmar que coincide.
- En el informe: link de Figma usado, la tabla visual final y las diferencias (valores aproximados,
  estados que Figma no mostraba, extensiones `int-*` aceptadas o descartadas).
