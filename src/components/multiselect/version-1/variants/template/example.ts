import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntMultiselect } from '../../base/multiselect';

interface Country {
  name: string;
  code: string;
}

const COUNTRIES: readonly Country[] = [
  { name: 'Australia', code: 'AU' },
  { name: 'Brazil', code: 'BR' },
  { name: 'China', code: 'CN' },
  { name: 'Egypt', code: 'EG' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'India', code: 'IN' },
  { name: 'Japan', code: 'JP' },
  { name: 'Spain', code: 'ES' },
  { name: 'United States', code: 'US' },
];

@Component({
  selector: 'multiselect-template-example',
  templateUrl: './example.html',
  imports: [IntMultiselect, FormsModule],
})
export class MultiselectTemplateExample {
  readonly countries = COUNTRIES;
  selected: Country[] = [];
}
