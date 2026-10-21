---
name: cambiar-estado
description: Cambia el estado de implementación (pending, in-progress o done) de un componente int-* en Intelica Components. Es la propiedad static readonly status de la clase en version-N/base/<id>.ts, que la página muestra como chip (Pending / In progress / Done). Pregunta el componente, el estado y, si tiene varias versiones, cuál. Úsalo cuando el usuario diga "marca button como terminado", "pon chip en progreso", "el accordion ya está listo", "cambia el estado de <componente>", "¿qué componentes están pendientes?" o /cambiar-estado. También reasigna el diseñador (static readonly designer): "el tooltip ahora lo ve Gabi", "¿qué componentes tiene Yony?".
argument-hint: "[componente] [pending|in-progress|done]"
---

# Cambiar el estado de un componente

Cada versión de un componente tiene un estado, declarado como **primera propiedad de su clase base**
(`src/components/<id>/version-<N>/base/<id>.ts`):

```ts
export class IntButton {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  // …
}
```

`scripts/generate-docs.mjs` la lee del archivo (no se importa nada, la base sigue extraíble a npm) y la
página de documentación la muestra como chip junto a la versión:

| Estado | Chip | Cuándo |
|---|---|---|
| `pending` | ⏳ **Pending** (gris) | Solo la estructura: componente recién creado (`crear-componente`) o versión nueva (`crear-version`). Nadie lo está maquetando aún. Es el valor por defecto. |
| `in-progress` | 🕒 **In progress** (naranja) | El maquetador está trabajando en esa versión. |
| `done` | ✅ **Done** (verde) | La versión está terminada. |

El avance de todos los componentes se ve en la app en **Reference → Status** (`/components/status`):
porcentaje terminado, conteo por estado y una tabla filtrable (estado de la versión más reciente de
cada componente y de sus versiones anteriores).

Es **por versión**: `version-1` puede estar `done` mientras `version-2` está `in-progress`; el chip
muestra el de la versión elegida en el desplegable.

## 1. Datos

Lo que venga en los argumentos (`/cambiar-estado button done`) o en el mensaje no se vuelve a
preguntar; lo que falte se pregunta en el chat, **todo en un solo mensaje**:

1. **Componente**: el ID o el nombre visible (`button`, `Dropdown / Select`). Conviértelo al `id`
   (el de `src/components/*/<id>.config.ts`; `title:` de `version-N/base/<id>.html` para el nombre).
2. **Estado**: `pending`, `in-progress` o `done`. Traduce lo que diga el usuario:
   - "pendiente", "sin empezar", "por hacer" → `pending`
   - "en progreso", "empecé", "lo estoy maquetando", "en curso" → `in-progress`
   - "terminado", "listo", "completo", "finalizado", "ya está" → `done`
3. **Versión**: por defecto la más reciente (`version-N` mayor). Pregunta solo si el componente tiene
   varias versiones **y** el usuario se refiere a una anterior ("la versión 1 ya está lista").

Se pueden cambiar varios componentes a la vez ("marca button y chip como done"): un comando por
componente.

## 2. Cambiar

```bash
npm run set:status -- <id> <pending|in-progress|done> [--version <N>]
```

El script:
- busca la carpeta del componente (acepta el id o la carpeta, p. ej. `demo` → `_demo_/`);
- reemplaza **solo** la línea `static readonly status … = '…';` de `version-N/base/<id>.ts`;
- si la base es antigua y no tiene la propiedad, la agrega como primera línea de la clase;
- falla sin tocar nada si el componente, la versión o la base no existen, o si el estado no es válido;
- al terminar regenera `src/generated/`, así el chip cambia aunque el servidor sea un `ng serve` directo.

No edites el archivo a mano desde la IA: usa el script (el maquetador sí puede editar la línea a mano).

## 3. Consultar estados

Si el usuario pregunta qué componentes están pendientes, en progreso o terminados:

```bash
grep -rn "static readonly status" src/components/*/version-*/base/*.ts
```

Responde agrupado por estado (solo la versión más reciente de cada componente, salvo que pida todas).

## 4. Reasignar diseñador

Debajo de `status`, cada base tiene el diseñador a cargo de esa versión:

```ts
  /** Designer in charge of this version, shown on the progress page (Reference → Status). */
  static readonly designer = 'Yony León';
```

Si el usuario pide cambiarlo ("el tooltip ahora lo ve Gabi"), edita **solo esa línea** en la versión
más reciente con el **nombre completo**: Yony León, Gabriela Javier o Christian Abanto (`''` = sin
asignar). Si la base no tiene la propiedad, agrégala justo debajo de `status`. También responde
"¿qué componentes tiene Yony?" con:

```bash
grep -rn "static readonly designer" src/components/*/version-*/base/*.ts
```

La página **Reference → Status** muestra el avance por diseñador y permite filtrar la tabla por persona.

## 5. Verificar

Confirma al usuario el archivo cambiado, el estado nuevo y el enlace `/components/<id>?version=<N>`.
No hace falta `npm run build` (solo cambia un literal).

## Qué NO hacer

- ❌ Marcar `done` (o cualquier estado) sin que el usuario lo pida: el estado lo decide el maquetador.
- ❌ Cambiar otra cosa de la base (inputs, lógica, comentario) o de los estilos.
- ❌ Usar valores distintos de `pending`, `in-progress` o `done`.
- ❌ Mover el estado a `<id>.config.ts`, a un comentario (`@status`) o a la cabecera del HTML: va en
  la clase de `base/<id>.ts`.
- ❌ Cambiar el estado de una versión anterior cuando el usuario no la mencionó.

Convenciones completas: skill `crear-componente` (`.claude/skills/crear-componente/SKILL.md`).
