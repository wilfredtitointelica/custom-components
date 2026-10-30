---
name: renombrar-componente
description: Cambia el id (nombre técnico) de un componente int-* en Intelica Components, y con él su URL /components/<id>, su carpeta, sus archivos, su selector <int-id>, sus clases BEM .int-id* y sus clases TypeScript (IntId, IdPage, IdSlugExample), además de inventory.ts y catalog-groups.ts. Opcionalmente cambia también el título visible. Las versiones no se renombran. Úsalo cuando el usuario diga "renombra slider a slidering", "cambia el nombre del componente X", "la URL de X debe ser Y" o /renombrar-componente. Para una variante usar renombrar-variante.
argument-hint: "[componente] [nuevo-id]"
---

# Renombrar un componente

Hay **dos nombres**, y se pueden cambiar juntos o por separado:

| Nombre | Dónde vive | Qué cambia |
|---|---|---|
| **id** (`slider`) | carpeta, archivos, selector, clases, `inventory.ts` | URL `/components/slider`, `<int-slider>`, `.int-slider*`, `IntSlider` |
| **título** (`Slider`) | cabecera `title:` de `version-N/base/<id>.html` | Lo que se ve en el menú y en la página |

Si el usuario solo quiere cambiar **el texto visible**, no hace falta este script: se edita el
`title:` de la cabecera de `base/<id>.html` en la versión más reciente (o en todas).

## 1. Datos y validación

Lo que venga en los argumentos (`/renombrar-componente slider slidering`) o en el mensaje no se vuelve
a preguntar; lo que falte se pregunta **en un solo mensaje**.

1. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede renombrar: el componente **<nombre>** no existe.
2. **Nuevo id**: kebab-case (`Slider Range` → `slider-range`). Si ya existe otro componente con ese
   id, no se hace nada y se avisa.
3. **Título**: pregunta si el título visible también cambia (sugiere uno derivado del id nuevo:
   `slidering` → `Slidering`). Si sí, se pasa `--title`; se actualiza en la cabecera de **todas** las
   versiones y en los comentarios del config, la página y las rutas.

## 2. Simular y confirmar

```bash
npm run rename -- component <id> <nuevo-id> [--title "<Título>"]
```

Sin `--yes` **no cambia nada**. Lista:
- la carpeta que se mueve y cada archivo renombrado o actualizado;
- `inventory.ts` (import y variable) y `catalog-groups.ts` (grupo e icono);
- la URL vieja → nueva, el selector y las clases nuevas;
- "Still mentioned in": otros archivos que nombran el id viejo (la guía, otros componentes). **No se
  editan**: enuméralos.

Muéstralo como tabla y **avisa** antes de pedir confirmación:
- el enlace viejo (`/components/<id>`) deja de funcionar;
- el selector `<int-<id>>` y las clases `.int-<id>*` cambian: cualquier proyecto que ya use el
  componente o los estilos (StyleGuides) tendrá que actualizarse.

## 3. Renombrar

El mismo comando con `--yes`. El script escribe la carpeta nueva y luego borra la vieja (no la renombra
en sitio: en Windows `ng serve` o el editor la bloquean). Si avisa que no pudo borrar la carpeta vieja,
pide al usuario que cierre lo que la usa y la borre a mano. Después:

```bash
npm run build
```

Confirma la URL nueva y recuerda los archivos de "Still mentioned in".

### Dependencias de otros componentes

Si otros componentes lo componen, sus huellas usan el id viejo y `/resolver-dependencias` dejaría de
encontrarlas. Búscalas y muéstralas en la simulación (paso 2), aparte de "Still mentioned in":

```bash
grep -ln "'<id>'" src/components/*/*.config.ts              # requires / uses
grep -rn "dep:<id>\b\|data-dep=\"<id>\"\|TODO(dep:<id>" src/components/
grep -rln "<id>/version-[0-9]*/base/<id>'" src/components/  # imports de Int<Id> (dependencia ya resuelta)
```

Con la misma confirmación del renombre, actualiza **solo esas huellas** al id nuevo: la entrada en
`requires`/`uses`, los marcadores `<!-- dep:<id> provisional … -->` / `<!-- /dep:<id> -->`, `data-dep`,
`TODO(dep:<id> provisional)` y, si ya estaba resuelta, el import, el selector `<int-<id>>` y la clase
`Int<Id>`. Nada más de esos componentes.

## Qué NO hacer

- ❌ Renombrar sin la simulación previa y la confirmación del usuario.
- ❌ Mover carpetas o buscar/reemplazar a mano: el script cubre todas las formas del id
  (kebab, Pascal, `--NOTE-ID`, `@use`, selectores de ejemplos).
- ❌ Renombrar o renumerar las versiones.
- ❌ Editar por tu cuenta los archivos de "Still mentioned in" (salvo las huellas de dependencias de
  la sección anterior, con la confirmación del renombre).
- ❌ Dejar `requires`/`uses` o marcadores `dep:` con el id viejo.
- ❌ Cambiar el título sin preguntarlo: el id y el título son independientes.
