# Fuentes de iconos

Generador de fuentes de iconos a partir de SVG exportados de Figma. La carpeta es autocontenida
(su propio `package.json`, dependencias, scripts y configuración): se puede copiar a otro repositorio
tal cual.

Herramienta: [fantasticon](https://github.com/tancredi/fantasticon) 4.1.0, con un parche en
`patches/` (ver [Parche de fantasticon](#parche-de-fantasticon)).

## Comandos

Desde `src/fonts/` (requiere Node ≥ 22):

| Comando | Qué hace |
|---|---|
| `npm ci` | Instala las dependencias fijadas y aplica el parche (`postinstall`). Solo la primera vez o tras actualizar dependencias. |
| `npm run build` | Genera todas las fuentes (hoy solo `incontrol-icons`). |
| `npm run build:incontrol-icons` | Genera solo `incontrol-icons`. |

Desde la raíz de este repositorio: `npm run icons` (equivale a `npm --prefix src/fonts run build`).

## Estructura

```
src/fonts/
├── package.json · package-lock.json
├── patches/fantasticon+4.1.0.patch
├── scripts/build-icons.mjs        # generador (uno para todas las fuentes)
└── incontrol-icons/
    ├── icons.config.mjs           # nombre, prefijo, primer código y nombres de categoría
    ├── templates/css.hbs          # CSS: @font-face + .icon-nombre::before
    ├── templates/html.hbs         # vista previa agrupada por categoría
    ├── source/<categoria>/icon-*.svg
    ├── dist/                      # GENERADO
    └── icons.json                 # GENERADO
```

`dist/` contiene `incontrol-icons.{css,eot,html,json,svg,ttf,woff,woff2}`:

- **css**: una clase por icono, `<i class="icon-search"></i>`.
- **html**: vista previa de todos los iconos por categoría, con buscador; un clic copia la clase.
- **json**: nombre → código Unicode en decimal (`"icon-search": 61698`).

`icons.json` mantiene la jerarquía categoría → iconos:

```json
{
  "name": "incontrol-icons",
  "categories": [
    {
      "category": "Navigation",
      "slug": "navigation",
      "icons": [{ "name": "icon-nav-left", "code": 61697, "unicode": "f101" }]
    }
  ]
}
```

**No edites a mano `dist/` ni `icons.json`**: se reescriben en cada build.

## Agregar o cambiar iconos

1. En Figma, cada icono en un frame cuadrado (24×24) y con los trazos convertidos a relleno:
   *Outline stroke* y luego *Flatten*. Una fuente solo dibuja rellenos; el build avisa si un SVG
   todavía tiene `stroke` (en la vista previa saldría vacío).
2. Exporta como SVG y guárdalo en `incontrol-icons/source/<categoria>/icon-<nombre>.svg`.
   - Categorías y nombres en kebab-case; los nombres empiezan por `icon-`.
   - Un nombre no se puede repetir aunque esté en otra categoría.
   - No hay SVG sueltos en `source/` ni subcarpetas dentro de una categoría.
3. `npm run build` y versiona juntos `source/`, `dist/` e `icons.json`.

Para mostrar una categoría con otro nombre (`business-and-finance` → "Business & finance"), añádela a
`categories` en `icons.config.mjs`. Si no está, se usa el nombre de la carpeta con mayúscula inicial.

## Códigos Unicode estables

Antes de generar, el build lee el `dist/incontrol-icons.json` anterior:

- Un icono que ya existía conserva su código.
- Un icono nuevo toma el primer código libre desde `0xf101` (61697).
- Un icono borrado desaparece y su código queda libre para el siguiente icono nuevo.
- **Renombrar un SVG equivale a borrar uno y crear otro**: el icono puede cambiar de código.

Con las mismas entradas, el build produce exactamente los mismos archivos (byte a byte).

## Parche de fantasticon

`patches/fantasticon+4.1.0.patch` corrige dos fallos de fantasticon 4.1.0. `patch-package` lo aplica
solo al hacer `npm ci` / `npm install`:

1. **Windows**: fantasticon busca los SVG con `glob` usando una ruta con `\`, que glob interpreta como
   escape y no encuentra nada. El parche añade `windowsPathsNoEscape: true`.
2. **EOT no reproducible**: el `.eot` se copiaba con todo el buffer interno de Node (8 KB con restos de
   memoria). El parche copia solo los bytes de la fuente.

Al actualizar fantasticon: cambia la versión en `package.json`, `npm install`. Si `patch-package`
avisa que el parche no aplica, comprueba si la versión nueva ya corrige esos fallos y borra el parche;
si no, recréalo con `npx patch-package fantasticon`. Después, `npm run build` y revisa el diff de `dist/`.

## Otra fuente

Copia `incontrol-icons/` a una carpeta nueva y cambia `name` en su `icons.config.mjs`. Vacía `source/`,
borra su `dist/` e `icons.json` y añade el script en `package.json`:

```json
"build:otra-fuente": "node scripts/build-icons.mjs otra-fuente"
```
