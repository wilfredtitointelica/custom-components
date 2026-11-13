import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';

@Component({
  selector: 'accordion-multiple-example',
  templateUrl: './example.html',
  imports: [IntAccordionImports, JsonPipe],
})
export class AccordionMultipleExample {
  readonly sections = ['Visa', 'Mastercard', 'American Express'];
  active: IntAccordionValue | IntAccordionValue[] | null = ['Visa'];
}
