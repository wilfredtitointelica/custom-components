# Intelica Components

Catálogo y documentación de los componentes `int-*` (Angular 20 + SCSS + BEM).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor en http://localhost:4321 (otro puerto: `npm start -- --port 4300`). Recarga con cada cambio y detecta carpetas de variantes nuevas o borradas. |
| `npm run new:variant -- <id> "<Título>" --description "<Descripción>"` | Crea `version-N/variants/<slug>/` (`example.ts` + `example.html` vacío → "Preview pending"). |
| `npm run docs` | Regenera `src/generated/` (lo hacen solos `npm start`, `npm run build`, `npm test` y `new:variant`). |
| `npm run build` | Build de producción en `dist/`. |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Tests unitarios. |

## Cómo se documenta un componente

- Cada componente vive en `src/components/<id>/version-N/` con `base/`, `variants/` y `styles/`.
- Las variantes son las carpetas `variants/<slug>/` que existen: se detectan solas, `basic` primero.
- Título y descripción se escriben en la cabecera del HTML, nunca en TS:
  `base/<id>.html` para el componente y `variants/<slug>/example.html` para cada variante.

  ```html
  <!--
    title: Raised
    description: Raised buttons display a shadow to indicate elevation.
  -->
  ```

- Un `example.html` vacío o solo con comentarios se muestra como "Preview pending".
- Referencia completa: `src/components/_demo_/`.

- Estado de cada versión: `static readonly status: 'pending' | 'in-progress' | 'done'` en la clase de
  `base/<id>.ts` (chip de la página). Se cambia con `npm run set:status -- <id> <estado>`.
- Diseñador a cargo: `static readonly designer = '<Nombre completo>'` debajo de `status`. Se ve en la
  página del componente y, con el avance por componente y por diseñador, en Reference → Status.
  Colores de cada diseñador: `src/service/designers.ts`.
- `guide` y `status` son ids reservados (páginas de Reference): ningún componente puede usarlos.

## Estilos: documentación vs. componentes

- La documentación (`src/styles.scss`, `src/app`, `src/core`, `src/page`) usa solo clases `.doc-*`
  (incluidos los estados: `.doc-is-active`, `.doc-is-open`…) y tokens `--doc-*`
  (`--doc-primary`, `--doc-radius-sm`, `--doc-font-sans`…), definidos en `src/styles.scss`.
- Los componentes usan clases `.int-*` y no deben usar clases ni tokens `doc`: sus tokens vendrán
  del design system.
- Ninguna regla global de la documentación apunta a una etiqueta sola: `html.doc-html` y
  `body.doc-body` (clases en `src/index.html`). Además, un "escudo" en `src/styles.scss` deshace,
  solo dentro de la documentación, los resets de etiquetas de otras hojas (Style Guide: `text-wrap`
  en títulos, `font`/`color` en controles, `height` en `img`/`svg`…). Lo que se renderiza en
  `.doc-preview` (los ejemplos `int-*`) queda fuera: ahí sí aplican esos resets.

Guías con Claude Code: `/crear-componente`, `/crear-variante`, `/crear-version` y `/cambiar-estado`
(`.claude/skills/`). En la app: menú Reference → Skills.
