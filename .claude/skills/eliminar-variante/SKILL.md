---
name: eliminar-variante
description: Elimina una variante (ejemplo de documentación, carpeta version-N/variants/<slug>/) de un componente int-* en Intelica Components, de una versión o de todas, y limpia su entrada en la lista variants de <id>.config.ts. Antes pregunta si borrarla del todo u ocultarla (skill ocultar), muestra qué se va a borrar y pide confirmación. Úsalo cuando el usuario diga "elimina la variante X de <componente>", "borra el ejemplo Raised", "quita Outlined de la versión 1" o /eliminar-variante. Para borrar una versión entera usar eliminar-version; un componente, eliminar-componente.
argument-hint: "[componente] [variante]"
---

# Eliminar una variante

Borra la carpeta `src/components/<componente>/version-<N>/variants/<slug>/` (en una versión o en
todas) con `npm run remove`, que además:
- quita su entrada de `variants` en `<id>.config.ts` si ya no queda en ninguna versión;
- regenera `src/generated/`, así un `ng serve` en marcha no falla por un import que ya no existe.

## 1. Datos y validación

Lo que venga en los argumentos (`/eliminar-variante accordion raised`) o en el mensaje no se vuelve a
preguntar; lo que falte se pregunta **en un solo mensaje**.

1. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede eliminar: el componente **<nombre>** no existe.
2. **Variante**: título o slug. Para ver las que hay y en qué versiones está cada una:
   ```bash
   npm run order:variants -- <id>
   ```
   Convierte el título al slug con esa tabla. Si no existe, responde con la lista de variantes disponibles.
3. **Versión** — si la variante está en **más de una** versión, **pregunta siempre**: muestra en qué
   versiones existe y ofrece: solo la última, una versión concreta o todas. Si está en una sola, no preguntes.
   - Si se borra solo de una versión, avisa que **sigue en el menú** (el menú junta las variantes de todas las versiones).
4. **`basic`**: es la variante con la que nace todo componente. Si piden borrarla, avisa y pide que lo
   confirmen explícitamente; solo entonces se añade `--allow-basic`.

## 1.1 ¿Borrar del todo u ocultar?

**Siempre** pregunta antes de simular, salvo que el usuario ya haya dicho "bórrala del todo":

| Opción | Qué pasa | Cómo se deshace |
|---|---|---|
| Ocultar | Sigue la carpeta; sale del menú y la página en todas las versiones, conservando su posición. Skill `ocultar`: `npm run visibility -- hide variant <id> <slug>`. | `/reactivar` |
| Borrar del todo | Se borra la carpeta (pasos 2 y 3). | Solo con git, si estaba commiteada |

Ocultar es por componente (todas las versiones): si solo quiere quitarla de **una** versión, la opción
es borrar. Si elige ocultar, sigue la skill `ocultar` y termina aquí.

## 2. Simular y confirmar

```bash
npm run remove -- variant <id> <slug> [--version <N> | --all] [--allow-basic]
```

Sin `--yes` **no borra nada**: lista las carpetas, los cambios del config y los archivos **no
commiteados** (⚠: git no podrá restaurarlos). Muéstralo en el chat como tabla (Acción · Ruta · Nota) y
pide confirmación. No continúes sin un "sí" explícito.

## 3. Eliminar

El mismo comando con `--yes`. Confirma al usuario qué se borró y, si la variante sigue en otras
versiones, en cuáles.

## Qué NO hacer

- ❌ Borrar sin la simulación previa y la confirmación del usuario.
- ❌ Borrar carpetas a mano (`rm`, explorador): deja `src/generated/` y el config desfasados.
- ❌ Tocar `base/`, `styles/` u otras variantes. Si existía un módulo SCSS de modificador del mismo
  nombre (`_<id>.<slug>.scss`), solo avísalo: lo decide el maquetador.
- ❌ Decidir tú la versión cuando la variante está en varias.
