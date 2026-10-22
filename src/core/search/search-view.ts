import { afterNextRender, Component, DOCUMENT, inject, OnDestroy, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { GlobalSearch } from '../../service/global-search';
import { Search } from './search';

/** Full-height search view opened from the navigation rail (Material 3 search pattern). */
@Component({
  selector: 'app-search-view',
  imports: [RouterLink, Search],
  templateUrl: './search-view.html',
  styleUrl: './search-view.scss',
  host: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Buscar' },
})
export class SearchView implements OnDestroy {
  protected readonly search = inject(GlobalSearch);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly field = viewChild.required(Search);
  /** Element focused before opening, to give focus back on close. */
  private readonly returnFocus = this.document.activeElement as HTMLElement | null;

  constructor() {
    this.document.body.style.overflow = 'hidden';
    afterNextRender(() => this.field().focus());
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
    this.returnFocus?.focus();
  }

  protected openFirst(): void {
    const first = this.search.groups()[0]?.results[0];
    if (first) this.router.navigateByUrl(first.path);
  }
}
