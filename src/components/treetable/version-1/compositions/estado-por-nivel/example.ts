import { Component, signal } from '@angular/core';

import { IntTreeNode, IntTreetableModule } from '../../base/treetable';

interface FeeRow {
  brand: 'visa' | 'mastercard' | 'amex';
  code: string;
  name: string;
  amount: string;
  status: 'error' | null;
}

const FEES: IntTreeNode<FeeRow>[] = [
  {
    key: 'v-1',
    expanded: true,
    data: { brand: 'visa', code: 'VI-0101', name: 'Interchange domestic', amount: '45,200.00', status: 'error' },
    children: [
      { key: 'v-1-1', data: { brand: 'visa', code: 'VI-0101-A', name: 'Debit cards', amount: '25,100.00', status: 'error' } },
      { key: 'v-1-2', data: { brand: 'visa', code: 'VI-0101-B', name: 'Credit cards', amount: '20,100.00', status: null } },
    ],
  },
  {
    key: 'm-1',
    expanded: true,
    data: { brand: 'mastercard', code: 'MC-0230', name: 'Cross-border assessment', amount: '38,750.50', status: null },
    children: [
      { key: 'm-1-1', data: { brand: 'mastercard', code: 'MC-0230-A', name: 'Consumer', amount: '30,000.00', status: null } },
    ],
  },
  { key: 'a-1', data: { brand: 'amex', code: 'AX-0005', name: 'Network fee', amount: '21,605.00', status: 'error' } },
];

@Component({
  selector: 'treetable-estado-por-nivel-example',
  templateUrl: './example.html',
  imports: [IntTreetableModule],
})
export class TreetableEstadoPorNivelExample {
  protected readonly fees = FEES;
  // TODO(dep:tooltip provisional): code of the row whose tooltip is open (hover / focus), until int-tooltip is done.
  protected readonly openTooltip = signal<string | null>(null);
}
