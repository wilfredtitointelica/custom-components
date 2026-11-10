import { Component } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { IntSortableColumn, IntSortIcon, IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  date: string;
  amount: number;
}

const FEES: Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', date: '2025-06-20', amount: 12450 },
  { code: 'MC-2045', name: 'Cross Border Assessment', date: '2025-03-14', amount: 8320.5 },
  { code: 'VI-1120', name: 'International Service Assessment', date: '2025-09-02', amount: 15780.25 },
  { code: 'AX-3010', name: 'Network Access Fee', date: '2024-12-01', amount: 4210 },
  { code: 'MC-2210', name: 'Digital Enablement Fee', date: '2025-01-27', amount: 6905.75 },
];

@Component({
  selector: 'table-sort-example',
  templateUrl: './example.html',
  imports: [IntTable, IntSortableColumn, IntSortIcon, DatePipe, DecimalPipe],
})
export class TableSortExample {
  protected readonly fees = FEES;
}
