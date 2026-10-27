import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntListBox } from '../../base/list-box';

interface Brand {
  name: string;
  code: string;
  icon: string;
  inactive?: boolean;
}

@Component({
  selector: 'list-box-item-template-example',
  templateUrl: './example.html',
  imports: [IntListBox, FormsModule],
})
export class ListBoxItemTemplateExample {
  readonly brands: Brand[] = [
    { name: 'Visa', code: 'VI', icon: 'icon icon-credit-card' },
    { name: 'Mastercard', code: 'MC', icon: 'icon icon-credit-card' },
    { name: 'American Express', code: 'AX', icon: 'icon icon-credit-card' },
    { name: 'Diners Club', code: 'DC', icon: 'icon icon-credit-card', inactive: true },
    { name: 'Discover', code: 'DI', icon: 'icon icon-credit-card' },
  ];
  brand: Brand | null = null;
}
