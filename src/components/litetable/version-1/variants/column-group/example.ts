import { Component } from '@angular/core';

import { IntLitetable } from '../../base/litetable';

@Component({
  selector: 'litetable-column-group-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableColumnGroupExample {
  readonly rows = [
    { brand: 'Visa', q1Issuer: '20K', q1Acquirer: '25K', q2Issuer: '22K', q2Acquirer: '27K' },
    { brand: 'Mastercard', q1Issuer: '15K', q1Acquirer: '10K', q2Issuer: '18K', q2Acquirer: '12K' },
  ];
}
