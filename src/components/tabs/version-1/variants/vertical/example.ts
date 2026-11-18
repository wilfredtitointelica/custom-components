import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../../../dropdown-select/version-1/base/dropdown-select';
import { IntInputNumber } from '../../../../input/version-1/base/input-number';
import { IntTabValue, IntTabsImports } from '../../base/tabs';

@Component({
  selector: 'tabs-vertical-example',
  templateUrl: './example.html',
  imports: [IntTabsImports, IntDropdownSelect, IntInputNumber, FormsModule],
})
export class TabsVerticalExample {
  tab: IntTabValue | null = 'rates';
  readonly rateTypes = ['Fixed', 'Percentage', 'Tiered'];
  readonly frequencies = ['Monthly', 'Quarterly', 'Yearly'];
  rateType: string | null = null;
  frequency: string | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
}
