import { Component, computed, inject, input } from '@angular/core';
import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { Router } from '@angular/router';

import { ComponentVersion } from '../../service/catalog.model';
import { VERSION_QUERY_PARAM } from '../../service/component-catalog';

/**
 * Version dropdown of the documentation page, shown once a component has more than one version-N
 * folder. The selection lives in ?version=<N> so links can be shared; the #variant is kept.
 */
@Component({
  selector: 'app-version-picker',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItemRadio],
  template: `
    <button
      type="button"
      class="doc-version-trigger"
      [cdkMenuTriggerFor]="menu"
      [attr.aria-label]="'Version ' + active()?.number + ', change version'"
    >
      <i class="pi pi-tag" aria-hidden="true"></i>
      Version {{ active()?.number }}
      <i class="pi pi-chevron-down doc-version-trigger-arrow" aria-hidden="true"></i>
    </button>

    <ng-template #menu>
      <div class="doc-version-menu" cdkMenu>
        <p class="doc-version-menu-title" aria-hidden="true">Versions</p>
        @for (version of versions(); track version.number) {
          <button
            type="button"
            class="doc-version-option"
            cdkMenuItemRadio
            [cdkMenuItemChecked]="version === active()"
            (cdkMenuItemTriggered)="select(version)"
          >
            <span class="doc-version-option-label">Version {{ version.number }}</span>
            @if (version === latest()) {
              <span class="doc-version-option-badge">Latest</span>
            }
            <i class="pi pi-check doc-version-option-check" aria-hidden="true"></i>
          </button>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './version-picker.scss',
})
export class VersionPicker {
  /** Detected versions, ascending. */
  readonly versions = input.required<readonly ComponentVersion[]>();
  readonly active = input<ComponentVersion>();

  private readonly router = inject(Router);

  protected readonly latest = computed(() => this.versions().at(-1));

  protected select(version: ComponentVersion): void {
    this.router.navigate([], {
      queryParams: { [VERSION_QUERY_PARAM]: version.number },
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });
  }
}
