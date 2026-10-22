---
name: ocultar
description: Oculta temporalmente un componente, una variante o una versión de un componente int-* en Intelica Components sin borrar código - desaparece del menú, la búsqueda, la galería y la página (o del desplegable de versiones), y se puede reactivar con la skill reactivar. Solo cambia <id>.config.ts. También lista qué está oculto. Úsalo cuando el usuario diga "oculta el tooltip", "esconde la variante Raised", "que no se vea la versión 1 de tabs", "¿qué está oculto?" o /ocultar. Para borrar del todo usar eliminar-variante, eliminar-version o eliminar-componente.
argument-hint: "[componente|variante|version] [componente] [slug|N]"
---

# Ocultar (sin borrar)

Ocultar no toca el código: solo escribe en `src/components/<id>/<id>.config.ts`. Se deshace con
`/reactivar`.

| Qué | En el config | Efecto |
|---|---|---|
| Componente | `hidden: true` | Fuera del menú, rutas, búsqueda, galería y Status. Su URL deja de abrir. |
| Variante | `{ name: '<slug>', hidden: true }` en `variants` (conserva su posición) | Fuera del menú y de la página, en todas las versiones. |
| Versión | `hiddenVersions: [N]` | Fuera del desplegable; `?version=N` abre la última visible. Las variantes que solo viven en esa versión tampoco se ven. |

## 1. Datos y validación

Lo que venga en los argumentos o en el mensaje no se vuelve a preguntar; lo que falte se pregunta en
**un solo mensaje**.

1. **Qué ocultar**: componente, variante o versión (dedúcelo del mensaje: "la variante X", "la versión 2").
2. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede ocultar: el componente **<nombre>** no existe.
3. **Variante** (slug) o **versión** (número). Para ver las variantes: `npm run order:variants -- <id>`.

Bloqueos (el script también los aplica, traduce su error):
- Ya está oculto → se avisa y no se cambia nada.
- La última versión visible no se puede ocultar → ofrece ocultar el componente.

Avisos antes de ejecutar (no bloquean):
- Ocultar `basic`: es la variante principal; confírmalo.
- Ocultar la versión **más reciente**: la página pasará a abrir la anterior por defecto, con su título.

## 2. Ocultar

```bash
npm run visibility -- hide component <id>
npm run visibility -- hide variant <id> <slug>
npm run visibility -- hide version <id> <N>
```

No hace falta confirmación previa (es reversible) ni regenerar: `ng serve` recarga el config. Confirma
qué quedó oculto y cómo reactivarlo (`/reactivar`).

## 3. Ver lo oculto

```bash
npm run visibility -- list            # todos los componentes
npm run visibility -- list <id>       # uno
```

Imprime una tabla Markdown (Tipo · Componente · Elemento): pégala en el chat.

## Qué NO hacer

- ❌ Borrar o mover carpetas: ocultar no toca el código.
- ❌ Editar el config a mano desde la IA: usa el script.
- ❌ Ocultar algo que el usuario no pidió (p. ej. el componente cuando pidió una versión).
