import { Component } from '@angular/core';

import { IntLitetable } from '../../base/litetable';

@Component({
  selector: 'litetable-rowspan-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableRowspanExample {
  readonly brands = [
    { brand: 'Visa', issuer: '20K', acquirer: '25K' },
    { brand: 'Mastercard', issuer: '15K', acquirer: '10K' },
  ];
}
