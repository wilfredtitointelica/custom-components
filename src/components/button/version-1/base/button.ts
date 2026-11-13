import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

import { IntIcon, IntSeverity, IntSize } from '../../../_shared_';

export type IntButtonVariant = 'outlined' | 'text' | 'link';
export type IntButtonIconPos = 'left' | 'right' | 'top' | 'bottom';

/**
 * <button intButton> · version 1. Applied on a native `<button>` or `<a>` so keyboard, form submit
 * and ARIA behave natively. API mirrors PrimeNG v20 Button.
 *
 * Same pair as PrimeNG: this is `pButton`; the element form `<int-button>` (`p-button`) is
 * `IntButtonElement` in ./button-element and renders this component on a native `<button>`.
 *
 * @example
 * <button intButton label="Save" icon="icon icon-check" (click)="save()"></button>
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
    '[attr.tabindex]': 'isDisabled() && isAnchor ? -1 : null',
    '[attr.aria-pressed]': 'active() ?? null',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-label]': 'ariaLabel() ?? (labelOnHover() ? label() : null) ?? null',
  },
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntButton {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly label = input<string | undefined>(undefined);
  /** CSS class of the icon, e.g. `icon icon-download` (incontrol-icons). */
  readonly icon = input<string | undefined>(undefined);
  readonly iconPos = input<IntButtonIconPos>('left');
  readonly severity = input<IntSeverity>('primary');
  /**
   * `text` with an icon and no label renders the Style Guide `.prButton--icon` look: a bare icon in a
   * 24px box (16px small, 32px large) that turns blue on hover.
   */
  readonly variant = input<IntButtonVariant | undefined>(undefined);
  readonly size = input<IntSize | undefined>(undefined);
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Required for icon-only buttons. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /**
   * int-* extension (Figma button-help): the label is hidden until hover or keyboard focus; it stays
   * the accessible name.
   */
  readonly labelOnHover = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: mantiene el aspecto presionado (`active`) y marca `aria-pressed`, p. ej. el rango
   * predefinido elegido en el pie de `int-date-picker`.
   */
  readonly active = input<boolean | undefined>(undefined);

  protected readonly isDisabled = computed(() => this.disabled() || this.loading());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Anchors ignore the disabled attribute natively: the base blocks their navigation and clicks. */
  protected readonly isAnchor = this.host.tagName === 'A';

  constructor() {
    // Capture on the host runs before any (click) bound on it. No pointer-events: none in the SCSS,
    // it would hide the not-allowed cursor.
    if (this.isAnchor)
      this.host.addEventListener(
        'click',
        (event) => {
          if (!this.isDisabled()) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        { capture: true },
      );
  }
  protected readonly iconOnly = computed(() => !!(this.icon() || this.loading()) && !this.label());

  /** BEM modifiers on the host: int-button--<severity|variant|size|icon-pos> plus boolean flags. */
  protected readonly modifiers = computed(() => {
    const modifiers: string[] = [this.severity(), `icon-${this.iconPos()}`];
    if (this.variant()) modifiers.push(this.variant()!);
    if (this.size()) modifiers.push(this.size()!);
    if (this.rounded()) modifiers.push('rounded');
    if (this.fluid()) modifiers.push('fluid');
    if (this.labelOnHover()) modifiers.push('label-on-hover');
    if (this.active()) modifiers.push('active');
    if (this.loading()) modifiers.push('loading');
    if (this.iconOnly()) modifiers.push('icon-only');
    return modifiers.map((modifier) => `int-button--${modifier}`).join(' ');
  });
}
