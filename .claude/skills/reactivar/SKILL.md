---
name: reactivar
description: Vuelve a mostrar un componente, una variante o una versión de un componente int-* que se ocultó con la skill ocultar en Intelica Components (quita hidden / hiddenVersions de <id>.config.ts). Primero lista lo que está oculto y pregunta qué reactivar. Úsalo cuando el usuario diga "reactiva el tooltip", "vuelve a mostrar la variante Raised", "muestra otra vez la versión 1 de tabs", "¿qué tengo oculto?" o /reactivar.
argument-hint: "[componente|variante|version] [componente] [slug|N]"
---

# Reactivar lo oculto

Deshace `/ocultar`: quita la marca del config y el elemento vuelve al menú, la búsqueda, la galería y
la página. La variante vuelve **a la misma posición** que tenía.

## 1. Qué reactivar

Si el usuario no dijo qué, lista lo oculto y pregunta:

```bash
npm run visibility -- list            # todos
npm run visibility -- list <id>       # uno
```

Pega la tabla en el chat. Si no hay nada oculto, dilo y termina. Si el componente no existe:
> No se puede reactivar: el componente **<nombre>** no existe.

Si piden reactivar algo que **no está oculto**, el script falla sin cambiar nada: avisa
("**<x>** ya está visible"). Si lo que buscan **ya no existe** (se eliminó), no se puede reactivar:
git es la única vía (`git log -- src/components/<id>`).

## 2. Reactivar

```bash
npm run visibility -- show component <id>
npm run visibility -- show variant <id> <slug>
npm run visibility -- show version <id> <N>
```

Se pueden reactivar varios a la vez: un comando por elemento. Confirma qué volvió a verse y su enlace
(`/components/<id>`, `#<id>-<slug>` o `?version=<N>`).

Nota: reactivar un componente no reactiva sus variantes o versiones ocultas por separado; menciónalas
si `list <id>` muestra alguna.

## Qué NO hacer

- ❌ Editar el config a mano desde la IA: usa el script.
- ❌ Reactivar elementos que el usuario no pidió.
