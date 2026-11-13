import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntTable } from '../../base/table';
import { IntMultiselect } from '../../../../multiselect/version-1/base/multiselect';

interface Fee {
  code: string;
  name: string;
  region: string;
  business: string;
  amount: string;
}

interface Column {
  field: keyof Fee;
  header: string;
  align: string;
  /** Width of the column header, as the knowledge base: every th has a percentage. */
  width: string;
}

const FEES: readonly Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', region: 'LAC', business: 'Issuer', amount: '12,450.00' },
  { code: 'MC-2045', name: 'Cross Border Assessment', region: 'NA', business: 'Acquirer', amount: '8,320.50' },
  { code: 'VI-1120', name: 'International Service Assessment', region: 'EU', business: 'Issuer', amount: '15,780.25' },
  { code: 'AX-3010', name: 'Network Access Fee', region: 'AP', business: 'Member', amount: '4,210.00' },
];

const COLUMNS: readonly Column[] = [
  { field: 'name', header: 'Fee Name', align: 'u-text-left', width: '30%' },
  { field: 'code', header: 'Fee Code', align: 'u-text-center', width: '15%' },
  { field: 'region', header: 'Region', align: 'u-text-center', width: '15%' },
  { field: 'business', header: 'Business', align: 'u-text-center', width: '20%' },
  { field: 'amount', header: 'Amount USD', align: 'u-text-right', width: '20%' },
];

@Component({
  selector: 'table-column-selector-example',
  templateUrl: './example.html',
  imports: [IntTable, IntMultiselect, FormsModule],
})
export class TableColumnSelectorExample {
  protected readonly fees = FEES;
  protected readonly columns = COLUMNS;
  /** Fields chosen in the multiselect; every column starts visible. */
  protected readonly selectedFields = signal<string[]>(COLUMNS.map((column) => column.field));
  /** Columns shown by the table, in their original order. */
  protected readonly visibleColumns = computed(() => COLUMNS.filter((column) => this.selectedFields().includes(column.field)));
}
