import { Component, inject } from '@angular/core';

import { CodeVisibility } from '../../service/code-visibility';

/** Global switch: shows/hides the code panels of every variant (each variant also has its own button). */
@Component({
  selector: 'app-toggle-code',
  template: `
    <button
      type="button"
      role="switch"
      class="doc-toggle-code"
      [class.doc-is-on]="code.allVisible()"
      [attr.aria-checked]="code.allVisible()"
      [title]="(code.allVisible() ? 'Hide' : 'Show') + ' code for all variants'"
      (click)="code.setAll(!code.allVisible())"
    >
      <span class="doc-toggle-label">Code</span>
      <span class="doc-toggle-track" aria-hidden="true">
        <span class="doc-toggle-thumb"><i class="pi pi-code"></i></span>
      </span>
    </button>
  `,
  styleUrl: './toggle-code.scss',
})
export class ToggleCode {
  protected readonly code = inject(CodeVisibility);
}
