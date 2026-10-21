import { Component, computed, inject } from '@angular/core';

import { CodeVisibility } from '../../service/code-visibility';
import { NavigationState } from '../../service/navigation-state';

/** Switch that shows/hides the code panel of the selected variant (the one in the URL fragment). */
@Component({
  selector: 'app-toggle-code',
  template: `
    <button
      type="button"
      role="switch"
      class="toggle-code"
      [class.is-on]="isOn()"
      [attr.aria-checked]="isOn()"
      [disabled]="!target()"
      [title]="target() ? (isOn() ? 'Hide code' : 'Show code') + ' for the selected variant' : 'Select a variant to view its code'"
      (click)="toggle()"
    >
      <span class="toggle-label">Code</span>
      <span class="toggle-track" aria-hidden="true">
        <span class="toggle-thumb"><i class="pi pi-code"></i></span>
      </span>
    </button>
  `,
  styleUrl: './toggle-code.scss',
})
export class ToggleCode {
  private readonly nav = inject(NavigationState);
  private readonly code = inject(CodeVisibility);

  protected readonly target = this.nav.activeVariantId;
  protected readonly isOn = computed(() => {
    const target = this.target();
    return !!target && this.code.isVisible(target);
  });

  protected toggle(): void {
    const target = this.target();
    if (target) this.code.toggle(target);
  }
}
