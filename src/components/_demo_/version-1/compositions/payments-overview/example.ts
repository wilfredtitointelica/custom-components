import { Component } from '@angular/core';

import { IntDemo } from '../../base/demo';

@Component({
  selector: 'demo-payments-overview-example',
  templateUrl: './example.html',
  imports: [IntDemo],
})
export class DemoPaymentsOverviewExample {
  readonly pending = ['Visa · 1,250.00', 'Mastercard · 830.40', 'Amex · 2,100.00'];
  readonly scheduled = ['Visa · 640.00', 'Discover · 95.10'];
}
