import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntSelect } from '../../base/select';

@Component({
  selector: 'select-avoid-elements-example',
  templateUrl: './example.html',
  imports: [IntSelect, IntButton, FormsModule],
})
export class SelectAvoidElementsExample {
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
