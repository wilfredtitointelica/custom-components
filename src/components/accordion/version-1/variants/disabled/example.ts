import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-disabled-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
})
export class AccordionDisabledExample {
  active: IntAccordionValue | IntAccordionValue[] | null = null;
}
