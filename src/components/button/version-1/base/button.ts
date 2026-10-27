import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

import { IntIcon, IntSeverity, IntSize } from '../../../_shared_';

export type IntButtonVariant = 'outlined' | 'text' | 'link';
export type IntButtonIconPos = 'left' | 'right' | 'top' | 'bottom';

/**
 * <button intButton> · version 1. Applied on a native `<button>` or `<a>` so keyboard, form submit
 * and ARIA behave natively. API mirrors PrimeNG v20 Button.
 *
 * Deviation: attribute selector instead of the `<int-button>` element used by the rest of the catalog,
 * to keep native button/link semantics.
 *
 * @example
 * <button intButton label="Save" icon="icon icon-save" (click)="save()"></button>
 * <button intButton severity="secondary" variant="outlined" size="small">Cancel</button>
 * <a intButton variant="link" href="/help">Help</a>
 */
@Component({
  selector: 'button[intButton], a[intButton]',
  templateUrl: './button.html',
  styleUrl: '../styles/_index.scss',
  imports: [IntIcon],
  host: {
    class: 'int-button',
    '[class]': 'modifiers()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
  },
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntButton {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly label = input<string | undefined>(undefined);
  /** CSS class of the icon, e.g. `icon icon-download` (incontrol-icons). */
  readonly icon = input<string | undefined>(undefined);
  readonly iconPos = input<IntButtonIconPos>('left');
  readonly severity = input<IntSeverity>('primary');
  readonly variant = input<IntButtonVariant | undefined>(undefined);
  readonly size = input<IntSize | undefined>(undefined);
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Required for icon-only buttons. */
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  protected readonly iconOnly = computed(() => !!(this.icon() || this.loading()) && !this.label());

  /** BEM modifiers on the host: int-button--<severity|variant|size|icon-pos> plus boolean flags. */
  protected readonly modifiers = computed(() => {
    const modifiers: string[] = [this.severity(), `icon-${this.iconPos()}`];
    if (this.variant()) modifiers.push(this.variant()!);
    if (this.size()) modifiers.push(this.size()!);
    if (this.rounded()) modifiers.push('rounded');
    if (this.fluid()) modifiers.push('fluid');
    if (this.loading()) modifiers.push('loading');
    if (this.iconOnly()) modifiers.push('icon-only');
    return modifiers.map((modifier) => `int-button--${modifier}`).join(' ');
  });
}
