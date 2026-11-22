import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-padded-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
})
export class AccordionPaddedExample {
  active: IntAccordionValue | IntAccordionValue[] | null = 'fees';
}
