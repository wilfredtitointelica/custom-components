---
name: crear-version
description: Crea una nueva versión de implementación (version-N+1) de un componente int-* en Intelica Components, copiando la última versión (latest) con su base, variantes y estilos. Pregunta el componente y si cambian el título o la descripción, y deja la versión nueva en el desplegable de la página. Úsalo cuando el usuario diga "crea una nueva versión", "version 2 de <componente>", "versiona <componente>" o /crear-version. Para un componente nuevo usar crear-componente; para agregar un ejemplo, crear-variante.
argument-hint: "[componente]"
---

# Crear una versión

Abre `src/components/<componente>/version-<N+1>/` como **copia exacta de la última versión**
(`version-<N>`, la de número mayor): `base/`, `variants/` y `styles/`. La copia es el punto de partida
para que el maquetador cambie la implementación; `version-<N>` no se toca y sigue publicada.

> Siempre se parte de la **última versión**, nunca de una anterior ni de otro componente.
> No se escribe código nuevo: los cambios de marcado, lógica y CSS los hace el maquetador en la versión nueva.

## 1. Datos

Lo que venga en los argumentos (`/crear-version button`) o en el mensaje no se vuelve a preguntar; lo
que falte se pregunta en el chat, **todo en un solo mensaje**:

1. **Componente**: el ID o el nombre visible (`button`, `Dropdown / Select`). Para ver los disponibles:
   el `id` de `src/components/*/<id>.config.ts` y el `title:` de la cabecera de su
   `version-N/base/<id>.html`. Conviértelo siempre al `id`. Indica al usuario cuál es la última versión
   (`version-N`) y cuál se va a crear (`version-N+1`).
2. **Título** del componente en la versión nueva: por defecto se conserva el de la última versión.
3. **Descripción** del componente en la versión nueva: por defecto se conserva. Sugiere describir qué
   cambia en esta versión si el usuario lo sabe.

El título y la descripción viven en la cabecera de `version-N+1/base/<id>.html` (nunca en un `.ts`).
El menú y el título de la página usan los de la **versión más reciente**, así que la nueva pasa a
mandar.

## 2. Generar

```bash
npm run new:version -- <id> [--title "<Título>"] [--description "<Descripción>"]
```

Pasa `--title` / `--description` solo si el usuario los cambió. El script:
- busca la carpeta del componente (acepta el id o la carpeta, p. ej. `demo` → `_demo_/`);
- toma la última `version-N` y la copia completa a `version-N+1/` (base, variantes con su código y
  cabeceras, y estilos);
- en `base/<id>.ts` actualiza el comentario `/** <int-<id>> · version N… */` → `version N+1`;
- en `base/<id>.html` reescribe la cabecera solo con los campos dados (el resto del archivo intacto);
- falla sin tocar nada si el componente no existe, no tiene versiones, falta la base o `version-N+1/`
  ya existe;
- al terminar regenera `src/generated/`, así el desplegable de versiones aparece aunque el servidor sea
  un `ng serve` directo.

No copies la carpeta a mano ni partas de otra versión: usa el script.

## 3. Después de generar

- Si el comentario de `base/<id>.ts` tenía un resumen de la versión anterior
  (`· version 2: header with icon…`), avisa al usuario de que ese resumen ahora describe la versión
  vieja y debe ajustarlo el maquetador (no lo inventes).
- Pregunta: **"¿Deseas crear otra variante en la versión nueva?"** (sí / no).
  - **Sí** → seguir la skill **`crear-variante`** (`.claude/skills/crear-variante/SKILL.md`): el
    componente ya se conoce y la versión es la más reciente, solo se preguntan título y descripción.
    Al terminar, repetir la pregunta.
  - **No** → verificar.

Cómo se ve en la documentación:
- Con más de una versión, la página muestra un desplegable que abre por defecto la más reciente;
  cada versión es enlazable con `/components/<id>?version=<N>#<id>-<slug>`.
- Las secciones son la unión de las carpetas `variants/<slug>/` de todas las versiones: si una versión
  no tiene esa carpeta, la sección muestra "Preview pending" con la ruta a crear.
- Una variante que ya no aplica en la versión nueva se borra de `version-N+1/variants/` (solo si el
  usuario lo pide); la de `version-N` se queda.

## 4. Verificar

```bash
npm run build    # el script ya registró la versión en src/generated; no hace falta npm run docs
```

Confirma al usuario la carpeta creada, el número de variantes copiadas y el enlace
`/components/<id>?version=<N+1>`.

## Qué NO hacer

- ❌ Partir de una versión que no sea la última, o de otro componente.
- ❌ Modificar o borrar `version-N` (la anterior sigue publicada mientras se use).
- ❌ Cambiar marcado, lógica o CSS de la versión nueva: lo hace el maquetador.
- ❌ Poner el título o la descripción en `<id>.config.ts` u otro `.ts`: van en la cabecera de
  `version-N+1/base/<id>.html`.
- ❌ Tocar `<id>-page.ts`, `routes.ts`, `inventory.ts`, `<id>.config.ts` ni `src/generated/`.
- ❌ Confundir **versión de implementación** (carpeta `version-N`) con **variante visual** (ej. Tabs
  `V1` / `V2` del Excel, que son modificadores `.int-tabs--v2` dentro de la misma versión).
- ❌ Nombrar la carpeta distinto a `version-<número>` (no se detecta).

Convenciones completas: skill `crear-componente` (`.claude/skills/crear-componente/SKILL.md`,
sección 5 "Crear una version-2").
