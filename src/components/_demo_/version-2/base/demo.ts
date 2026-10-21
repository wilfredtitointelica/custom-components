import { Component, computed, input, ViewEncapsulation } from '@angular/core';

/** Visual variants of int-demo, slugs from demo.config.ts. "basic" is the base block. */
export type IntDemoVariant = 'basic' | 'outlined';

/** <int-demo> · version 2: header with icon and counter, accent bar on top. */
@Component({
  selector: 'int-demo',
  templateUrl: './demo.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class IntDemo {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = '';

  readonly variant = input<IntDemoVariant>('basic');
  readonly title = input('');
  /** PrimeIcons class, e.g. "pi-wallet". */
  readonly icon = input('pi-list');
  readonly items = input<readonly string[]>([]);

  protected readonly classes = computed(() =>
    this.variant() === 'basic' ? 'int-demo' : `int-demo int-demo--${this.variant()}`,
  );
}
