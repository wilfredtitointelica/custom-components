# Intelica Components · guía para agentes de IA

Instrucciones para cualquier IA (Claude, Copilot, Cursor…) que replique o maquete un componente `int-*`
en este repo. Las reglas completas están en `.claude/skills/` (en especial `replicar-primeng/SKILL.md`
y `crear-componente/SKILL.md`); esto es lo mínimo para no salirse de ellas.

## Orden de prioridad de fuentes

1. **PrimeNG v20** (`node_modules/primeng`, `@primeuix/styles`, `@primeuix/themes`): API, estructura,
   comportamiento, teclado, ARIA y animaciones. Se lee, nunca se importa.
2. **Base de conocimientos** (`Intelica.knowledgeBase`, `Desarrollo/Estandares/Diseño/components/<nombre>.md`):
   solo los casos `.pr*` definen estilos, variantes y casos de uso. Se ignoran `.pt*`, `.ly*`, `.gr*`.
3. **Style Guide** (`Intelica.Style.Guide.New`): CSS de las clases `.pr*`, tokens `--i-*`, helpers `.u-*`.
4. **Figma**: solo referencia visual. No define variantes ni valores.

## Estructura de un componente

```
src/components/<id>/version-N/
  base/<id>.ts       clase Int<Id>, selector int-<id>; primeras líneas: static status y static designer
  base/<id>.html     cabecera <!-- title / description / figma --> + marcado BEM
  styles/_index.scss solo @use
  styles/_<id>.scss  TOKENS (:root) · BLOCK · ELEMENTS · MODIFIERS · SKELETON
  styles/_<id>.<grupo>.scss  un módulo por grupo de modificadores
  variants/<slug>/example.ts + example.html   (variants/basic/ siempre)
```

- Sin `.component.ts`, sin `.css`, sin `variants/default/`. Variantes nuevas: `npm run new:variant`.
- Angular 20: Signals, `OnPush`, control flow `@if`/`@for`, nombres de inputs/outputs **iguales a PrimeNG**.
- Nada de `primeng`, `@primeuix`, `@angular/animations`, `any`, `::ng-deep`, clases `p-*` ni clases del
  Style Guide (`.prX`, `.ptX`, `.lyX`, `.grX`, `row`, `col-*`).

## Estilos y tokens

- Cada valor es un token del componente que apunta a uno del Style Guide, con su origen comentado:
  ```scss
  --int-chip-gap: var(--i-spacing-gap-xs); // knowledgeBase: --i-spacing-gap-xs · Figma: 4px (spacing/gap/xs) · Aura: 0.5rem
  ```
- Sin literales (`#hex`, `px`, `0.2s`). Duraciones con `--i-motion-*`, `prefers-reduced-motion` si hay
  animación, foco con `:focus-visible`.
- Contenido dentro de los templates de las variantes: helpers `.u-*`, nunca `style` inline.
- Sin rastros de PrimeNG en lo visible: nada de imágenes, logos o URLs de `primefaces.org`. Una imagen de
  ejemplo es un placeholder con fondo del Style Guide (`u-background-surface` + icono `pi pi-image`).
- Estado y accesibilidad viven en el componente: si falta un estado (p. ej. `disabled` en card), se
  agrega como input y la base resuelve `tabindex`, `role`, `aria-*` y teclado. Las variantes no ponen
  `[attr.aria-*]`, `[attr.tabindex]`, `role` ni `(keydown.*)` sobre un `<int-*>`.
- Las adaptaciones de comportamiento que documenta la base de conocimientos (opción *All* fija en un
  select, iconos de orden propios en una tabla…) se implementan nativas como extensión
  `/** int-* extension */`; no se vuelve al comportamiento de PrimeNG.

## Dependencias entre componentes

Si el componente usa otro `int-*` que aún no está en `done`, se deja un provisional marcado y se declara
en `requires` (lo usa la base) o `uses` (solo una variante) de `<id>.config.ts`:

```html
<!-- dep:checkbox provisional · replace with <int-checkbox> when checkbox is done -->
<input type="checkbox" class="int-multi-select__checkbox" data-dep="checkbox" />
<!-- /dep:checkbox -->
```

## Antes de subir

```bash
npm run check:component -- <id>   # 0 errores
npm run build
```

Si el trabajo se hizo fuera del repo y no pasa el check, en Claude Code se alinea con `/estandarizar-componente <id>`.
