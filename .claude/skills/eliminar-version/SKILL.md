---
name: eliminar-version
description: Elimina una versión de implementación (carpeta version-N/ con su base, variantes y estilos) de un componente int-* en Intelica Components, sin renumerar las demás, y limpia del config las variantes que solo vivían ahí. Antes pregunta si borrarla del todo u ocultarla (skill ocultar), muestra qué se va a borrar y pide confirmación. Úsalo cuando el usuario diga "elimina la versión 2 de <componente>", "borra version-1 de tabs", "ya no necesito la versión anterior" o /eliminar-version. Para una variante usar eliminar-variante; para el componente entero, eliminar-componente.
argument-hint: "[componente] [N]"
---

# Eliminar una versión

Borra `src/components/<componente>/version-<N>/` completa con `npm run remove`, que además:
- quita de `variants` en `<id>.config.ts` las variantes que **solo** existían en esa versión;
- regenera `src/generated/` (el desplegable de versiones deja de mostrarla y `ng serve` no falla).

**Las demás versiones no se renumeran**: si se borra `version-2` de 1-2-3, quedan 1 y 3, así los
enlaces `/components/<id>?version=3` siguen funcionando.

## 1. Datos y validación

Lo que venga en los argumentos (`/eliminar-version tabs 1`) o en el mensaje no se vuelve a preguntar.

1. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede eliminar: el componente **<nombre>** no existe.
2. **Versión**: número. Muestra las versiones que tiene (carpetas `version-N/`) con su estado y
   diseñador (`static readonly status` / `designer` de cada `base/<id>.ts`) y pregunta cuál si no lo dijo.
   - Si no existe: avisa con las versiones disponibles.
   - Si es la **única** versión: no se puede; responde
     > **<nombre>** solo tiene la version <N>. Para quitarlo del todo usa `/eliminar-componente`.
   - Si es la **más reciente**, avisa que la página pasará a abrir la `version-<anterior>` por
     defecto y que el título/descripción del menú serán los de esa versión.

## 1.1 ¿Borrar del todo u ocultar?

**Siempre** pregunta antes de simular, salvo que el usuario ya haya dicho "bórrala del todo":

| Opción | Qué pasa | Cómo se deshace |
|---|---|---|
| Ocultar | Sigue la carpeta; sale del desplegable de versiones (`hiddenVersions: [N]` en el config). Skill `ocultar`: `npm run visibility -- hide version <id> <N>`. | `/reactivar` |
| Borrar del todo | Se borra `version-<N>/` (pasos 2 y 3). | Solo con git, si estaba commiteada |

Si elige ocultar, sigue la skill `ocultar` y termina aquí. Si la versión estaba oculta y la borra,
el script también la quita de `hiddenVersions`.

## 2. Simular y confirmar

```bash
npm run remove -- version <id> <N>
```

Sin `--yes` **no borra nada**: lista la carpeta, los cambios del config, las versiones que quedan y
los archivos **no commiteados** (⚠: git no podrá restaurarlos). Muéstralo en el chat como tabla y pide
confirmación explícita.

## 3. Eliminar

El mismo comando con `--yes`. Confirma qué se borró y qué versiones quedan.

## Qué NO hacer

- ❌ Borrar sin la simulación previa y la confirmación del usuario.
- ❌ Renombrar o renumerar las versiones restantes.
- ❌ Borrar la carpeta a mano.
- ❌ Cambiar el `status` o el `designer` de otra versión.
