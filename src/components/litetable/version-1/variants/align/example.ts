import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn } from '../../base/litetable';

@Component({
  selector: 'litetable-align-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableAlignExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'category', header: 'Left' },
    { field: 'transactions', header: 'Center', align: 'center' },
    { field: 'total', header: 'Right', align: 'right' },
  ];

  readonly rows = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
  ];
}
