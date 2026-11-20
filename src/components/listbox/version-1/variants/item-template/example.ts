import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntListbox } from '../../base/listbox';

interface Brand {
  name: string;
  code: string;
  icon: string;
  inactive?: boolean;
}

@Component({
  selector: 'listbox-item-template-example',
  templateUrl: './example.html',
  imports: [IntListbox, FormsModule],
})
export class ListboxItemTemplateExample {
  readonly brands: Brand[] = [
    { name: 'Visa', code: 'VI', icon: 'icon icon-credit-card' },
    { name: 'Mastercard', code: 'MC', icon: 'icon icon-credit-card' },
    { name: 'American Express', code: 'AX', icon: 'icon icon-credit-card' },
    { name: 'Diners Club', code: 'DC', icon: 'icon icon-credit-card', inactive: true },
    { name: 'Discover', code: 'DI', icon: 'icon icon-credit-card' },
  ];
  brand: Brand | null = null;
}
