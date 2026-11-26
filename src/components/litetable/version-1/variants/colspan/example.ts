import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn, IntLitetableRow } from '../../base/litetable';

@Component({
  selector: 'litetable-colspan-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableColspanExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'category', header: 'Category' },
    { field: 'transactions', header: 'Transactions', align: 'right' },
    { field: 'total', header: 'Total', align: 'right' },
  ];

  readonly rows: IntLitetableRow[] = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
    { category: 'Total', total: '60K', spans: { category: { colspan: 2 } } },
  ];
}
