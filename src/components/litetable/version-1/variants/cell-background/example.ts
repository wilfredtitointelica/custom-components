import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn } from '../../base/litetable';

@Component({
  selector: 'litetable-cell-background-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableCellBackgroundExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'category', header: 'Category' },
    { field: 'transactions', header: 'Transactions' },
    { field: 'total', header: 'Total' },
  ];

  readonly rows = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
  ];
}
