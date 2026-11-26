import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn, IntLitetableSpacing } from '../../base/litetable';

@Component({
  selector: 'litetable-cell-spacing-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableCellSpacingExample {
  readonly sizes: IntLitetableSpacing[] = ['small', 'medium', 'large'];

  readonly columns: IntLitetableColumn[] = [
    { field: 'category', header: 'Category' },
    { field: 'total', header: 'Total' },
  ];

  readonly rows = [
    { category: 'Issuer', total: '20K' },
    { category: 'Acquirer', total: '25K' },
    { category: 'Network', total: '15K' },
  ];
}
