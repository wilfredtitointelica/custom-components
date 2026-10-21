import { Component } from '@angular/core';

/**
 * Incontrol isotype (public/brand/incontrol-isotype.svg).
 * Decorative: the surrounding link provides the accessible name.
 */
@Component({
  selector: 'app-brand-mark',
  template: `<img src="brand/incontrol-isotype.svg" alt="" width="24" height="25" />`,
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
export class BrandMark {}
