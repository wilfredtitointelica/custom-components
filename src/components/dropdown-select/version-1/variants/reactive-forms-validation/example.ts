import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

interface Brand {
  name: string;
  code: string;
  icon: string;
  inactive?: boolean;
}

@Component({
  selector: 'dropdown-select-reactive-forms-validation-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, ReactiveFormsModule],
})
export class DropdownSelectReactiveFormsValidationExample {
  readonly brands: Brand[] = [
    { name: 'Visa', code: 'VI', icon: 'icon icon-credit-card' },
    { name: 'Mastercard', code: 'MC', icon: 'icon icon-credit-card' },
    { name: 'American Express', code: 'AX', icon: 'icon icon-credit-card' },
    { name: 'Diners Club', code: 'DC', icon: 'icon icon-credit-card', inactive: true },
    { name: 'Discover', code: 'DI', icon: 'icon icon-credit-card' },
  ];
  readonly required = new FormControl<string | null>(null, Validators.required);
  readonly disabledControl = new FormControl({ value: 'MC', disabled: true });
}
