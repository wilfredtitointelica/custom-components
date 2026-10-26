import { Component, model } from '@angular/core';

/**
 * Switch "Properties" of the Helpers tab (same Material 3 switch as the top bar Code one, toggle-code.ts, on a
 * dark surface, with {} for the braces: primeicons has no such glyph). On: blocks show the properties between
 * their braces; off: only the class names.
 */
@Component({
  selector: 'app-style-guide-code-switch',
  template: `
    <button
      type="button"
      role="switch"
      class="doc-sg-switch"
      [class.doc-is-on]="checked()"
      [attr.aria-checked]="checked()"
      [title]="checked() ? 'Mostrar solo el nombre de las clases' : 'Mostrar las propiedades de cada clase'"
      (click)="checked.set(!checked())"
    >
      <span class="doc-sg-switch-label">Properties</span>
      <span class="doc-sg-switch-track" aria-hidden="true">
        <span class="doc-sg-switch-thumb"><span class="doc-sg-switch-icon">&#123;&#125;</span></span>
      </span>
    </button>
  `,
  styleUrl: './style-guide-code-switch.scss',
})
export class StyleGuideCodeSwitch {
  readonly checked = model(true);
}
