import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn } from '../../base/litetable';

@Component({
  selector: 'litetable-template-example',
  templateUrl: './example.html',
  imports: [IntLitetable, DecimalPipe],
})
export class LitetableTemplateExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'label', header: 'Nov, 2026' },
    { field: 'amount' },
  ];

  readonly rows = [
    { label: 'Gross', amount: 1_857_210 },
    { label: 'Adjustments', amount: 2_790 },
    { label: 'Exclusions', amount: 0 },
    { label: 'Net Expenses', amount: 1_860_000 },
  ];
}
