import { Component, computed, input, ViewEncapsulation } from '@angular/core';

/** Visual variants of int-demo, slugs from demo.config.ts. "basic" is the base block. */
export type IntDemoVariant = 'basic' | 'outlined';

/** <int-demo> · version 1: title + plain list. */
@Component({
  selector: 'int-demo',
  templateUrl: './demo.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class IntDemo {
  readonly variant = input<IntDemoVariant>('basic');
  readonly title = input('');
  readonly items = input<readonly string[]>([]);

  protected readonly classes = computed(() =>
    this.variant() === 'basic' ? 'int-demo' : `int-demo int-demo--${this.variant()}`,
  );
}
