import { Component } from '@angular/core';

import { IntDemo } from '../../base/demo';

@Component({
  selector: 'demo-basic-example',
  templateUrl: './example.html',
  imports: [IntDemo],
})
export class DemoBasicExample {
  readonly items = ['Visa · 1,250.00', 'Mastercard · 830.40', 'Amex · 2,100.00'];
}
