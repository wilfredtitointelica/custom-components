import { Component, model } from '@angular/core';

/**
 * Search of the Icon Lab top bar (the place of the Code switch in /components). It doesn't list
 * results: the page shows only the sections and icons that match, highlighting the match.
 */
@Component({
  selector: 'app-icon-search',
  template: `
    <div class="doc-icon-search" [class.doc-is-filled]="query()">
      <i class="pi pi-search doc-icon-search-icon" aria-hidden="true"></i>
      <input
        #field
        type="search"
        class="doc-icon-search-input"
        placeholder="Buscar icono"
        aria-label="Buscar icono por nombre o categoría"
        autocomplete="off"
        spellcheck="false"
        [value]="query()"
        (input)="query.set(field.value)"
        (keydown.escape)="query.set(''); $event.stopPropagation()"
      />
      @if (query()) {
        <button type="button" class="doc-icon-search-clear" aria-label="Limpiar búsqueda" (click)="query.set(''); field.focus()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
  styleUrl: './icon-search.scss',
})
export class IconSearch {
  readonly query = model('');
}
