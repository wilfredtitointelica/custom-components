import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';

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
  imports: [IntCard, NgTemplateOutlet],
})
export class CardKpiExample {
  readonly kpis = KPIS;
  // TODO(dep:tooltip provisional): open and tooltipId only exist for the provisional tooltip.
  /** Id of the tooltip shown (hover or focus on its alert icon). */
  readonly open = signal<string | null>(null);

  tooltipId(block: string, kpi: Kpi): string {
    return `card-kpi-tooltip-${block}-${kpi.title.toLowerCase()}`;
  }
}
