import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn, IntLitetableColumnGroup } from '../../base/litetable';

@Component({
  selector: 'litetable-column-group-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableColumnGroupExample {
  readonly columnGroups: IntLitetableColumnGroup[] = [
    { header: 'Brand', rowspan: 2 },
    { header: 'Q1 2026', colspan: 2, align: 'center' },
    { header: 'Q2 2026', colspan: 2, align: 'center' },
  ];

  readonly columns: IntLitetableColumn[] = [
    { field: 'brand', header: 'Brand' },
    { field: 'q1Issuer', header: 'Issuer', align: 'right' },
    { field: 'q1Acquirer', header: 'Acquirer', align: 'right' },
    { field: 'q2Issuer', header: 'Issuer', align: 'right' },
    { field: 'q2Acquirer', header: 'Acquirer', align: 'right' },
  ];

  readonly rows = [
    { brand: 'Visa', q1Issuer: '20K', q1Acquirer: '25K', q2Issuer: '22K', q2Acquirer: '27K' },
    { brand: 'Mastercard', q1Issuer: '15K', q1Acquirer: '10K', q2Issuer: '18K', q2Acquirer: '12K' },
  ];
}
