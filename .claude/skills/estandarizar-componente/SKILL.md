---
name: estandarizar-componente
description: Estandariza un componente int-* que un maquetador replicó o customizó fuera del repo (en su local, con su propia IA) y pegó sobre src/components/<id>/version-N/. Lo deja como si lo hubiera hecho replicar-primeng (estructura base/styles/variants, clase Int<Id>, API con los nombres de PrimeNG, BEM int-*, tokens --int-* → --i-* con comentario de origen (knowledgeBase: · SG: · Figma: · Aura:), animaciones, teclado, marcadores dep:<id> provisional y requires/uses) para que sincronizar-componente y resolver-dependencias funcionen. Diagnostica con npm run check:component, lee PrimeNG y el caso .pr de la base de conocimientos (Intelica.knowledgeBase), muestra una tabla de adaptación (conserva / renombra / alinea / agrega / quita), alinea con el orden de prioridad (PrimeNG → base de conocimientos (Intelica.knowledgeBase) → Style Guide → Figma) y reporta los cambios para devolverlos al maquetador. Si el trabajo envuelve PrimeNG (p-x, imports de primeng), pasa a replicar-primeng en modo forzar. Es el punto de partida obligatorio para el trabajo hecho fuera del repo: sin él no funcionan sincronizar-componente ni resolver-dependencias. Úsalo cuando el usuario diga "estandariza el componente que subió X", "adapta el componente que subió X", "alinea el chip de Yony", "el maquetador pegó su select, déjalo con las bases", "convierte lo que hizo el maquetador" o /estandarizar-componente.
argument-hint: "<componente> [--version N] [link de Figma]"
---

# Estandarizar un componente hecho fuera del repo

Para componentes `int-*` que un maquetador hizo **fuera del repo** (su local, su IA) y pegó encima de
`src/components/<id>/version-N/`. El objetivo es que quede **igual que si lo hubiera hecho
`/replicar-primeng`**: mismas huellas (estructura, BEM, tokens con comentario de origen, marcadores
`dep:`), para que `/sincronizar-componente` y `/resolver-dependencias` trabajen sobre él.

No se duplican reglas. La fuente es [../replicar-primeng/SKILL.md](../replicar-primeng/SKILL.md):
"Orden de prioridad de fuentes", 1.3 (PrimeNG), 1.3b (base de conocimientos (Intelica.knowledgeBase)), 1.6 (dependencias),
fase 3 (implementación) y sus `references/`. La validación es `npm run check:component`
([scripts/check-component.mjs](../../../scripts/check-component.mjs)).

> ⚖️ **Alinear y reportar.** Ante una diferencia entre el trabajo del maquetador y las fuentes, gana el
> orden de prioridad (PrimeNG → base de conocimientos (Intelica.knowledgeBase) `.pr` → Style Guide → Figma) sin preguntar; la diferencia va a la
> tabla de cambios del informe. Solo se pregunta lo que ninguna fuente resuelve (3).
>
> 🔓 Al pedir esta skill, el usuario autoriza cambiar lo customizado de la versión (la protección 1.2 de
> `replicar-primeng` no aplica). Siempre se conservan cabecera (`title`, `description`), `status` y
> `designer`.

---

## 1. Datos

Lo que no venga en el pedido se pregunta en **un solo mensaje**:

1. **Componente** y **versión** (por defecto la más reciente). Si no existe: "No existe **<nombre>**;
   créalo con `/crear-componente` y vuelve a pegar el trabajo ahí". Fin.
2. **Link de Figma** (opcional), salvo que ya esté en la cabecera (`figma:`).
3. **Maquetador**: se toma de `designer` de la base; si el trabajo es de otra persona, se anota en el
   informe pero `designer` no se cambia.

Luego comprueba el estado en git:

```bash
git status --short src/components/<id>/
git log --oneline -3 -- src/components/<id>/
```

- Si lo pegado **no está commiteado**, pide antes un commit del original
  (`[Import] - <id> raw from <maquetador>`) y no toques nada hasta que exista: es la referencia para
  comparar y para devolver la retroalimentación. Sin respuesta, no se sigue.
- Si ya está commiteado, ese commit es el original (`git show <sha> --stat`).

## 2. Diagnóstico (solo lectura)

1. **Check automático**:
   ```bash
   npm run check:component -- <id> --version <N>
   ```
   Cada ❌/⚠️ es una fila de la tabla de adaptación.
2. **Lee todo lo pegado**: archivos de la versión (aunque tengan otro nombre o carpeta), clases,
   inputs/outputs, estilos, ejemplos y datos de demo.
3. **Lee las fuentes**: PrimeNG (`replicar-primeng` 1.3: API, plantilla, CSS, animaciones, teclado) y
   el caso `.pr` de la base de conocimientos (Intelica.knowledgeBase, 1.3b, MCP `knowledgeBaseMcp` o repo local).
4. **Tipo de trabajo**:

| Tipo | Cómo se detecta | Qué se hace |
|---|---|---|
| **Réplica propia** | no importa `primeng`/`@primeuix` ni usa `<p-*>` | se adapta archivo por archivo (4) |
| **Wrapper de PrimeNG** | importa `primeng`, usa `<p-x class="prX">`, `pTemplate`, `providePrimeNG` | no se puede adaptar: avisa y sigue con `/replicar-primeng <p-x>` eligiendo **forzar** en 1.2; los estilos, variantes y datos del maquetador son referencia de lo customizado |
| **Mixto** | parte propia y parte delegada en PrimeNG (p. ej. overlay con `p-overlay`) | se adapta lo propio y se reemplaza lo delegado como en `primeng-v20-map.md` sección 4 |

5. **Mapa de API** (tabla en el chat): input/output/template del maquetador → nombre en PrimeNG v20 →
   acción (`igual`, `renombrar`, `extensión int-*`, `quitar`). Los nombres siempre terminan como
   PrimeNG; lo que PrimeNG no tiene y la base de conocimientos (Intelica.knowledgeBase) respalda se marca `/** int-* extension: … */`.
6. **Tabla de adaptación** (en el chat), una fila por pieza:

| Pieza | Hoy (maquetador) | Acción | Destino | Fuente que decide |
|---|---|---|---|---|
| archivo | `chip.component.ts` | Renombra | `base/chip.ts` | convención (tabla 0) |
| clase / selector | `ChipComponent` · `app-chip` | Renombra | `IntChip` · `int-chip` | convención |
| input | `closable` | Renombra | `removable` | PrimeNG |
| estilo | `.chip .close { color: #2351B3 }` | Alinea | `.int-chip__remove-icon` + `--int-chip-remove-icon-color: var(--i-…)` | Base de conocimientos (Intelica.knowledgeBase) `.prChip` |
| token | `--chip-gap: 6px` | Alinea | `--int-chip-gap: var(--i-spacing-gap-xs)` | Base de conocimientos (Intelica.knowledgeBase) |
| animación | sin transición | Agrega | 3.6 | PrimeNG |
| teclado | sin `Backspace` | Agrega | 3.7 | PrimeNG |
| dependencia | checkbox copiado a mano | Agrega | provisional `dep:checkbox` / `<int-checkbox>` | 1.6 |
| variante | `variants/default/` | Renombra | `variants/basic/` | convención |
| variante | `demo-colores/` | ❓ | — | sin origen en base de conocimientos (Intelica.knowledgeBase) ni PrimeNG |
| import | `primeng/chip` | Quita | — | regla "sin PrimeNG" |

Acciones: **Conserva** (ya cumple), **Renombra** (solo forma), **Alinea** (difiere de PrimeNG o de la base de conocimientos (Intelica.knowledgeBase):
gana la fuente), **Agrega** (falta algo que `replicar-primeng` siempre hace), **Quita** (prohibido,
incluidos los rastros de PrimeNG: imágenes o URLs de su CDN → placeholder con fondo del Style Guide,
`replicar-primeng` 3.4) y
**❓** (sin fuente que lo resuelva: va a 3).

## 3. Confirmar (un solo mensaje)

Muestra el mapa de API y la tabla de adaptación, y pregunta **solo**:

- Variantes del maquetador sin origen en la base de conocimientos (Intelica.knowledgeBase) ni en PrimeNG: ¿conservarla como extensión documentada,
  ocultarla (`/ocultar`) o eliminarla (`/eliminar-variante`)?
- Tokens sin equivalente en el Style Guide (3.3 de `replicar-primeng`).
- Dependencias ambiguas (1.6: checkbox → `input` o componente propio).
- Si es wrapper: confirmar que se pasa a `/replicar-primeng` en modo forzar.

Sin respuesta no se escribe nada.

## 4. Adaptar

Aplica la **fase 3 de `replicar-primeng`** sobre el código existente, conservando lo que ya cumple:

1. **Archivos**: `git mv` a la estructura del proyecto (`base/<id>.ts`, `base/<id>.html`,
   `styles/_index.scss`, `styles/_<id>.scss`, `styles/_<id>.<grupo>.scss`, `variants/<slug>/`); `.css` →
   `.scss`. Lo que falte se crea con los scripts (`npm run new:variant`), nunca a mano. `variants/basic/`
   siempre existe.
2. **Base TS** (3.1): `Int<Id>`, selector `int-<id>`, `status`/`designer` como primeras líneas, Signals,
   OnPush, API con los nombres y defaults de PrimeNG, `ControlValueAccessor` si PrimeNG lo tiene. Los
   mocks del maquetador salen de la base al `example.ts` de la variante que los usa.
3. **Base HTML** (3.2): estructura de PrimeNG, BEM `int-<id>__<elem>` / `--<mod>`, control flow moderno,
   ARIA y teclado de PrimeNG.
4. **Estilos** (3.3): selectores a BEM; cada valor a `--int-<id>-*: var(--i-*)` con el token que indica
   la base de conocimientos (Intelica.knowledgeBase, o el SCSS `.pr*`, o Aura traducido) y su **comentario de origen**
   `// knowledgeBase: <token> · Figma: <valor> (<variable>) · Aura: <valor>`. El valor que tenía el maquetador no
   va al comentario: va a la tabla de cambios. Literales → token más cercano y la diferencia al informe.
   Un `overflow` en el bloque `.int-<id>` (o `u-overflow-*` sobre el `<int-*>` de una variante) se mueve
   al `__elemento` que necesita el recorte: el bloque no recorta, para no cortar overlays abiertos dentro.
5. **Cabecera**: si hay link de Figma, `figma:` y `figma-frame:` (1.5).
6. **Dependencias** (1.6): lo que el maquetador copió o imitó de otro componente → `int-*` real si está
   en `done`, o provisional marcado `dep:<id> provisional` + `data-dep`, y el id en `requires` (base) o
   `uses` (variantes) del config.
7. **Variantes** (2.4, 3.4, 3.5): las que corresponden a la base de conocimientos (Intelica.knowledgeBase) o a PrimeNG se reubican con su slug; el
   contenido de los templates con helpers `.u-*`; con 3 o más, `npm run order:variants`.
8. **Interacción**: lo que falte de 3.6 (animaciones, ripple, `prefers-reduced-motion`) y de 3.7
   (tab stops, foco, teclas, `:focus-visible`). Si el maquetador conectó estado o ARIA en las variantes
   (`[attr.aria-disabled]`, `[attr.tabindex]`, `role`, `(keydown.*)` sobre el `<int-*>`), se mueve a la
   base: un input (`disabled`…) y el host resuelve `tabindex`, ARIA y teclado.
9. **Adaptaciones de comportamiento**: lo que el maquetador cambió respecto a PrimeNG porque el
   proyecto lo necesita (y la base de conocimientos lo documenta: *All* fija, iconos de orden propios…)
   se **conserva** como extensión `/** int-* extension */`, implementado nativo en la base. No se
   "corrige" hacia PrimeNG (`replicar-primeng/references/knowledge-base.md` sección 4).

## 5. Validar

```bash
npm run check:component -- <id> --version <N>   # 0 errores; avisos explicados en el informe
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Más la revisión manual de la fase 4 de `replicar-primeng` (API, visual, teclado, animaciones). Si algo
no se pudo ejecutar o ver, se dice.

## 6. Informe

El de la fase 5 de `replicar-primeng`, más:

1. **Tipo de trabajo** detectado y commit del original.
2. **Cambios sobre el trabajo de <maquetador>**: la tabla de adaptación final (conservado, renombrado,
   alineado, agregado, quitado) con el **porqué** de cada fila. Está pensada para devolverla al
   maquetador; redáctala sin jerga interna.
3. **Pendientes**: filas ❓ sin decidir, provisionales `dep:` y su `/resolver-dependencias <dep>`,
   avisos del check que quedaron.
4. Sugerencia: `/sincronizar-componente <id> --solo-verificar` (si hay Figma) y `/cambiar-estado`.

## 7. Qué NO hacer

- ❌ Tocar algo antes de que el original esté commiteado.
- ❌ Cambiar cabecera (`title`, `description`), `status` o `designer`.
- ❌ Conservar nombres del maquetador que difieren de PrimeNG, o valores que difieren de la base de conocimientos (Intelica.knowledgeBase), sin
  reportarlo: se alinean y se anotan.
- ❌ Adaptar un wrapper de PrimeNG "por encima": se replica con `/replicar-primeng`.
- ❌ Quitar una adaptación de comportamiento documentada en la base de conocimientos para volver al
  comportamiento de PrimeNG.
- ❌ Dejar en las variantes estado o ARIA que corresponde al componente.
- ❌ Dejar tokens sin comentario de origen o provisionales sin `data-dep`: `sincronizar-componente` y
  `resolver-dependencias` dependen de esas huellas.
- ❌ Borrar variantes del maquetador sin preguntar cuando no tienen origen en la base de conocimientos (Intelica.knowledgeBase) ni en PrimeNG.
- ❌ Dar por terminado con `check:component` en rojo, o afirmar build, tests o fidelidad visual sin
  haberlos ejecutado o visto.
- ❌ Todo lo de la sección 6 de `replicar-primeng`.
