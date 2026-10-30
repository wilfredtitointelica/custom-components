import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

interface Row {
  label: string;
  value: string;
}

const ROWS: readonly Row[] = [
  { label: 'Visa', value: '12,430' },
  { label: 'Mastercard', value: '9,815' },
  { label: 'Amex', value: '2,104' },
  { label: 'Discover', value: '1,320' },
  { label: 'Other', value: '640' },
];

@Component({
  selector: 'card-stretch-content-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardStretchContentExample {
  readonly rows = ROWS;
}
