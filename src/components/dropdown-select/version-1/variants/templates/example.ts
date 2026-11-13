import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

interface Brand {
  name: string;
  code: string;
  icon: string;
  inactive?: boolean;
}

@Component({
  selector: 'dropdown-select-templates-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, FormsModule],
})
export class DropdownSelectTemplatesExample {
  readonly brands: Brand[] = [
    { name: 'Visa', code: 'VI', icon: 'icon icon-credit-card' },
    { name: 'Mastercard', code: 'MC', icon: 'icon icon-credit-card' },
    { name: 'American Express', code: 'AX', icon: 'icon icon-credit-card' },
    { name: 'Diners Club', code: 'DC', icon: 'icon icon-credit-card', inactive: true },
    { name: 'Discover', code: 'DI', icon: 'icon icon-credit-card' },
  ];
  brand: Brand | null = this.brands[0];
}
