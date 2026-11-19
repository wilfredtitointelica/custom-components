import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSelect } from '../../../../select/version-1/base/select';
import { IntInputNumber } from '../../../../inputnumber/version-1/base/inputnumber';
import { IntTabValue, IntTabsImports } from '../../base/tabs';

@Component({
  selector: 'tabs-vertical-example',
  templateUrl: './example.html',
  imports: [IntTabsImports, IntSelect, IntInputNumber, FormsModule],
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
