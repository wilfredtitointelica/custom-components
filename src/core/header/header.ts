import { Component, ElementRef, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MAIN_SECTIONS } from '../../service/main-navigation';
import { NavigationState } from '../../service/navigation-state';
import { ToggleCode } from '../toggle-code/toggle-code';

/** Gap kept between the sticky header and an anchored section. */
const ANCHOR_GAP = 16;

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ToggleCode],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly sections = MAIN_SECTIONS;
  protected readonly nav = inject(NavigationState);

  constructor() {
    // The header is sticky: anchor scrolling must stop below it, whatever its current height.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    inject(ViewportScroller).setOffset(() => [0, host.offsetHeight + ANCHOR_GAP]);
  }
}
