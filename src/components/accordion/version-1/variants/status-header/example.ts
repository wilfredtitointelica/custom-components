import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-status-header-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
})
export class AccordionStatusHeaderExample {
  active: IntAccordionValue | IntAccordionValue[] | null = ['sent'];
}
