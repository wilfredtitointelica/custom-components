import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-table-inside-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
  // TODO(dep:table provisional): look of the native table until int-table is done (no Style Guide helpers for it).
  styles: `
    table {
      border-collapse: collapse;
    }
    th {
      top: 0;
      background: var(--i-color-secondary-50);
      border-bottom: var(--i-border-width-sm) solid var(--i-color-primary-900);
    }
    tbody tr:nth-child(even) {
      background: var(--i-color-secondary-100);
    }
  `,
})
export class AccordionTableInsideExample {
  active: IntAccordionValue | IntAccordionValue[] | null = 'sent';
  readonly alerts = [
    { id: 1, type: 'Welcome', client: 'Banco Pichincha - Ecuador' },
    { id: 2, type: 'Free Trial', client: 'NBG - Greece' },
    { id: 3, type: 'Opt-Out Deadline', client: 'NBG - Greece' },
    { id: 4, type: 'Billing Started', client: 'Absa - Ghana' },
    { id: 5, type: 'Free Trial', client: 'BBVA - Peru' },
    { id: 6, type: 'Opt-Out Deadline', client: 'Absa - Ghana' },
    { id: 7, type: 'Billing Started', client: 'NBG - Greece' },
  ];
}
