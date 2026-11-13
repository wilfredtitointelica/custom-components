import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntTreeNode, IntTreetableModule } from '../../base/treetable';

interface FeeRow {
  brand: 'visa' | 'mastercard' | 'amex';
  code: string;
  name: string;
  amount: string;
}

const FEES: IntTreeNode<FeeRow>[] = [
  {
    key: 'v-1',
    expanded: true,
    data: { brand: 'visa', code: 'VI-0101', name: 'Interchange domestic', amount: '45,200.00' },
    children: [
      { key: 'v-1-1', data: { brand: 'visa', code: 'VI-0101-A', name: 'Debit cards', amount: '25,100.00' } },
      { key: 'v-1-2', data: { brand: 'visa', code: 'VI-0101-B', name: 'Credit cards', amount: '20,100.00' } },
    ],
  },
  {
    key: 'm-1',
    data: { brand: 'mastercard', code: 'MC-0230', name: 'Cross-border assessment', amount: '38,750.50' },
    children: [
      { key: 'm-1-1', data: { brand: 'mastercard', code: 'MC-0230-A', name: 'Consumer', amount: '30,000.00' } },
      { key: 'm-1-2', data: { brand: 'mastercard', code: 'MC-0230-B', name: 'Commercial', amount: '8,750.50' } },
    ],
  },
  { key: 'a-1', data: { brand: 'amex', code: 'AX-0005', name: 'Network fee', amount: '21,605.00' } },
];

@Component({
  selector: 'treetable-estructura-base-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule, IntButton],
})
export class TreetableEstructuraBaseExample {
  protected readonly fees = FEES;
}
