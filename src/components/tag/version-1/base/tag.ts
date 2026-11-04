import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Severities of p-tag plus `caution` (int-* extension, the Caution state of the design system). */
export type IntTagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | 'caution';

/** int-* extension: size of the tag; without a value the tag is medium. */
export type IntTagSize = 'small' | 'large';

/**
 * <int-tag> · version 1. Replica of PrimeNG v20 p-tag without PrimeNG at runtime.
 * A status label: free content, optional icon and the value, colored by severity.
 */
@Component({
  selector: 'int-tag',
  templateUrl: './tag.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-tag puts its root classes on the host element.
  host: {
    '[class]': 'classes()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class IntTag {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Valor que se muestra dentro del tag. */
  readonly value = input<string | number>();
  /**
   * Severidad del tag: `success`, `secondary`, `info`, `warn`, `danger` o `contrast`. Sin valor usa el
   * color primario. int-* extension: `caution`.
   */
  readonly severity = input<IntTagSeverity | null>();
  /** Icono que se muestra junto al valor (p. ej. `icon icon-check`). */
  readonly icon = input<string>();
  /** Esquinas redondeadas. El tag ya es una pastilla por defecto, así que no cambia el aspecto. */
  readonly rounded = input(false, { transform: booleanAttribute });
  /** int-* extension: tamaño del tag, `small` o `large`; sin valor es mediano. */
  readonly size = input<IntTagSize | null>();
  /** int-* extension: estado deshabilitado; pisa los colores de la severidad. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Template del icono: `<ng-template #icon>…</ng-template>`; reemplaza al input `icon`. */
  protected readonly iconTemplate = contentChild<TemplateRef<unknown>>('icon', { descendants: false });

  /** Block plus active modifiers, as PrimeNG's root classes. */
  protected readonly classes = computed(() => {
    const severity = this.severity();
    const size = this.size();
    return [
      'int-tag',
      severity ? `int-tag--${severity}` : '',
      size ? `int-tag--${size}` : '',
      this.rounded() ? 'int-tag--rounded' : '',
      this.disabled() ? 'int-tag--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly iconClass = computed(() => `int-tag__icon ${this.icon() ?? ''}`.trim());

  protected readonly hasValue = computed(() => {
    const value = this.value();
    return value !== undefined && value !== null && value !== '';
  });
}
