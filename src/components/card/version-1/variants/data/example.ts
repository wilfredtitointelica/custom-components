import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

interface Kpi {
  title: string;
  currency: string;
  amount: string;
  alert: boolean;
}

const KPIS: readonly Kpi[] = [
  { title: 'Total fees', currency: 'USD', amount: '999 K', alert: false },
  { title: 'Interchange', currency: 'USD', amount: '1.2 M', alert: false },
  { title: 'Chargebacks', currency: 'USD', amount: '48 K', alert: true },
];

@Component({
  selector: 'card-data-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardDataExample {
  readonly kpis = KPIS;
}
