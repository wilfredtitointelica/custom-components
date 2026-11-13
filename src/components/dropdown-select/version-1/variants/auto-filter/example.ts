import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

@Component({
  selector: 'dropdown-select-auto-filter-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, FormsModule],
})
export class DropdownSelectAutoFilterExample {
  readonly regions = [
    { name: 'ICA', code: 'ICA' },
    { name: 'BID', code: 'BID' },
    { name: 'SRE', code: 'SRE' },
    { name: 'NUMID', code: 'NUMID' },
  ];
  readonly countries = [
    { name: 'Perú', code: 'PE' },
    { name: 'México', code: 'MX' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Chile', code: 'CL' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Brasil', code: 'BR' },
    { name: 'Panamá', code: 'PA' },
    { name: 'Uruguay', code: 'UY' },
  ];
  region: string | null = 'BID';
  country: string | null = 'CO';
}
