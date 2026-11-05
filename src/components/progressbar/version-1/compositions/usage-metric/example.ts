import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';

import { IntProgressbar } from '../../base/progressbar';

interface ProductUsage {
  code: string;
  /** Tooltip text of the info icon. */
  description: string;
  currency: string;
  amount: string;
  metric: string;
  value: number;
  status: string;
}

const MOCK_PRODUCTS: readonly ProductUsage[] = [
  {
    code: 'TPK7005S',
    description: 'Domestic debit transactions',
    currency: 'EUR',
    amount: '42.08K',
    metric: 'Regional Adoption Rate',
    value: 85,
    status: 'High usage',
  },
  {
    code: 'TII1001',
    description: 'International credit transactions',
    currency: 'EUR',
    amount: '27.2K',
    metric: 'Regional Adoption Rate',
    value: 98,
    status: 'High usage',
  },
  {
    code: 'TS95073TIS',
    description: 'Cross-border prepaid transactions',
    currency: 'EUR',
    amount: '11.07K',
    metric: 'Regional Adoption Rate',
    value: 98,
    status: 'High usage',
  },
];

@Component({
  selector: 'progressbar-usage-metric-example',
  templateUrl: './example.html',
  imports: [IntProgressbar, NgTemplateOutlet],
})
export class ProgressbarUsageMetricExample {
  protected readonly products = MOCK_PRODUCTS;
  // TODO(dep:tooltip provisional): open and tooltipId only exist for the provisional tooltip.
  /** Id of the tooltip shown (hover or focus on its info icon). */
  protected readonly open = signal<string | null>(null);

  protected tooltipId(product: ProductUsage): string {
    return `progressbar-usage-metric-tooltip-${product.code.toLowerCase()}`;
  }

  protected labelId(product: ProductUsage): string {
    return `progressbar-usage-metric-label-${product.code.toLowerCase()}`;
  }
}
