---
name: eliminar-componente
description: Elimina un componente int-* completo de Intelica Components (carpeta src/components/<id>/ con todas sus versiones), su registro en inventory.ts y su categoría/icono en catalog-groups.ts. Antes pregunta si borrarlo del todo u ocultarlo sin perder el código (skill ocultar), muestra qué se va a borrar y pide confirmación. Úsalo cuando el usuario diga "elimina el componente X", "borra <componente>", "ya no vamos a hacer el tooltip" o /eliminar-componente. Para una variante usar eliminar-variante; para una versión, eliminar-version.
argument-hint: "[componente]"
---

# Eliminar un componente

## 1. Datos y validación

1. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede eliminar: el componente **<nombre>** no existe.
2. **Referencia**: si su config tiene `reference: true` (`demo`), **no se elimina**: es la
   implementación de referencia del flujo. El script también lo bloquea.
3. Muestra un resumen: versiones, variantes (`npm run order:variants -- <id>`), estado y diseñador de
   cada versión.
4. **Quién lo usa**: otros componentes que lo tienen en `requires`/`uses` o con su provisional o su
   import:
   ```bash
   grep -ln "'<id>'" src/components/*/*.config.ts
   grep -rln "dep:<id>\b\|<id>/version-[0-9]*/base/<id>'" src/components/
   ```
   Si hay alguno, avísalo antes de seguir. Con el componente ya resuelto (import de `Int<Id>`), borrarlo
   rompe el build de esos componentes: recomienda **ocultar**. Con un provisional, el provisional se
   queda para siempre; esas huellas no se tocan aquí, se listan para que su diseñador decida.

## 2. ¿Borrar del todo u ocultar?

**Siempre** pregunta antes de simular, salvo que el usuario ya haya dicho "bórralo del todo":

| Opción | Qué pasa | Cómo se deshace |
|---|---|---|
| Ocultar | Sigue el código; sale del menú, rutas, búsqueda, galería y Status. Skill `ocultar`: `npm run visibility -- hide component <id>`. | `/reactivar` |
| Borrar del todo | Se borra la carpeta y su registro (pasos 3 y 4). | Solo con git, si estaba commiteado |

Si elige ocultar, sigue la skill `ocultar` y termina aquí.

## 3. Simular y confirmar

```bash
npm run remove -- component <id>
```

Sin `--yes` **no borra nada**. Lista:
- la carpeta `src/components/<dir>/` y sus archivos **no commiteados** (⚠: git no podrá restaurarlos);
- `src/components/inventory.ts`: su import y su entrada en `COMPONENT_INVENTORY`;
- `src/page/components/catalog/catalog-groups.ts`: su ID en el grupo y su icono;
- "still mentioned in": otros archivos que lo nombran (guías, ejemplos). Esos **no se editan**:
  enuméralos al usuario para que decida.

Muéstralo en el chat como tabla y pide confirmación explícita, repitiendo el nombre del componente.

## 4. Eliminar

El mismo comando con `--yes`. Luego verifica:

```bash
npm run build
```

Confirma qué se borró y recuerda los archivos que todavía lo mencionan.

## Qué NO hacer

- ❌ Borrar sin la simulación previa y la confirmación del usuario.
- ❌ Eliminar `demo` u otro componente con `reference: true`.
- ❌ Borrar sin avisar que otros componentes lo requieren o lo usan (paso 1.4).
- ❌ Borrar la carpeta a mano o editar `inventory.ts` / `catalog-groups.ts` a mano: usa el script.
- ❌ Editar por tu cuenta los archivos de "still mentioned in" (la guía usa componentes como ejemplo).
