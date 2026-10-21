import { Component } from '@angular/core';

import { IntDemo } from '../../base/demo';

@Component({
  selector: 'demo-outlined-example',
  templateUrl: './example.html',
  imports: [IntDemo],
})
export class DemoOutlinedExample {
  readonly items = ['Visa · 1,250.00', 'Mastercard · 830.40', 'Amex · 2,100.00'];
}
