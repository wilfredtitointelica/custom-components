import { Component } from '@angular/core';

import { IntTooltip } from '../../../../tooltip/version-2/base/tooltip';
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
  imports: [IntProgressbar, IntTooltip],
})
export class ProgressbarUsageMetricExample {
  protected readonly products = MOCK_PRODUCTS;

  protected labelId(product: ProductUsage): string {
    return `progressbar-usage-metric-label-${product.code.toLowerCase()}`;
  }
}
