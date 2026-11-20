import { Component } from '@angular/core';

import { IntPicklist } from '../../base/picklist';

@Component({
  selector: 'picklist-favorite-pages-example',
  templateUrl: './example.html',
  imports: [IntPicklist],
})
export class PicklistFavoritePagesExample {
  availablePages = ['Fee Library', 'Original Invoice', 'File Sharing'];
  favoritePages = ['Penalty Summary', 'Fee Dashboard'];

  isFavorite(page: string): boolean {
    return this.favoritePages.includes(page);
  }
}
