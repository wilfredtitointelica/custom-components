---
name: ordenar-variantes
description: Cambia el orden en que aparecen las variantes de un componente int-* en el menú lateral y en la página de documentación de Intelica Components. Muestra en el chat una tabla con el orden actual (posición, slug, título, versiones) y pregunta el orden o la posición nueva; lo guarda en la lista variants de <id>.config.ts. Úsalo cuando el usuario diga "ordena las variantes de <componente>", "pon Raised en la posición 2", "mueve Outlined al final", "¿en qué orden están las variantes de <componente>?" o /ordenar-variantes. También lo usa crear-variante al final, cuando el componente tiene 3 o más variantes.
argument-hint: "[componente] [slug slug …]"
---

# Ordenar variantes

Las variantes son las carpetas `version-N/variants/<slug>/` y el menú las junta de **todas las
versiones**, así que el orden es **por componente**, no por versión. Por defecto van `basic` primero y
el resto en orden alfabético. Para otro orden se escribe la lista `variants` de
`src/components/<id>/<id>.config.ts`:

```ts
export default {
  id: 'accordion',
  variants: ['basic', 'raised', 'icons-border'],
  loadRoutes: () => import('./routes'),
} satisfies ComponentDefinition;
```

- Se guardan **slugs** (nombre de carpeta), no títulos: cambiar el título en `example.html` no rompe el orden.
- Una carpeta que no está en la lista va **después** de las listadas (basic primero, luego alfabético).
- Las entradas ocultas (`{ name: 'X', hidden: true }`) se conservan tal cual.

## 1. Datos

Lo que venga en los argumentos (`/ordenar-variantes accordion`) o en el mensaje no se vuelve a preguntar.

1. **Componente**: id o nombre visible. Conviértelo al `id` (`<id>.config.ts`; `title:` de
   `version-N/base/<id>.html`). Si no existe:
   > No se puede ordenar: el componente **<nombre>** no existe.
2. **Orden nuevo**: primero muestra el orden actual (paso 2) y pregunta. El usuario puede contestar:
   - la lista completa: "basic, raised, outlined";
   - un movimiento: "raised en la 2", "outlined al final", "icons-border antes de raised", "sube X".
   Con un movimiento, calcula tú la lista completa a partir de la tabla. Acepta títulos o slugs y
   conviértelos a slug con la columna de la tabla.

Si el componente tiene **una sola** variante visible, no hay nada que ordenar: dilo y no preguntes.

## 2. Mostrar el orden actual

```bash
npm run order:variants -- <id>
```

Imprime una tabla Markdown (`# · Slug · Title · Versions`). **Pégala en el chat** (puedes traducir la
cabecera: Posición, Slug, Título, Versiones) y pregunta el orden nuevo en el mismo mensaje.

## 3. Guardar

```bash
npm run order:variants -- <id> <slug-1> <slug-2> …
```

- Hay que pasar **todas** las variantes visibles, una vez cada una; el script falla sin tocar nada si
  falta, sobra o se repite alguna (traduce el error al usuario).
- Reescribe solo la lista `variants` del config (la crea debajo de `id:` si no existía); el resto del
  archivo no cambia.
- No hace falta regenerar ni reiniciar: el config es un import normal y `ng serve` lo recarga.

Después muestra la tabla con el orden final (el script la imprime) y el enlace `/components/<id>`.

## Qué NO hacer

- ❌ Editar el config a mano desde la IA: usa el script.
- ❌ Poner títulos, descripciones o `hidden` nuevos en la lista: solo se ordena.
- ❌ Renombrar carpetas para forzar el orden alfabético.
- ❌ Ordenar por versión: el orden es uno solo para todo el componente.
