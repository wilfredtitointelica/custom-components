import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

interface DataItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly currency: string;
  readonly amount: string;
  /** Figma "color graph level" (1…6) used by the chart format. */
  readonly level: 1 | 2 | 3 | 4 | 5 | 6;
}

const MOCK_DATA: readonly DataItem[] = [
  { id: 'fees', title: 'Total fees', description: 'Last 30 days', currency: 'USD', amount: '999 K', level: 1 },
  { id: 'interchange', title: 'Interchange', description: 'Last 30 days', currency: 'USD', amount: '742 K', level: 2 },
  { id: 'assessments', title: 'Assessments', description: 'Last 30 days', currency: 'USD', amount: '128 K', level: 3 },
];

@Component({
  selector: 'card-data-card-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardDataCardExample {
  protected readonly items = MOCK_DATA;
  protected readonly first = MOCK_DATA[0];
}
