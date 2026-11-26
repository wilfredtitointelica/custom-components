import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn, IntLitetableRow } from '../../base/litetable';

@Component({
  selector: 'litetable-rowspan-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableRowspanExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'brand', header: 'Brand' },
    { field: 'type', header: 'Type' },
    { field: 'total', header: 'Total', align: 'right' },
  ];

  readonly rows: IntLitetableRow[] = [
    { brand: 'Visa', type: 'Issuer', total: '20K', spans: { brand: { rowspan: 2 } } },
    { type: 'Acquirer', total: '25K' },
    { brand: 'Mastercard', type: 'Issuer', total: '15K', spans: { brand: { rowspan: 2 } } },
    { type: 'Acquirer', total: '10K' },
  ];
}
