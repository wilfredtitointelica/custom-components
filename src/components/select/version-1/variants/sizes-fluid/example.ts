import { Component } from '@angular/core';

import { IntSelect } from '../../base/select';

@Component({
  selector: 'select-sizes-fluid-example',
  templateUrl: './example.html',
  imports: [IntSelect],
})
export class SelectSizesFluidExample {
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
}
