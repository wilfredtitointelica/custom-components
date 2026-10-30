# Guía visual de Figma

Solo aplica cuando el usuario da un link de Figma ("Copy link to selection") del componente. Figma es
la **cuarta fuente** (SKILL.md "Orden de prioridad"): una guía visual para comparar, **no** la fuente de
verdad. PrimeNG manda en API y comportamiento; la base de conocimientos (Intelica.knowledgeBase, casos `.pr`) en variantes,
casos de uso y estilos; el Style Guide en el CSS de esos casos, tokens y helpers. Figma no crea
variantes ni fija valores: lo que difiere se reporta.

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

| Eje / formato | Valores en Figma | Existe en | Qué se hace |
|---|---|---|---|
| Size | XSmall, Small, Medium, Large | input `size` de PrimeNG | se implementa según PrimeNG + base de conocimientos (Intelica.knowledgeBase); Figma solo para comparar |
| State | Default, Hover, Pressed, Disabled | estados de PrimeNG | módulo base; Figma solo para comparar |
| Tipo | Minimal | Base de conocimientos (Intelica.knowledgeBase) `.prSelect--minimal` | variante `minimal` según la base de conocimientos (Intelica.knowledgeBase) |
| Color | 5 paletas × 3 tonos | solo Figma | no se implementa → "Solo en Figma" |
| Formato | Option large card | solo Figma | no se implementa → "Solo en Figma" |

   Reglas (no se pregunta nada de esta tabla):
   - Existe en PrimeNG v20 o en la base de conocimientos (Intelica.knowledgeBase) → se implementa con lo que digan esas fuentes; Figma sirve para
     revisar el resultado.
   - Es un pseudo-estado (hover, pressed = `:active`, focus, disabled) → CSS en el módulo base, con los
     valores de la base de conocimientos (Intelica.knowledgeBase) o Style Guide.
   - Solo en Figma → no se implementa ni se inventa una extensión: va a "Solo en Figma" del informe,
     para que el equipo decida si se documenta en la base de conocimientos (Intelica.knowledgeBase).
5. **Guardar el frame** en la cabecera de `version-N/base/<id>.html`, en la línea `figma-frame:` debajo
   de `figma:` (link del frame con su `node-id`). `figma:` sigue siendo el link que dio el usuario.
   `/sincronizar-componente` recorre el frame para detectar ejes o formatos nuevos.

## 4. Tabla visual (en el chat, antes de planificar)

Se arma con la muestra base (el link) y, por cada valor de eje, **solo lo que cambia** respecto de ella
(columna "Elemento / estado" con el eje: `raíz [Size=Small]`).

Una fila por valor que se ve en el diseño. El token implementado sale de la base de conocimientos (Intelica.knowledgeBase) / Style Guide; Figma solo
se compara. Columnas fijas:

| Elemento / estado | Propiedad | Figma (valor) | Variable de Figma | `--i-*` de Figma | `--i-*` implementado (base de conocimientos (Intelica.knowledgeBase) o Style Guide) | `--int-<id>-*` | |
|---|---|---|---|---|---|---|---|
| raíz | gap | 4px | `spacing/gap/xs` | `--i-spacing-gap-xs` | `--i-spacing-gap-xs` (base de conocimientos (Intelica.knowledgeBase)) | `--int-chip-gap` | ✅ |
| raíz | background | #F2F2F5 | `color/grey/100` | `--i-color-grey-100` | `--i-color-primary-100` (base de conocimientos (Intelica.knowledgeBase)) | `--int-chip-background` | ⚠️ difiere |
| quitar :hover | color | #2351B3 | — (hex suelto) | `--i-color-blue-600` (mismo valor) | — (sin caso en base de conocimientos (Intelica.knowledgeBase) o Style Guide: Aura traducido) | `--int-chip-remove-icon-hover-color` | ⚠️ |

Las filas ⚠️ van a "Diferencias con Figma" del informe; el valor implementado no cambia.

Cómo resolver la columna "`--i-*` de Figma" (para comparar):

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

## 5. Figma contra las demás fuentes

| Situación | Qué hacer |
|---|---|
| Figma difiere de la base de conocimientos (Intelica.knowledgeBase) / Style Guide en medidas, colores, radios, tipografía | Gana la base de conocimientos (Intelica.knowledgeBase) / Style Guide; ⚠️ en la tabla y "Diferencias con Figma" |
| Figma difiere de PrimeNG y la base de conocimientos (Intelica.knowledgeBase) no dice nada | Gana el SCSS `.pr*` del Style Guide o, sin él, PrimeNG traducido a tokens; se reporta |
| Figma muestra un estado que PrimeNG también tiene (hover, focus, disabled) | Estilo de la base de conocimientos (Intelica.knowledgeBase) o Style Guide, comportamiento de PrimeNG; Figma para comparar |
| PrimeNG tiene un estado que Figma no dibuja | Se implementa igual (base de conocimientos (Intelica.knowledgeBase) o Style Guide o Aura traducido) |
| Figma muestra una variante/estado que no está en PrimeNG ni en la base de conocimientos (Intelica.knowledgeBase) | No se implementa: "Solo en Figma" |
| Figma usa otra estructura de capas (envoltorios, auto layout) | Se mantiene la estructura de PrimeNG |
| Icono distinto en Figma | El de PrimeNG o base de conocimientos (Intelica.knowledgeBase, `pi pi-*` o `incontrol-icons`); la diferencia se reporta |
| Figma muestra contenido dentro de un template (fila de `#item`, cuerpo de dialog) | Si la base de conocimientos (Intelica.knowledgeBase) tiene la maqueta, se usa la base de conocimientos (Intelica.knowledgeBase); si no, Figma orienta los helpers `.u-*` del `example.html` de una variante ya decidida ([helpers.md](helpers.md) 1b). Nunca clases del Style Guide como `.prCard` |

## 6. Comentarios en `_<id>.scss`

Con Figma, el comentario del token documenta las fuentes: primero de dónde sale el token (`knowledgeBase` o `SG`),
luego lo que muestra Figma y el original de Aura. Si el valor de Figma sale de un eje, lleva el eje
entre corchetes:

```scss
--int-chip-gap: var(--i-spacing-gap-xs); // knowledgeBase: --i-spacing-gap-xs · Figma: 4px (spacing/gap/xs) · Aura: 0.5rem
--int-chip-background: var(--i-color-primary-100); // knowledgeBase: --i-color-primary-100 · Figma: #F2F2F5 (color/grey/100) ⚠️ · Aura: {surface.100}
```

`/sincronizar-componente` compara contra el valor `Figma:` para detectar cambios en el diseño.

## 7. Validación e informe

- Comparar el resultado en `localhost:4321/components/<id>` (con el Style Guide levantado) con el
  `get_screenshot`. Si no se puede ver el navegador, decirlo: no afirmar que coincide.
- Comparar también cada valor de eje y formato implementado con su muestra del frame.
- En el informe: link de Figma y frame usados, la tabla de ejes/formatos cruzada con PrimeNG o base de conocimientos (Intelica.knowledgeBase), la
  lista "Solo en Figma", la tabla visual final con ✅/⚠️ y las diferencias con Figma.
