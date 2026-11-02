import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  input,
} from '@angular/core';

import { IntSeverity, IntSize } from '../../../_shared_';

/**
 * <int-tag> · version 1. Replica of PrimeNG v20 p-tag without PrimeNG at runtime, backed by the
 * Intelica badge tokens (--i-badge-*). Replaces int-pill; the removable filter look moves to int-chip.
 * Deviation: the label element only renders when `value` is set, so projected content has no empty gap.
 *
 * @example
 * <int-tag value="Active" severity="success" />
 * <int-tag severity="danger" icon="icon icon-alert" rounded>Rejected</int-tag>
 */
@Component({
  selector: 'int-tag',
  imports: [NgTemplateOutlet],
  templateUrl: './tag.html',
  styleUrl: '../styles/_index.scss',
  // Same root as PrimeNG: p-tag puts its root classes on the host element.
  host: { '[class]': 'classes()' },
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntTag {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Valor que se muestra dentro del tag. */
  readonly value = input<string | number | null | undefined>(undefined);
  /**
   * Tipo de severidad del tag. int-* extension: sin severity se aplica el estilo secondary del Style
   * Guide (en PrimeNG el estilo por defecto es primary).
   */
  readonly severity = input<IntSeverity | null | undefined>(undefined);
  /** Clase del icono que se muestra junto al valor, p. ej. `icon icon-check` (incontrol-icons). */
  readonly icon = input<string | undefined>(undefined);
  /** Si las esquinas del tag son completamente redondeadas. */
  readonly rounded = input(false, { transform: booleanAttribute });
  /** int-* extension: tamaño del tag (Figma): `small` 24px, sin valor 32px (medium), `large` 36px. */
  readonly size = input<IntSize | undefined>(undefined);
  /**
   * Clase de estilo del componente.
   * @deprecated desde PrimeNG v20: usar `class`.
   */
  readonly styleClass = input<string | undefined>(undefined);

  /** Template personalizado del icono (`<ng-template #icon>`); reemplaza al input `icon`. */
  protected readonly iconTemplate = contentChild<TemplateRef<unknown>>('icon', { descendants: false });

  protected readonly hasValue = computed(() => {
    const value = this.value();
    return value !== null && value !== undefined;
  });

  /** int-tag int-tag--<severity> [int-tag--<size>] [int-tag--rounded] [styleClass]. */
  protected readonly classes = computed(() =>
    [
      'int-tag',
      `int-tag--${this.severity() ?? 'secondary'}`,
      this.size() ? `int-tag--${this.size()}` : '',
      this.rounded() ? 'int-tag--rounded' : '',
      this.styleClass() ?? '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
