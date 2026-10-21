import { Component, ElementRef, input, model, output, viewChild } from '@angular/core';

/**
 * Generic search field with clear action. Holds no filtering logic: the parent owns the query.
 * Escape clears the text; when already empty it emits `escaped`.
 */
@Component({
  selector: 'app-search',
  host: { '[class.is-large]': "appearance() === 'large'" },
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
        (keydown.enter)="submitted.emit()"
        (keydown.escape)="onEscape()"
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
  readonly appearance = input<'bar' | 'large'>('bar');
  /** ID of the element whose content the search filters. */
  readonly controls = input<string>();
  readonly submitted = output<void>();
  readonly escaped = output<void>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  focus(): void {
    this.field().nativeElement.focus();
  }

  clear(): void {
    this.query.set('');
    this.focus();
  }

  protected onEscape(): void {
    if (this.query()) this.clear();
    else this.escaped.emit();
  }
}
