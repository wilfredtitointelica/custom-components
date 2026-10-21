import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from '../core/header/header';
import { SearchView } from '../core/search/search-view';
import { GlobalSearch } from '../service/global-search';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, SearchView],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly search = inject(GlobalSearch);
}
