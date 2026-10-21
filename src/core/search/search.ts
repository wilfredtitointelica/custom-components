import { Component, ElementRef, input, model, viewChild } from '@angular/core';

/** Generic search field with clear action. Holds no filtering logic: the parent owns the query. */
@Component({
  selector: 'app-search',
  template: `
    <div class="search" role="search">
      <i class="pi pi-search search-icon" aria-hidden="true"></i>
      <input
        #field
        class="search-input"
        type="search"
        autocomplete="off"
        [value]="query()"
        [placeholder]="placeholder()"
        [attr.aria-label]="label()"
        [attr.aria-controls]="controls()"
        (input)="query.set(field.value)"
        (keydown.escape)="clear()"
      />
      @if (query()) {
        <button type="button" class="search-clear" aria-label="Clear search" (click)="clear()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  styleUrl: './search.scss',
})
export class Search {
  readonly query = model('');
  readonly placeholder = input('Search');
  readonly label = input('Search');
  /** ID of the element whose content the search filters. */
  readonly controls = input<string>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  clear(): void {
    this.query.set('');
    this.field().nativeElement.focus();
  }
}
