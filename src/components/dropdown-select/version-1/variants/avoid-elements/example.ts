import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDropdownSelect } from '../../base/dropdown-select';

@Component({
  selector: 'dropdown-select-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, IntButton, FormsModule],
})
export class DropdownSelectAvoidElementsExample {
  readonly regions = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Chile', code: 'CL' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Brasil', code: 'BR' },
  ];
  region: string | null = null;
}
