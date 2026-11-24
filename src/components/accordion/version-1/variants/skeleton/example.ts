import { Component, signal } from '@angular/core';

import { IntAccordionImports, IntAccordionValue } from '../../base/accordion';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'accordion-skeleton-example',
  templateUrl: './example.html',
  imports: [...IntAccordionImports, IntButton, IntSkeletonMask],
})
export class AccordionSkeletonExample {
  readonly loading = signal(true);
  active: IntAccordionValue | IntAccordionValue[] | null = ['sent'];
}
