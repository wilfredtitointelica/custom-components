import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { IntConfig, IntIcon, IntSeverity } from '../../../_shared_';

/**
 * <int-pill> · version 1. Short status label backed by the Intelica badge tokens (--i-badge-*).
 * API mirrors PrimeNG v20 Tag (ported from @intelica/ui `int-tag`).
 * Deviation: `removable` / `onRemove` come from PrimeNG Chip (Tag has no close action); a removable
 * pill takes the filter look (blue, fully rounded, border on hover) unless a severity is set, and
 * `ai` switches it to the AI filter look (purple).
 *
 * @example
 * <int-pill value="Active" severity="success" />
 * <int-pill severity="danger" icon="icon icon-alert" rounded>Rejected</int-pill>
 * <int-pill value="Visa" removable (onRemove)="drop('visa')" />
 */
@Component({
  selector: 'int-pill',
  imports: [IntIcon],
  templateUrl: './pill.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-pill',
    '[class]': 'modifiers()',
  },
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntPill {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly value = input<string | number | null>(null);
  /** Undefined renders the default (secondary) look. */
  readonly severity = input<IntSeverity | undefined>(undefined);
  /** CSS class of the icon, e.g. `icon icon-check` (incontrol-icons). */
  readonly icon = input<string | undefined>(undefined);
  readonly rounded = input(false, { transform: booleanAttribute });
  /** Shows the close button that emits `onRemove` (filter look). From PrimeNG Chip. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** AI filter look (purple). Intelica addition, meant for removable pills. */
  readonly ai = input(false, { transform: booleanAttribute });

  /** Emitted with the click event when the close button is pressed; the parent removes the pill. */
  readonly onRemove = output<MouseEvent>();

  protected readonly config = inject(IntConfig);

  /** BEM modifiers on the host: int-pill--<severity> plus int-pill--{rounded,removable,ai}. */
  protected readonly modifiers = computed(() => {
    const modifiers: string[] = [];
    const severity = this.severity() ?? (this.removable() ? undefined : 'secondary');
    if (severity) modifiers.push(severity);
    if (this.rounded()) modifiers.push('rounded');
    if (this.removable()) modifiers.push('removable');
    if (this.ai()) modifiers.push('ai');
    return modifiers.map((modifier) => `int-pill--${modifier}`).join(' ');
  });

  protected remove(event: MouseEvent): void {
    event.stopPropagation();
    this.onRemove.emit(event);
  }
}
