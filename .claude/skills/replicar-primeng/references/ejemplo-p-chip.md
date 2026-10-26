# Ejemplo: replicar `p-chip`

Recorrido de referencia para `Replica p-chip de PrimeNG v20`. Los datos salen de
`primeng/fesm2022/primeng-chip.mjs`, `primeng/chip/index.d.ts`, `@primeuix/styles/dist/chip` y
`@primeuix/themes/dist/aura/chip` (primeng 20.4.0). Si al ejecutarla algo no coincide con
`node_modules`, manda `node_modules`.

## Fase 1 · Inspección

**Componente destino (siempre se pregunta)**: no existe `src/components/chip/`; el candidato es `pill`
("Pill"). Pregunta: "¿En qué componente replico `p-chip`? Sugerencia: `pill` (version-1)".

- Responde `chip` → no existe: "Créalo primero con `/crear-componente` y vuelve a pedir la réplica
  con `/replicar-primeng p-chip`". Fin.
- Responde `pill` → se revisa `pill/version-1` (1.2). Lo que esté en plantilla se completa con el id
  `pill` (selector `int-pill`, clases `.int-pill__*`; no se renombra). Si algo está customizado, se lista
  y se pregunta: completar solo la plantilla, forzar o cancelar.

El resto del ejemplo usa `chip` como id, como si `/crear-componente chip` ya se hubiera ejecutado y
todo estuviera en plantilla.

**Inventario**

| Tipo | Nombre | Tipo TS | Default | Notas |
|---|---|---|---|---|
| Input | `label` | `string` | — | texto en `.p-chip-label`; también `aria-label` del host |
| Input | `icon` | `string` | — | clase de icono; solo se pinta si no hay `image` |
| Input | `image` | `string` | — | `src` de la imagen; tiene prioridad sobre `icon` |
| Input | `alt` | `string` | — | `alt` de la imagen |
| Input | `disabled` | `boolean` | `false` | `booleanAttribute`; `.p-disabled` (opacity 0.6, sin eventos); `tabindex=-1` en el botón de quitar |
| Input | `removable` | `boolean` | `false` | `booleanAttribute`; muestra el icono de quitar |
| Input | `removeIcon` | `string` | — | clase del icono de quitar; por defecto SVG `TimesCircleIcon` |
| Input | `styleClass` | `string` | — | `@deprecated` v20 → usar `class`. **Fuera de alcance** |
| Input | `chipProps` | `ChipProps` | — | copia props a la instancia. **Fuera de alcance** (bindear inputs) |
| Output | `onRemove` | `MouseEvent` (también `KeyboardEvent`) | — | al hacer clic o Enter/Backspace en quitar; oculta el chip |
| Output | `onImageError` | `Event` | — | `error` del `<img>` |
| Template | `#removeicon` | sin contexto | — | reemplaza el icono de quitar |
| Contenido | `<ng-content>` | — | — | antes de imagen/icono/label (template libre) |
| Estado | `visible` | `boolean` | `true` | `close()` lo pone en `false` → `display: none` en el host |
| A11y | host `aria-label=label`; quitar: `role="button"`, `tabindex` 0/-1, `aria-label` = locale `aria.removeLabel` ("Remove") | | | teclas Enter y Backspace |
| Dependencias | `BaseComponent`, `Bind`, `PrimeTemplate`, `TimesCircleIcon`, `CommonModule`, `TranslationKeys` | | | todas se eliminan |

No tiene `severity`, `size` ni `variant`: **no** se crean variantes ni módulos para eso.

## Fase 2 · Plan

```
src/components/chip/                                     (creado antes con /crear-componente; config, routes y page no se tocan)
└── version-1/
    ├── base/chip.ts · chip.html                         (plantilla → se completa; cabecera, status y designer se conservan)
    ├── styles/_index.scss · _chip.scss                  (sin módulos: el único modificador es --disabled, estado común → base)
    └── variants/basic (existe, plantilla → se completa) · icon · image · removable · template · disabled (nuevas)
```

Reemplazos: `TimesCircleIcon` → `pi pi-times-circle`; `TranslationKeys.ARIA.removeLabel` → input
`removeAriaLabel = 'Remove'` (extensión `int-*`); `pTemplate` → solo `#removeicon` con `contentChild`.

Variantes y orden (documentación de PrimeNG: Basic, Icon, Image, Template):
`npm run order:variants -- chip basic icon image template removable disabled`.

## Fase 3 · Base (esqueleto esperado)

```ts
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, input, output, signal,
  TemplateRef, ViewEncapsulation,
} from '@angular/core';

/** <int-chip> · version 1. Replica of PrimeNG v20 p-chip: label, icon or image, optional remove action. */
@Component({
  selector: 'int-chip',
  imports: [NgTemplateOutlet],
  templateUrl: './chip.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: the host is the chip; removing it hides the host.
  host: {
    '[class]': 'classes()',
    '[style.display]': "visible() ? null : 'none'",
    '[attr.aria-label]': 'label()',
  },
})
export class IntChip {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = '';

  readonly label = input<string>();
  /** Icon class (e.g. "pi pi-user"); ignored when an image is set. */
  readonly icon = input<string>();
  readonly image = input<string>();
  readonly alt = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });
  /** Icon class of the remove action; defaults to pi-times-circle. */
  readonly removeIcon = input<string>();
  /** int-* extension: PrimeNG reads this label from its global locale (aria.removeLabel). */
  readonly removeAriaLabel = input('Remove');

  /** Emitted when the chip is removed by click, Enter or Backspace. */
  readonly onRemove = output<MouseEvent | KeyboardEvent>();
  readonly onImageError = output<Event>();

  /** Custom remove icon: <ng-template #removeicon>…</ng-template>. */
  protected readonly removeIconTemplate = contentChild<TemplateRef<unknown>>('removeicon');

  /** False once removed; the host stays in the DOM, as in PrimeNG. */
  protected readonly visible = signal(true);

  protected readonly classes = computed(() =>
    this.disabled() ? 'int-chip int-chip--disabled' : 'int-chip',
  );
  protected readonly iconClass = computed(() => `int-chip__icon ${this.icon()}`);
  protected readonly removeIconClass = computed(() =>
    this.removeIconTemplate()
      ? 'int-chip__remove-icon'
      : `int-chip__remove-icon ${this.removeIcon() ?? 'pi pi-times-circle'}`,
  );

  protected close(event: MouseEvent | KeyboardEvent): void {
    this.visible.set(false);
    this.onRemove.emit(event);
  }

  /** Same keys as PrimeNG: Enter and Backspace remove the chip. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Backspace') {
      this.close(event);
    }
  }
}
```

```html
<!--
  title: Chip
  description: Chip represents people using icons, labels and images.
  figma:
-->
<!-- Free content goes first, as in PrimeNG (template usage). -->
<ng-content />

<!-- The image takes precedence over the icon. -->
@if (image()) {
  <img class="int-chip__image" [src]="image()" [alt]="alt()" (error)="onImageError.emit($event)" />
} @else if (icon()) {
  <span [class]="iconClass()"></span>
}

@if (label()) {
  <div class="int-chip__label">{{ label() }}</div>
}

<!-- Remove action: focusable unless disabled; Enter/Backspace handled in onKeydown. -->
@if (removable()) {
  <span
    role="button"
    [class]="removeIconClass()"
    [attr.tabindex]="disabled() ? -1 : 0"
    [attr.aria-label]="removeAriaLabel()"
    (click)="close($event)"
    (keydown)="onKeydown($event)"
  >
    @if (removeIconTemplate(); as template) {
      <ng-container [ngTemplateOutlet]="template" />
    }
  </span>
}
```

## Fase 3 · Estilos (extracto de `_chip.scss`)

```scss
:root {
  --NOTE-CHIP: 'int-chip ( Custom )';
  --int-chip-background: var(--i-color-grey-100);        // Aura: {surface.100} #f1f5f9
  --int-chip-color: var(--i-color-grey-800);             // Aura: {surface.800} #1e293b
  --int-chip-border-radius: var(--i-border-radius-200);       // Aura: 16px (no xs–xl alias)
  --int-chip-padding-x: var(--i-spacing-container-lg);       // Aura: 0.75rem
  --int-chip-padding-y: var(--i-spacing-container-md);       // Aura: 0.5rem
  --int-chip-gap: var(--i-spacing-gap-sm);                   // Aura: 0.5rem
  --int-chip-icon-size: var(--i-sizing-xs);                  // Aura: 1rem
  --int-chip-image-size: var(--i-sizing-lg);                 // Aura: 2rem
  --int-chip-transition-duration: var(--i-motion-duration-fast); // Aura: 0.2s (Style Guide: 150ms)
  --int-chip-disabled-opacity: var(--i-opacity-semi);            // Aura: 0.6 (Style Guide: 0.5)
  // … focus ring: width, style, color, offset
}

.int-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--int-chip-gap);
  padding-block: var(--int-chip-padding-y);
  padding-inline: var(--int-chip-padding-x);
  border-radius: var(--int-chip-border-radius);
  background: var(--int-chip-background);
  color: var(--int-chip-color);

  // PrimeNG: .p-chip:has(.p-chip-remove-icon) / :has(.p-chip-image)
  &:has(.int-chip__remove-icon) { padding-inline-end: var(--int-chip-padding-y); }
  &:has(.int-chip__image) { padding-block: calc(var(--int-chip-padding-y) / 2); }
}
// ELEMENTS: &__icon, &__image (margin-inline-start: calc(-1 * padding-y)), &__label,
//           &__remove-icon (+ :focus-visible con el focus ring)
// MODIFIERS: &--disabled { opacity; pointer-events: none; user-select: none; cursor: default }
// SKELETON: .sk-chip con alto 32px, ancho fijo y radio del chip
```

## Fase 3 · Variantes

| Slug | Demuestra | Datos en `example.ts` |
|---|---|---|
| `basic` | `label` | — |
| `icon` | `icon` + `label` | — |
| `image` | `image` + `alt` + `label`; error de imagen → `onImageError` | — |
| `removable` | `removable`, `onRemove`, `removeIcon` | `signal` con la lista de chips: `onRemove` la actualiza con `update(list => list.filter(…))` |
| `template` | `<ng-content>` libre y `#removeicon` | — |
| `disabled` | `disabled` (sin foco ni clic en quitar) | — |

Ejemplo de `removable/example.ts`:

```ts
import { Component, signal } from '@angular/core';

import { IntChip } from '../../base/chip';

interface ChipItem {
  readonly id: number;
  readonly label: string;
}

// Demo data for this example only.
const MOCK_CHIPS: readonly ChipItem[] = [
  { id: 1, label: 'Action' },
  { id: 2, label: 'Comedy' },
  { id: 3, label: 'Mystery' },
];

@Component({
  selector: 'chip-removable-example',
  templateUrl: './example.html',
  imports: [IntChip],
})
export class ChipRemovableExample {
  protected readonly chips = signal(MOCK_CHIPS);

  protected remove(id: number): void {
    this.chips.update((chips) => chips.filter((chip) => chip.id !== id));
  }
}
```

```html
<!--
  title: Removable
  description: removable shows a remove action; click, Enter or Backspace on it emits onRemove and hides the chip.
-->
@for (chip of chips(); track chip.id) {
  <int-chip [label]="chip.label" removable (onRemove)="remove(chip.id)" />
}
```

## Fase 4–5 · Lo que debe reportar

- `npm run build` y `npm test` con su resultado real; greps de la fase 4 vacíos.
- Diferencias: paleta del Style Guide en lugar de emerald/slate; `pt`, `unstyled`, `dt`, `styleClass`,
  `chipProps` y `pTemplate` fuera de alcance; `removeAriaLabel` como extensión; icono de quitar con
  `pi-times-circle` (font) en vez del SVG `TimesCircleIcon`.
- Siguiente paso sugerido: `/cambiar-estado chip done` cuando el maquetador lo valide visualmente.
