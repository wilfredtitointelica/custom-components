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

El link casi siempre apunta al **primer diseño** (p. ej. "XSmall" o "Default"), pero el frame que lo
contiene suele tener más: otros tamaños, estados, colores y formatos. Por eso nunca se lee solo el nodo
del link: se recorre su frame padre (sección 3).

## 2. Consultar el MCP de Figma

Orden (lo exige el MCP):

1. `create_session` con el `fileKey` y una descripción corta ("Replicar p-chip como int-chip").
   Reutilizar el `sessionId` en las llamadas siguientes.
2. Cargar la skill `figma-design-to-code` (o, si no está instalada, el recurso
   `skill://figma/figma-design-to-code/SKILL.md` del MCP) **antes** de `get_design_context`.
3. `get_metadata` del `nodeId` **y de su padre** (sección 3) para conocer el frame completo.
4. Sobre el frame y sobre **una muestra por cada valor de eje y por cada formato** (no cada
   combinación: 4 tamaños × 4 estados son 8 muestras, no 16):
   - `get_screenshot`: del frame completo (referencia para la fase 4) y de cada muestra.
   - `get_variable_defs`: variables de Figma aplicadas (colores, spacing, radios, tipografía).
   - `get_design_context`: medidas, estructura de capas, auto layout. Su código (React/Tailwind) es
     **solo referencia**: no se copia.

Si el MCP no está conectado o pide autorización: avisar ("el conector de Figma necesita autorización en
la configuración de conectores de claude.ai") y continuar **sin Figma**, como si no hubiera link.

## 3. Recorrer el frame: ejes y formatos

1. **Subir al padre**: con `get_metadata` del nodo del link, identificar su contenedor: el *component
   set* (si el nodo es una variante o una instancia de una) o, si no hay, la *section/frame* de la página
   del componente (la que tiene el título "Card", "Data Card"…). Ese contenedor es el **frame**.
2. **Ejes de variante** (mismo bloque, distinto valor):
   - Con component set: sus propiedades (`Size=Small, State=Hover`).
   - Sin component set: las etiquetas de fila/columna del frame (XSmall · Small · Medium · Large;
     Default · Hover · Pressed · Disabled) y las columnas de color de una grilla.
3. **Formatos** (otro bloque o composición): grupos con título propio dentro del frame, como
   "Data card group", "Data card chart", "Option large card".
4. **Clasificar** cada eje y formato y mostrar la tabla en el chat, **antes** de la tabla visual:

| Eje / formato | Valores en Figma | Clasificación | Destino en el componente |
|---|---|---|---|
| Size | XSmall, Small, Medium, Large | input `size` de PrimeNG | `_<id>.size.scss` + variante `sizes` |
| State | Default, Hover, Pressed, Disabled | estado CSS + input `disabled` | módulo base (`:hover`, `:active`, `--disabled`) + variante `disabled` |
| Color | 5 paletas × 3 tonos | sin equivalente en PrimeNG | ❓ extensión `int-*` (`severity`/`color`) u omitir |
| Formato | Data card group | composición del mismo bloque | ❓ variante `group` con varios `<int-<id>>` / componente aparte |
| Formato | Option large card | otra presentación del bloque | ❓ modificador `--large` (extensión) / componente aparte |

   Reglas (las seguras no se preguntan):
   - Coincide con un input de PrimeNG v20 → se implementa con ese input.
   - Es un pseudo-estado (hover, pressed = `:active`, focus, disabled) → CSS en el módulo base; disabled
     también por su input si PrimeNG lo tiene.
   - No existe en PrimeNG → **❓**: extensión `int-*` (input comentado `/** int-* extension: … */`) u omitir.
   - Formato que es otro bloque o una composición → **❓**: variante de composición (solo marcado en el
     `example.html`, sin cambiar la base), modificador (extensión) o **componente aparte** (se sugiere
     `/crear-componente` y queda en "Pendientes" del informe; si el actual lo compone, ver SKILL.md 1.6).
   - Todas las ❓ van en **un solo mensaje** junto con las demás preguntas de SKILL.md 2.2.
5. **Guardar el frame** en la cabecera de `version-N/base/<id>.html`, en la línea `figma-frame:` debajo
   de `figma:` (link del frame con su `node-id`). `figma:` sigue siendo el link que dio el usuario.
   `/actualizar-replica` recorre el frame para detectar ejes o formatos nuevos.

## 4. Tabla visual (en el chat, antes de planificar)

Se arma con la muestra base (el link) y, por cada valor de eje, **solo lo que cambia** respecto de ella
(columna "Elemento / estado" con el eje: `raíz [Size=Small]`).

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

## 5. Figma contra PrimeNG

| Situación | Qué hacer |
|---|---|
| Figma y PrimeNG difieren en medidas, colores, radios, tipografía | Gana Figma (vía token) |
| Figma muestra un estado que PrimeNG también tiene (hover, focus, disabled) | Estilo de Figma, comportamiento de PrimeNG |
| PrimeNG tiene un estado que Figma no dibuja | Estilo de PrimeNG traducido a tokens; anotarlo |
| Figma muestra una variante/estado sin equivalente en la API de PrimeNG v20 | No se inventa: se pregunta si va como extensión `int-*` (input nuevo comentado `int-* extension`) |
| Figma usa otra estructura de capas (envoltorios, auto layout) | Se mantiene la estructura de elementos de PrimeNG; el auto layout se traduce a flex/gap en BEM |
| Icono distinto en Figma | `pi pi-*` o `incontrol-icons` equivalente; si no hay, preguntar |

## 6. Comentarios en `_<id>.scss`

Con Figma, el comentario del token documenta las dos fuentes; si el valor sale de un eje (no de la
muestra base), lleva el eje entre corchetes:

```scss
--int-chip-gap: var(--i-spacing-gap-sm); // Figma: 8px (spacing/gap/sm) · Aura: 0.5rem
--int-card-padding-sm: var(--i-spacing-container-sm); // Figma: 12px (spacing/container/sm) [Size=Small] · Aura: —
```

## 7. Validación e informe

- Comparar el resultado en `localhost:4321/components/<id>` (con el Style Guide levantado) con el
  `get_screenshot`. Si no se puede ver el navegador, decirlo: no afirmar que coincide.
- Comparar también cada valor de eje y formato implementado con su muestra del frame.
- En el informe: link de Figma y frame usados, la tabla de ejes/formatos con lo decidido, la tabla
  visual final y las diferencias (valores aproximados,
  estados que Figma no mostraba, extensiones `int-*` aceptadas o descartadas).
