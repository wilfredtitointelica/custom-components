import { Component } from '@angular/core';

import { IntPickList } from '../../base/pick-list';

@Component({
  selector: 'pick-list-favorite-pages-example',
  templateUrl: './example.html',
  imports: [IntPickList],
})
export class PickListFavoritePagesExample {
  availablePages = ['Fee Library', 'Original Invoice', 'File Sharing'];
  favoritePages = ['Penalty Summary', 'Fee Dashboard'];

  isFavorite(page: string): boolean {
    return this.favoritePages.includes(page);
  }
}
