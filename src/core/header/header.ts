import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { GlobalSearch } from '../../service/global-search';
import { MAIN_SECTIONS } from '../../service/main-navigation';
import { BrandMark } from '../brand-mark/brand-mark';

/**
 * Main navigation. Material 3 navigation rail on medium/expanded widths,
 * bottom navigation bar on compact widths. Hosts the entry point of the global search.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, BrandMark],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly sections = MAIN_SECTIONS;
  protected readonly search = inject(GlobalSearch);
}
