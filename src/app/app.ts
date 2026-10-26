import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ClipboardHistoryButton } from '../core/clipboard-history/clipboard-history-button';
import { ConnectionToast } from '../core/connections/connection-toast';
import { Header } from '../core/header/header';
import { SearchView } from '../core/search/search-view';
import { GlobalSearch } from '../service/global-search';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, SearchView, ConnectionToast, ClipboardHistoryButton],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly search = inject(GlobalSearch);
}
