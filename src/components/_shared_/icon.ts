import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

/**
 * Icons used by component chrome (chevrons, close, calendar...), mapped to the Intelica
 * incontrol-icons font so components look like the rest of the product.
 * The font is loaded by mf-styleguide inside the Incontrol shell, or by the Intelica
 * Style Guide bundle in this documentation app.
 */
const GLYPHS = {
  'chevron-down': 'icon-arrow-down',
  'chevron-up': 'icon-arrow-up',
  'chevron-left': 'icon-arrow-left',
  'chevron-right': 'icon-arrow-right',
  'chevrons-left': 'icon-arrow-left-double',
  'chevrons-right': 'icon-arrow-right-double',
  close: 'icon-cancel',
  check: 'icon-check',
  plus: 'icon-add',
  minus: 'icon-remove',
  search: 'icon-search',
  calendar: 'icon-calendar',
  upload: 'icon-upload',
  file: 'icon-file',
} as const;

/** `spinner` stays an SVG: the font has no spinner glyph (`icon-loading` is a full circle). */
export type IntIconName = keyof typeof GLYPHS | 'spinner';

@Component({
  selector: 'int-icon',
  template: `
    @if (name() === 'spinner') {
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" focusable="false">
        <path d="M21 12a9 9 0 1 1-6.22-8.56" />
      </svg>
    }
  `,
  styles: `
    .int-icon { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; line-height: 1; }
    .int-icon-spin svg { animation: int-icon-spin 0.8s linear infinite; }
    @keyframes int-icon-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .int-icon-spin svg { animation-duration: 2.4s; } }
  `,
  host: {
    class: 'int-icon',
    '[class]': 'glyphClass()',
    '[class.int-icon-spin]': 'name() === "spinner"',
    'aria-hidden': 'true',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntIcon {
  readonly name = input.required<IntIconName>();
  protected readonly glyphClass = computed(() => {
    const name = this.name();
    return name === 'spinner' ? '' : GLYPHS[name];
  });
}
