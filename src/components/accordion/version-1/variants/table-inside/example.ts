import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-table-inside-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
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
