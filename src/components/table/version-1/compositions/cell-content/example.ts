import { Component } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { IntTable } from '../../base/table';

interface Fee {
  description: string;
  code: string;
  product: string;
  productSub: string;
  date: string;
  amount: number;
  brand: 'visa' | 'mastercard' | 'amex';
  status: 'success' | 'error' | 'disabled';
  trend: 'up' | 'down';
  change: string;
}

const FEES: readonly Fee[] = [
  {
    description: 'Acquirer processing fee for domestic credit transactions',
    code: 'VI-1001',
    product: 'Credit',
    productSub: 'Consumer',
    date: '2025-06-20',
    amount: 99999999.99,
    brand: 'visa',
    status: 'success',
    trend: 'up',
    change: '4.2%',
  },
  {
    description: 'Cross border assessment on international purchases',
    code: 'MC-2045',
    product: 'Debit',
    productSub: 'Commercial',
    date: '2025-03-14',
    amount: 8320.5,
    brand: 'mastercard',
    status: 'error',
    trend: 'down',
    change: '1.8%',
  },
  {
    description: 'Network access fee billed monthly per merchant',
    code: 'AX-3010',
    product: 'Prepaid',
    productSub: 'Consumer',
    date: '2024-12-01',
    amount: 4210,
    brand: 'amex',
    status: 'disabled',
    trend: 'up',
    change: '0.6%',
  },
];

@Component({
  selector: 'table-cell-content-example',
  templateUrl: './example.html',
  imports: [IntTable, DatePipe, DecimalPipe],
})
export class TableCellContentExample {
  protected readonly fees = FEES;
}
