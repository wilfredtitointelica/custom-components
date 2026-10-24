import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ExternalResources } from '../../service/external-resources';
import { GlobalSearch } from '../../service/global-search';
import { MAIN_SECTIONS } from '../../service/main-navigation';
import { BrandMark } from '../brand-mark/brand-mark';
import { ConnectionsDialog, STATUS_LABELS } from '../connections/connections-dialog';

/**
 * Main navigation. Material 3 navigation rail on medium/expanded widths,
 * bottom navigation bar on compact widths. Hosts the entry points of the global search
 * and of the external connections dialog.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, BrandMark, ConnectionsDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly sections = MAIN_SECTIONS;
  protected readonly search = inject(GlobalSearch);
  protected readonly connections = inject(ExternalResources);
  protected readonly connectionLabels = STATUS_LABELS;
}
