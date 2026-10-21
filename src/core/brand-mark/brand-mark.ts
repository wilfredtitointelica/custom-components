import { booleanAttribute, Component, computed, input } from '@angular/core';

/**
 * Incontrol brand (assets in public/brand).
 * `isotype` = symbol only, `logo` = symbol + wordmark; `negative` = white version for dark surfaces.
 * Decorative: the surrounding link provides the accessible name.
 */
@Component({
  selector: 'app-brand-mark',
  template: `<img [src]="src()" alt="" [width]="size().width" [height]="size().height" />`,
  styles: `
    :host {
      display: inline-flex;
    }
    img {
      display: block;
      width: auto;
      height: var(--brand-h, 32px);
    }
  `,
})
export class BrandMark {
  readonly variant = input<'isotype' | 'logo'>('isotype');
  readonly negative = input(false, { transform: booleanAttribute });

  protected readonly src = computed(
    () => `brand/incontrol-${this.variant()}${this.negative() ? '--negative' : ''}.svg`,
  );
  protected readonly size = computed(() =>
    this.variant() === 'logo' ? { width: 126, height: 25 } : { width: 24, height: 25 },
  );
}
