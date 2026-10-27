import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { IntSeverity } from '../../../_shared_';

/**
 * <int-pill> · version 1. Short status label backed by the Intelica badge tokens (--i-badge-*).
 * API mirrors PrimeNG v20 Tag (ported from @intelica/ui `int-tag`).
 *
 * @example
 * <int-pill value="Active" severity="success" />
 * <int-pill severity="danger" icon="icon icon-alert" rounded>Rejected</int-pill>
 */
@Component({
  selector: 'int-pill',
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

  /** BEM modifiers on the host: int-pill--<severity> plus int-pill--rounded. */
  protected readonly modifiers = computed(() => {
    const modifiers: string[] = [this.severity() ?? 'secondary'];
    if (this.rounded()) modifiers.push('rounded');
    return modifiers.map((modifier) => `int-pill--${modifier}`).join(' ');
  });
}
