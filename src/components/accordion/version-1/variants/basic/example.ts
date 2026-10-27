import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-basic-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports],
})
export class AccordionBasicExample {
  active: IntAccordionValue | IntAccordionValue[] | null = 'fees';
}
