import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

interface DataItem {
  readonly id: string;
  readonly title: string;
  readonly currency: string;
  readonly amount: string;
}

const MOCK_DATA: readonly DataItem[] = [
  { id: 'fees', title: 'Total fees', currency: 'USD', amount: '999 K' },
  { id: 'interchange', title: 'Interchange', currency: 'USD', amount: '742 K' },
  { id: 'assessments', title: 'Assessments', currency: 'USD', amount: '128 K' },
  { id: 'transactions', title: 'Transactions', currency: '#', amount: '3.2 M' },
];

@Component({
  selector: 'card-data-card-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardDataCardExample {
  protected readonly items = MOCK_DATA;
}
