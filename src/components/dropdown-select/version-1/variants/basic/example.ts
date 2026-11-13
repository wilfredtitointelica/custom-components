import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

@Component({
  selector: 'dropdown-select-basic-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, FormsModule],
})
export class DropdownSelectBasicExample {
  readonly regions = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Chile', code: 'CL' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Brasil', code: 'BR' },
    { name: 'Panamá', code: 'PA' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
  ];
  region: string | null = null;
}
