---
name: actualizar-replica
description: Verifica y actualiza un componente int-* (replicado de PrimeNG o maquetado desde Figma) cuando su diseño en Figma cambió. Lee el link guardado en la cabecera de version-N/base/<id>.html (figma:), compara el diseño actual con los comentarios "// Figma:" de los tokens, muestra una tabla de cambios y, solo si el usuario confirma, actualiza tokens y estilos usando tokens --i-* del Style Guide, sin tocar la API ni lo customizado a mano (salvo forzar). Úsalo cuando el usuario diga "el figma de chip cambió", "actualiza la réplica de X", "verifica chip contra Figma", "¿está al día button con el diseño?" o /actualizar-replica. Con --solo-verificar (o "solo verificar") se detiene en el informe sin cambiar nada.
argument-hint: "<componente> [--version N] [link de Figma] [--solo-verificar]"
---

# Actualizar una réplica desde Figma

Para componentes `int-*` que ya se implementaron (con `/replicar-primeng` o a mano) y cuyo diseño en
Figma cambió después. Primero **verifica** (solo lectura) y después **actualiza** lo que el usuario
apruebe. No re-replica PrimeNG: API, estructura y comportamiento se quedan como están.

Se apoya en `replicar-primeng` (no se duplica aquí):
- Lectura de Figma, tabla visual y traducción a tokens:
  [../replicar-primeng/references/figma.md](../replicar-primeng/references/figma.md).
- Regla de tokens (`--int-<id>-*: var(--i-*)`, alias con escala xs–xl, sin literales): sección 3.3 de
  [../replicar-primeng/SKILL.md](../replicar-primeng/SKILL.md) y el mapa
  [../replicar-primeng/references/primeng-v20-map.md](../replicar-primeng/references/primeng-v20-map.md).

---

## 1. Datos

Lo que no venga en el pedido se pregunta en **un solo mensaje**:

1. **Componente** (id o nombre visible) y **versión** (por defecto la más reciente). Si no existe:
   "No existe **<nombre>**; créalo con `/crear-componente`". Fin.
2. **Link de Figma**: se lee de la cabecera de `version-N/base/<id>.html` (línea `figma:`).
   - Sin línea `figma:` → pedir el "Link to selection" del componente.
   - Si el usuario da un link distinto al guardado → preguntar si reemplaza el guardado.
   - Si la cabecera tiene `figma-frame:` (frame padre con todas las variantes y formatos), se compara
     también ese frame, eje por eje (ver `replicar-primeng/references/figma.md`, sección 3).
3. **Modo**: verificar y actualizar (por defecto) o **solo verificar** (`--solo-verificar`).

Si la versión está en plantilla (sin estilos), no hay nada que actualizar: sugerir `/replicar-primeng`.

## 2. Verificar (siempre, sin escribir nada)

1. Leer el diseño actual con el MCP de Figma siguiendo `figma.md` (sesión, `get_screenshot`,
   `get_variable_defs`, `get_design_context`). Si el MCP no está disponible o pide autorización, avisar
   y parar: sin Figma no hay con qué comparar.
2. Leer lo implementado en `version-N/styles/*.scss` (TOKENS de `_<id>.scss` y módulos) y la estructura
   de `base/<id>.html`.
3. Comparar **cada valor de Figma** con su token, usando el comentario `// Figma: <valor> (<variable>)`
   como huella de lo que se aplicó la última vez. Con `figma-frame:`, el comentario lleva el eje
   (`[Size=Small]`, `[State=Hover]`) y se compara con la muestra de ese valor del eje; un eje o formato
   nuevo en el frame cuenta como 🆕 y se clasifica como en `replicar-primeng` 1.5:

| Estado | Cómo se detecta | Acción propuesta |
|---|---|---|
| ✅ Igual | Figma = comentario `// Figma:` y el token sigue apuntando al `--i-*` de esa variable | Nada |
| 🔄 Cambió en Figma | Figma ≠ comentario `// Figma:` | Nuevo `--i-*` para el valor nuevo |
| ✏️ Editado a mano | El token ya no apunta al `--i-*` que corresponde a su comentario `// Figma:` | **No tocar** salvo forzar |
| 🆕 Nuevo en Figma | Valor/estado sin token en el componente | Nuevo `--int-*` (si encaja en la API) |
| 🗑️ Ya no está en Figma | Token con comentario `// Figma:` cuyo valor desapareció del diseño | Preguntar: quitar o conservar |
| ❔ Sin huella | Token sin comentario `// Figma:` (réplica sin Figma o hecha a mano) | Comparar por valor; tratar como ✏️ si difiere |

4. Además de tokens, revisar lo que no es un valor:
   - **Estructura** (elementos nuevos o quitados, otro orden): no se aplica automáticamente; se lista.
   - **Variantes o estados nuevos** sin equivalente en la API: se lista y se pregunta si van como
     extensión `int-*` (input comentado `int-* extension`).
   - **Iconos** distintos: `pi pi-*` o `incontrol-icons` equivalente; si no hay, preguntar.

5. **Informe de verificación** en el chat:
   - Link y nodo comparados, versión del componente.
   - Tabla: elemento/estado · propiedad · antes (comentario `// Figma:`) · ahora (Figma) · token
     actual → token propuesto · estado (✅ 🔄 ✏️ 🆕 🗑️ ❔) · archivo.
   - Cambios de estructura, variantes y estados que requieren decisión.
   - Si todo es ✅: "**<componente>** está al día con Figma". Fin.

Con `--solo-verificar` termina aquí.

## 3. Confirmar

Pregunta en un solo mensaje:

> ¿Aplico los cambios 🔄 y 🆕? Los marcados ✏️ (editados a mano) no se tocan salvo que digas **forzar**.
> Decide también: <variantes/estados nuevos> · <tokens 🗑️ a quitar o conservar>.

- Sin respuesta explícita no se escribe nada.
- Si el cambio es grande (estructura distinta, muchas variantes nuevas o el usuario quiere conservar la
  versión publicada), proponer antes `/crear-version` y aplicar los cambios en `version-N+1`.

## 4. Actualizar (solo lo aprobado)

- **Tokens** (`:root` de `_<id>.scss`): cambiar el `var(--i-*)` y actualizar el comentario
  `// Figma: <valor nuevo> (<variable>) · Aura: <valor>` (el de Aura no cambia). Siempre un `--i-*`,
  preferiblemente alias con escala; sin literales. Sin token equivalente: el más cercano y anotarlo, o
  preguntar.
- **Reglas** (`_<id>.scss` y módulos): solo si un token nuevo necesita usarse o un estado nuevo lo exige.
  Solo `var(--int-<id>-*)`, BEM, sin `p-*`, `::ng-deep` ni `--doc-*`.
- **Base** (`<id>.ts` / `<id>.html`): solo si el usuario aprobó una extensión `int-*` o un cambio de
  estructura. La API de PrimeNG no se renombra ni se quita.
- **Variantes**: una variante nueva solo para una extensión aprobada, con `npm run new:variant`.
- **Cabecera**: si el usuario aprobó un link nuevo, reemplazar la línea `figma:` (o `figma-frame:`). Título, descripción,
  `status` y `designer` no se tocan.
- Lo ✏️ customizado solo se cambia con **forzar**, y forzar aplica a las filas listadas, no a todo.

## 5. Validar e informar

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
grep -rnE "^\s*--int-[a-z0-9-]+:" src/components/<id>/version-<N>/styles/ | grep -v "var(--i-"   # solo excepciones
```

- Comparar `localhost:4321/components/<id>` (con el Style Guide en `localhost:8080`) con el
  `get_screenshot` nuevo. Si no se puede ver el navegador, decirlo.
- Informe: filas aplicadas, filas no aplicadas (✏️ sin forzar, decisiones pendientes), archivos
  modificados, resultado real de build y tests, diferencias que quedan con Figma.
- No se cambia `status`; si correspondía, sugerir `/cambiar-estado`.

## 6. Qué NO hacer

- ❌ Escribir algo durante la verificación o con `--solo-verificar`.
- ❌ Aplicar cambios sin confirmación, o tocar lo ✏️ editado a mano sin **forzar**.
- ❌ Copiar valores de Figma como literales o el código de `get_design_context`.
- ❌ Cambiar API, nombres de inputs/outputs, teclado o ARIA por un cambio visual.
- ❌ Borrar o renombrar variantes, estilos o versiones existentes.
- ❌ Cambiar título, descripción, `status` o `designer` de la cabecera/base.
- ❌ Dejar un token actualizado sin su comentario `// Figma:` al día.
- ❌ Afirmar que coincide con Figma sin haberlo comparado.
