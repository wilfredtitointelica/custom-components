import { Component } from '@angular/core';

import { IntTooltip } from '../../../../tooltip/version-2/base/tooltip';
import { IntCard } from '../../base/card';

interface Kpi {
  title: string;
  currency: string;
  amount: string;
  /** Tooltip text of the alert icon; no icon when absent. */
  alert?: string;
}

const KPIS: readonly Kpi[] = [
  { title: 'Total fees', currency: 'USD', amount: '999 K' },
  { title: 'Interchange', currency: 'USD', amount: '1.2 M' },
  { title: 'Chargebacks', currency: 'USD', amount: '48 K', alert: 'Chargebacks grew 12% vs. last month' },
];

@Component({
  selector: 'card-kpi-example',
  templateUrl: './example.html',
  imports: [IntCard, IntTooltip],
})
export class CardKpiExample {
  readonly kpis = KPIS;
}
