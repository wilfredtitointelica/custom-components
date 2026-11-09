import { Component, signal } from '@angular/core';

import { IntReorderableColumn, IntTable, IntTableColumnReorderEvent } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  region: string;
  amount: string;
}

interface Column {
  field: keyof Fee;
  header: string;
  align: string;
}

const FEES: readonly Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', region: 'LAC', amount: '12,450.00' },
  { code: 'MC-2045', name: 'Cross Border Assessment', region: 'NA', amount: '8,320.50' },
  { code: 'VI-1120', name: 'International Service Assessment', region: 'EU', amount: '15,780.25' },
  { code: 'AX-3010', name: 'Network Access Fee', region: 'AP', amount: '4,210.00' },
];

const COLUMNS: readonly Column[] = [
  { field: 'name', header: 'Fee Name', align: 'u-text-left' },
  { field: 'code', header: 'Fee Code', align: 'u-text-center' },
  { field: 'region', header: 'Region', align: 'u-text-center' },
  { field: 'amount', header: 'Amount USD', align: 'u-text-right' },
];

@Component({
  selector: 'table-reorder-example',
  templateUrl: './example.html',
  imports: [IntTable, IntReorderableColumn],
})
export class TableReorderExample {
  protected readonly fees = FEES;
  protected readonly cols = COLUMNS;
  /** Headers in the order of the last onColReorder. */
  protected readonly order = signal('');

  protected reorder(event: IntTableColumnReorderEvent): void {
    this.order.set((event.columns as Column[]).map((column) => column.header).join(', '));
  }
}
