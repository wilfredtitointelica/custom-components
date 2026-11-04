import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  signal,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/**
 * <int-chip> · version 1. Replica of PrimeNG v20 p-chip without PrimeNG at runtime.
 * Label with an optional image or icon and an optional remove action that hides the chip.
 */
@Component({
  selector: 'int-chip',
  templateUrl: './chip.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
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
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Texto del chip. */
  readonly label = input<string>();
  /** Icono que va antes del texto (p. ej. `icon icon-user`); no se muestra si hay `image`. */
  readonly icon = input<string>();
  /** URL de la imagen que va antes del texto; tiene prioridad sobre `icon`. */
  readonly image = input<string>();
  /** Texto alternativo de la imagen. */
  readonly alt = input<string>();
  /** Deshabilita el chip: la acción de quitar no recibe foco ni responde a clic o teclado. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Muestra la acción de quitar al final del chip. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Icono de la acción de quitar; por defecto `icon icon-cancel`. */
  readonly removeIcon = input<string>();
  /** int-* extension: etiqueta accesible de la acción de quitar (PrimeNG la toma de su locale global). */
  readonly removeAriaLabel = input('Remove');

  /** Se emite al quitar el chip con clic, `Enter` o `Backspace`. */
  readonly onRemove = output<MouseEvent | KeyboardEvent>();
  /** Se emite si la imagen no carga. */
  readonly onImageError = output<Event>();

  /** Template del icono de quitar: `<ng-template #removeicon>…</ng-template>`. */
  protected readonly removeIconTemplate = contentChild<TemplateRef<unknown>>('removeicon', { descendants: false });

  /** False once removed; the host stays in the DOM with display: none, as in PrimeNG. */
  protected readonly visible = signal(true);

  protected readonly classes = computed(() => (this.disabled() ? 'int-chip int-chip--disabled' : 'int-chip'));
  protected readonly iconClass = computed(() => `int-chip__icon ${this.icon() ?? ''}`.trim());
  protected readonly removeIconClass = computed(() =>
    this.removeIconTemplate()
      ? 'int-chip__remove-icon'
      : `int-chip__remove-icon ${this.removeIcon() ?? 'icon icon-cancel'}`,
  );

  protected close(event: MouseEvent | KeyboardEvent): void {
    // PrimeNG relies on pointer-events: none; here the handler ignores a disabled chip.
    if (this.disabled()) return;
    this.visible.set(false);
    this.onRemove.emit(event);
  }

  /** Same keys as PrimeNG: Enter and Backspace remove the chip. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Backspace') {
      event.preventDefault();
      this.close(event);
    }
  }
}
