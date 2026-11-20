import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntListbox } from '../../base/listbox';

@Component({
  selector: 'listbox-multiple-filter-checkmark-example',
  templateUrl: './example.html',
  imports: [IntListbox, FormsModule],
})
export class ListboxMultipleFilterCheckmarkExample {
  readonly brands = [
    { name: 'Visa', code: 'VI', icon: 'icon icon-credit-card' },
    { name: 'Mastercard', code: 'MC', icon: 'icon icon-credit-card' },
    { name: 'American Express', code: 'AX', icon: 'icon icon-credit-card' },
    { name: 'Diners Club', code: 'DC', icon: 'icon icon-credit-card', inactive: true },
    { name: 'Discover', code: 'DI', icon: 'icon icon-credit-card' },
  ];
  selected: string[] = ['VI'];
}
