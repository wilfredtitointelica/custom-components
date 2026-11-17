import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTag } from '../../../../tag/version-1/base/tag';
import { IntPopover } from '../../base/popover';

interface Product {
  readonly name: string;
  readonly icon: string;
  readonly description: string;
  readonly legacy?: boolean;
}

@Component({
  selector: 'popover-available-products-example',
  templateUrl: './example.html',
  imports: [IntPopover, IntButton, IntTag],
  // No Style Guide helper for a 24px title, a native button reset, a width or the current/hover rows.
  styles: `
    h2 {
      font-size: var(--i-typography-font-size-2xl);
      line-height: var(--i-typography-lineHeight-2xl);
    }
    ul {
      width: 30rem;
      max-width: 100%;
      list-style: none;
    }
    li > button {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
    }
    li > button:hover {
      background: var(--i-color-secondary-100);
    }
    li > button:focus-visible {
      outline: var(--i-border-width-sm) solid var(--i-color-primary-600);
    }
    li > button[aria-current] {
      background: var(--i-color-primary-100);
    }
    li > button .icon {
      font-size: var(--i-icon-size-md);
    }
  `,
})
export class PopoverAvailableProductsExample {
  readonly products: readonly Product[] = [
    {
      name: 'Fee Manager',
      icon: 'icon-fee-manager',
      description: 'Manage and analyze payment fees with comprehensive insights and optimization opportunities.',
    },
    {
      name: 'Interchange Hub',
      icon: 'icon-interchange-hub',
      description: 'Optimize interchange rates and monitor network performance with advanced analytics.',
      legacy: true,
    },
    {
      name: 'Budget Planner',
      icon: 'icon-budget-tool',
      description: 'Plan and track budgets with smart forecasting and automated variance analysis.',
      legacy: true,
    },
    {
      name: 'Merchant Profitability',
      icon: 'icon-merchant-profitability',
      description:
        'Evaluate merchant-level profitability instantly with smart heuristics and dynamic scenario modeling.',
      legacy: true,
    },
    {
      name: 'Business Intelligence',
      icon: 'icon-business-intelligence',
      description: 'Transform processed data into actionable insights with interactive dashboards and KPI monitoring.',
      legacy: true,
    },
    {
      name: 'Portfolio Management',
      icon: 'icon-portfolio-management',
      description: 'Analyze transactional portfolios with flexible reporting, custom segmentation, and advanced filtering.',
      legacy: true,
    },
  ];
  readonly current = signal('Fee Manager');
}
