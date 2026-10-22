---
name: renombrar-variante
description: Cambia el nombre de una variante (ejemplo de documentación) de un componente int-* en Intelica Components, y con él su URL /components/<id>#<id>-<slug>, la carpeta variants/<slug>/ en todas las versiones que la tienen, el selector y la clase de su example.ts, el título de su example.html y su entrada en la lista variants del config (conserva la posición). Úsalo cuando el usuario diga "renombra la variante Raiser a Raised", "cambia el nombre del ejemplo X", "la variante X ahora se llama Y" o /renombrar-variante. Para el componente usar renombrar-componente.
argument-hint: "[componente] [variante] [nuevo título]"
---

# Renombrar una variante

El título de una variante es la cabecera `title:` de su `example.html`, y el **slug** (nombre de la
carpeta y parte de la URL) se deriva de él: `Raised Shadow` → `raised-shadow` →
`/components/<id>#<id>-raised-shadow`.

- Si el usuario solo quiere cambiar **el texto visible** y la URL le da igual, basta con editar la
  cabecera de `example.html` (en cada versión que la tenga). Pregúntalo si no está claro.
- Para que la URL también cambie, usa el script: renombra la carpeta y todo lo que depende de ella.

Las **versiones no se renombran**. La variante se renombra en **todas** las versiones que la tienen
(el menú las junta: renombrarla solo en una la partiría en dos entradas).

## 1. Datos y validación

Lo que venga en los argumentos (`/renombrar-variante accordion raiser Raised`) o en el mensaje no se
vuelve a preguntar; lo que falte se pregunta **en un solo mensaje**.

1. **Componente**: id o nombre visible → `id`. Si no existe:
   > No se puede renombrar: el componente **<nombre>** no existe.
2. **Variante**: título o slug actual. Usa `npm run order:variants -- <id>` para ver las variantes,
   sus slugs y versiones, y convertir el título al slug.
3. **Nuevo título**: tal como aparece en la referencia (Excel/Figma). El slug nuevo se deriva de él;
   solo si el usuario pide otro slug distinto, pásalo con `--slug`.

Bloqueos (el script también los aplica):
- La variante no existe → lista las disponibles.
- Ya existe una variante con el slug nuevo → no se hace nada.
- `basic`: su carpeta no se renombra (es la convención de todo componente); solo se puede cambiar su
  título, con el mismo comando y `--slug basic`, o editando la cabecera.

## 2. Simular y confirmar

```bash
npm run rename -- variant <id> <slug> "<Nuevo título>" [--slug <nuevo-slug>]
```

Sin `--yes` **no cambia nada**. Lista las carpetas que se mueven (una por versión), los archivos
actualizados (selector `<id>-<slug>-example`, clase `<Id><Slug>Example`, título), el cambio en
`variants` del config y la URL vieja → nueva. Si existe un módulo SCSS de modificador con el nombre
viejo (`_<id>.<slug>.scss`) lo avisa: no se renombra, lo decide el maquetador.

Muéstralo como tabla, avisa que el enlace viejo `#<id>-<slug>` deja de funcionar y pide confirmación.

## 3. Renombrar

El mismo comando con `--yes`. Confirma el título, el slug y el enlace nuevos. La posición en el menú se
conserva (la entrada del config se actualiza en su sitio).

## Qué NO hacer

- ❌ Renombrar sin la simulación previa y la confirmación del usuario.
- ❌ Renombrar en una sola versión.
- ❌ Mover la carpeta o editar el selector/clase a mano.
- ❌ Tocar el contenido del ejemplo (marcado, datos) ni `base/` o `styles/`.
