# Intelica Components

Catálogo y documentación de los componentes `int-*` (Angular 20 + SCSS + BEM).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor en http://localhost:5555 (otro puerto: `npm start -- --port 4300`). Recarga con cada cambio y detecta carpetas de variantes nuevas o borradas. |
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

Guías con Claude Code: `/crear-componente` y `/crear-variante` (`.claude/skills/`).
