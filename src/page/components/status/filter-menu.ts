import { Component, computed, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';

/** One choice of the menu. `value: null` is the "all" option. */
export interface FilterOption {
  readonly value: string | null;
  readonly label: string;
  readonly count?: number;
  /** Leading bullet color (designers). */
  readonly color?: string;
  /** Leading primeicons class (statuses). */
  readonly icon?: string;
}

/**
 * Filter dropdown of the progress page. Same look and behavior as the version picker of the
 * documentation page (CDK menu in an overlay, checked option highlighted).
 */
@Component({
  selector: 'app-filter-menu',
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItemRadio, NgTemplateOutlet],
  template: `
    <button
      type="button"
      class="doc-filter-trigger"
      [class.doc-is-filtered]="value() !== null"
      [cdkMenuTriggerFor]="menu"
      [attr.aria-label]="title() + ': ' + selected().label + ', change'"
    >
      <ng-container *ngTemplateOutlet="lead; context: { $implicit: selected() }" />
      <span class="doc-filter-trigger-label">{{ selected().label }}</span>
      <i class="pi pi-chevron-down doc-filter-trigger-arrow" aria-hidden="true"></i>
    </button>

    <ng-template #menu>
      <div class="doc-filter-menu" cdkMenu>
        <p class="doc-filter-menu-title" aria-hidden="true">{{ title() }}</p>
        @for (option of options(); track option.value) {
          <button
            type="button"
            class="doc-filter-option"
            cdkMenuItemRadio
            [cdkMenuItemChecked]="option.value === value()"
            (cdkMenuItemTriggered)="changed.emit(option.value)"
          >
            <ng-container *ngTemplateOutlet="lead; context: { $implicit: option }" />
            <span class="doc-filter-option-label">{{ option.label }}</span>
            @if (option.count !== undefined) {
              <span class="doc-filter-option-count">{{ option.count }}</span>
            }
            <i class="pi pi-check doc-filter-option-check" aria-hidden="true"></i>
          </button>
        }
      </div>
    </ng-template>

    <!-- Leading mark: bullet (designer), icon (status) or a generic icon for "all". -->
    <ng-template #lead let-option>
      @if (option.color) {
        <span class="doc-filter-dot" [style.background]="option.color" aria-hidden="true"></span>
      } @else {
        <i class="pi {{ option.icon ?? allIcon() }} doc-filter-icon" aria-hidden="true"></i>
      }
    </ng-template>
  `,
  styleUrl: './filter-menu.scss',
})
export class FilterMenu {
  /** Menu heading and accessible name ("Diseñador", "Estado"). */
  readonly title = input.required<string>();
  readonly options = input.required<readonly FilterOption[]>();
  readonly value = input<string | null>(null);
  /** Icon of the options without color or icon (the "all" option). */
  readonly allIcon = input('pi-list');
  readonly changed = output<string | null>();

  protected readonly selected = computed(
    () => this.options().find((option) => option.value === this.value()) ?? this.options()[0],
  );
}
