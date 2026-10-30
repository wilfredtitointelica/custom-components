---
name: sincronizar-componente
description: Sincroniza (verifica y actualiza) un componente int-* estándar (hecho con replicar-primeng o estandarizar-componente; si no pasa npm run check:component, sugiere estandarizar-componente y para) cuando cambió su diseño, en la base de conocimientos (Intelica.knowledgeBase) o en Figma. Lee el caso .pr actual y el link guardado en la cabecera de version-N/base/<id>.html (figma:), compara con los comentarios de origen de los tokens ("// knowledgeBase:", "// SG:", "// Figma:") y muestra un informe agrupado por estado. Respeta el orden de prioridad de replicar-primeng (PrimeNG → base de conocimientos (Intelica.knowledgeBase) .pr → Style Guide → Figma). Figma es solo una guía visual: un cambio en Figma no modifica un token que viene de la base de conocimientos (Intelica.knowledgeBase) o del Style Guide; se reporta como diferencia para que el equipo actualice la base de conocimientos (Intelica.knowledgeBase). Solo aplica cambios de Figma a tokens sin respaldo en la base de conocimientos (Intelica.knowledgeBase) o Style Guide, a los comentarios "// Figma:" y a la cabecera, siempre con confirmación y sin tocar la API ni lo customizado a mano (salvo forzar). Úsalo cuando el usuario diga "sincroniza chip con el diseño", "el figma de chip cambió", "actualiza la réplica de X", "verifica chip contra Figma", "¿está al día button con el diseño?" o /sincronizar-componente. Con --solo-verificar (o "solo verificar") se detiene en el informe sin cambiar nada.
argument-hint: "<componente> [--version N] [link de Figma] [--solo-verificar]"
---

# Sincronizar un componente con su diseño

Para componentes `int-*` estándar (hechos con `/replicar-primeng` o `/estandarizar-componente`) cuyo
diseño cambió después, en la base de conocimientos (Intelica.knowledgeBase) o en Figma. Primero
**verifica** (solo lectura) y después **actualiza** lo que el usuario apruebe. No re-replica PrimeNG:
API, estructura y comportamiento se quedan como están.

> 🧭 **Figma no es la fuente de verdad.** Rige el orden de prioridad de `replicar-primeng`
> (sección "Orden de prioridad de fuentes"): 1) PrimeNG, 2) base de conocimientos (Intelica.knowledgeBase, casos `.pr`),
> 3) Style Guide, 4) Figma. Un cambio en Figma **no** sobrescribe un token que sale de la base de conocimientos (Intelica.knowledgeBase, `// knowledgeBase:`)
> o del Style Guide (`// SG:`): se reporta como diferencia para que el equipo actualice la base de conocimientos (Intelica.knowledgeBase), y se
> vuelve a ejecutar esta skill cuando la base de conocimientos (Intelica.knowledgeBase) cambie. Tampoco crea variantes ni extensiones.

Se apoya en `replicar-primeng` (no se duplica aquí):
- Orden de prioridad y lectura de la base de conocimientos (Intelica.knowledgeBase):
  [../replicar-primeng/references/knowledge-base.md](../replicar-primeng/references/knowledge-base.md).
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
   - Sin línea `figma:` → pedir el "Link to selection" del componente. Si no hay link, se sincroniza
     solo con la base de conocimientos (Intelica.knowledgeBase) y se dice en el informe.
   - Si el usuario da un link distinto al guardado → preguntar si reemplaza el guardado.
   - Si la cabecera tiene `figma-frame:` (frame padre con todas las variantes y formatos), se compara
     también ese frame, eje por eje (ver `replicar-primeng/references/figma.md`, sección 3).
3. **Modo**: verificar y actualizar (por defecto) o **solo verificar** (`--solo-verificar`).

Si la versión está en plantilla (sin estilos), no hay nada que actualizar: sugerir `/replicar-primeng`.

**Requiere un componente estándar** (hecho con `/replicar-primeng` o `/estandarizar-componente`). Antes de
comparar, `npm run check:component -- <id> --version <N>`. Si da errores (❌), el componente no tiene las
huellas que esta skill necesita (tokens con comentario de origen, BEM, cabecera), normalmente porque se
hizo fuera del repo: sugerir `/estandarizar-componente <id>` y parar.

## 2. Verificar (siempre, sin escribir nada)

1. Leer el diseño actual con el MCP de Figma siguiendo `figma.md` (sesión, `get_screenshot`,
   `get_variable_defs`, `get_design_context`). Si el MCP no está disponible o pide autorización,
   avisar y seguir solo con la base de conocimientos (Intelica.knowledgeBase): los estados de Figma
   (🔄 🆕 🗑️) quedan sin verificar y así se indica en el informe.
2. Leer lo implementado en `version-N/styles/*.scss` (TOKENS de `_<id>.scss` y módulos) y la estructura
   de `base/<id>.html`.
3. Leer el caso `.pr` actual de la base de conocimientos (Intelica.knowledgeBase, `Desarrollo/Estandares/Diseño/components/<nombre>.md`,
   con el MCP `knowledgeBaseMcp` o el repo local, ver `knowledge-base.md`) y su SCSS en el Style Guide:
   la base de conocimientos (Intelica.knowledgeBase) puede haber cambiado desde la réplica, y eso **sí** se aplica (estado 📘).
4. Comparar **cada valor de Figma** con su token, usando el comentario `// Figma: <valor> (<variable>)`
   como huella de lo que se vio la última vez, y el origen del token (`// knowledgeBase:`, `// SG:` o sin origen).
   Con `figma-frame:`, el comentario lleva el eje (`[Size=Small]`, `[State=Hover]`) y se compara con la
   muestra de ese valor del eje:

| Estado | Cómo se detecta | Acción propuesta |
|---|---|---|
| ✅ Igual | Figma = comentario `// Figma:` y el token coincide con la base de conocimientos (Intelica.knowledgeBase) o Style Guide | Nada |
| 📘 Cambió en la base de conocimientos (Intelica.knowledgeBase) / SG | El token de la base de conocimientos (Intelica.knowledgeBase, o del SCSS `.pr*`) ≠ el `--i-*` implementado | Nuevo `--i-*` según la base de conocimientos (Intelica.knowledgeBase); actualizar `// knowledgeBase:` |
| 🔄 Cambió en Figma, token con respaldo | Figma ≠ `// Figma:` y el token tiene `// knowledgeBase:` o `// SG:` | **No cambiar el token**: actualizar solo `// Figma:` y reportar ⚠️ "Figma difiere de la base de conocimientos (Intelica.knowledgeBase)" |
| 🔄 Cambió en Figma, token sin respaldo | Figma ≠ `// Figma:` y el token no tiene `// knowledgeBase:` ni `// SG:` (sale de Aura) | Proponer el `--i-*` del valor nuevo de Figma, o mantener Aura y reportar |
| ✏️ Editado a mano | El token no apunta al `--i-*` de su origen (`// knowledgeBase:`/`// SG:`/`// Figma:`) | **No tocar** salvo forzar |
| 🆕 Nuevo en Figma | Valor, estado, eje o formato sin token ni caso en PrimeNG o base de conocimientos (Intelica.knowledgeBase) | **No se implementa**: va a "Solo en Figma" |
| 🗑️ Ya no está en Figma | Token con `// Figma:` cuyo valor desapareció del diseño | Si tiene respaldo en base de conocimientos (Intelica.knowledgeBase) o Style Guide o PrimeNG, se conserva; si no, preguntar |
| ❓ Sin huella | Token sin `// Figma:` ni origen (réplica antigua o hecha a mano) | Comparar con la base de conocimientos (Intelica.knowledgeBase) o Style Guide primero; con Figma solo para reportar |

5. Además de tokens, revisar lo que no es un valor:
   - **Estructura** (elementos nuevos o quitados, otro orden): no se aplica; se lista. La estructura la
     define PrimeNG.
   - **Variantes o estados nuevos en Figma**: no se crean ni se proponen como extensión; van a "Solo en
     Figma". Una variante nueva solo si la base de conocimientos (Intelica.knowledgeBase) agregó un caso `.pr` (📘), siguiendo
     `replicar-primeng` 2.4.
   - **Iconos** distintos en Figma: se mantiene el de PrimeNG o base de conocimientos (Intelica.knowledgeBase) y se reporta.

6. **Informe de verificación** en el chat:
   - Link y nodo comparados, archivo de la base de conocimientos (Intelica.knowledgeBase) leído (y si fue por MCP o repo local), versión del componente.
   - **Lista agrupada por estado**, no una tabla ancha (en la terminal se corta). Un encabezado por
     estado con cambios, en este orden: 📘 🔄 ✏️ 🆕 🗑️ ❓; debajo, una línea por token con
     `propiedad: antes → ahora`, el token propuesto, el archivo y la acción. Los ✅ van al final, solo
     contados. Formato (es el que muestra la página Skills):
     ```
     Sincronizar chip · version-1
     Figma: …?node-id=12-345 · Base de conocimientos (Intelica.knowledgeBase): chip.md (MCP)

     📘 Cambió en la base de conocimientos (se aplica)
        • gap: --i-spacing-gap-sm → --i-spacing-gap-md · _chip.scss
     🔄 Cambió en Figma
        • padding-x: 12px → 14px · origen knowledgeBase: solo se reporta
     ✏️ Editado a mano (no se toca sin forzar)
        • radius: no apunta a su origen · _chip.scss
     🆕 Solo en Figma (no se implementa)
        • estado Pressed
     ✅ Igual: 12 tokens
     ```
   - **Diferencias Figma ↔ base de conocimientos (Intelica.knowledgeBase)** (filas 🔄 con respaldo): para que el equipo decida si actualiza la base de conocimientos (Intelica.knowledgeBase).
   - **Solo en Figma** (🆕): variantes, estados, ejes o formatos que no están en PrimeNG ni en la base de conocimientos (Intelica.knowledgeBase).
   - Si todo es ✅: "**<componente>** está al día con la base de conocimientos (Intelica.knowledgeBase) y con Figma". Fin.

Con `--solo-verificar` termina aquí.

## 3. Confirmar

Pregunta en un solo mensaje:

> ¿Aplico los cambios 📘 (base de conocimientos (Intelica.knowledgeBase)), los 🔄 sin respaldo en la base de conocimientos (Intelica.knowledgeBase) y la actualización de los comentarios
> `// Figma:`? Los marcados ✏️ (editados a mano) no se tocan salvo que digas **forzar**. Los 🔄 con
> respaldo y los 🆕 no cambian el componente: quedan reportados para actualizar la base de conocimientos (Intelica.knowledgeBase).
> Decide también: <tokens 🗑️ sin respaldo a quitar o conservar>.

- Sin respuesta explícita no se escribe nada.
- Si el cambio es grande (estructura distinta, muchas variantes nuevas o el usuario quiere conservar la
  versión publicada), proponer antes `/crear-version` y aplicar los cambios en `version-N+1`.

## 4. Actualizar (solo lo aprobado)

- **Tokens** (`:root` de `_<id>.scss`), con el formato
  `// knowledgeBase: <token> · Figma: <valor> (<variable>) · Aura: <valor>` (el de Aura no cambia):
  - 📘: cambiar el `var(--i-*)` al de la base de conocimientos (Intelica.knowledgeBase) o Style Guide y actualizar `knowledgeBase:`/`SG:` y `Figma:`.
  - 🔄 con respaldo: **solo** el texto `Figma:` (y `⚠️` si difiere de la base de conocimientos (Intelica.knowledgeBase)); el `var(--i-*)` no cambia.
  - 🔄 sin respaldo: el `--i-*` del valor nuevo de Figma, si el usuario lo aprobó.
  - Siempre un `--i-*`, preferiblemente alias con escala; sin literales. Sin token equivalente: el más
    cercano y anotarlo, o preguntar.
- **Reglas** (`_<id>.scss` y módulos): solo si un token nuevo o un caso nuevo de la base de conocimientos (Intelica.knowledgeBase) lo exige.
  Solo `var(--int-<id>-*)`, BEM, sin `p-*`, `::ng-deep` ni `--doc-*`.
- **Base** (`<id>.ts` / `<id>.html`): no se cambia por Figma. La API de PrimeNG no se renombra ni se quita.
- **Variantes**: una variante nueva solo para un caso `.pr` nuevo de la base de conocimientos (Intelica.knowledgeBase, 📘), con `npm run new:variant`.
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
  modificados, resultado real de build y tests, **diferencias Figma ↔ base de conocimientos (Intelica.knowledgeBase)** y **Solo en Figma** para
  que el equipo actualice la base de conocimientos (Intelica.knowledgeBase).
- No se cambia `status`; si correspondía, sugerir `/cambiar-estado`.

## 6. Qué NO hacer

- ❌ Escribir algo durante la verificación o con `--solo-verificar`.
- ❌ Aplicar cambios sin confirmación, o tocar lo ✏️ editado a mano sin **forzar**.
- ❌ Copiar valores de Figma como literales o el código de `get_design_context`.
- ❌ Cambiar API, nombres de inputs/outputs, teclado o ARIA por un cambio visual.
- ❌ Borrar o renombrar variantes, estilos o versiones existentes.
- ❌ Cambiar título, descripción, `status` o `designer` de la cabecera/base.
- ❌ Dejar un token actualizado sin su comentario de origen (`// knowledgeBase:`/`// SG:` · `Figma:`) al día.
- ❌ Cambiar un token con respaldo en la base de conocimientos (Intelica.knowledgeBase) o el Style Guide porque Figma cambió (se reporta).
- ❌ Crear variantes, estados o extensiones `int-*` a partir de Figma: solo desde la base de conocimientos (Intelica.knowledgeBase) o PrimeNG.
- ❌ Afirmar que coincide con Figma sin haberlo comparado.
