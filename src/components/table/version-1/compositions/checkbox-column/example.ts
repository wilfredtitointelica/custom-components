import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../../../input/version-1/base/checkbox';
import { IntTable } from '../../base/table';

interface Fee {
  code: string;
  name: string;
  amount: string;
}

const FEES: readonly Fee[] = [
  { code: 'VI-1001', name: 'Acquirer Processing Fee', amount: '12,450.00' },
  { code: 'MC-2045', name: 'Cross Border Assessment', amount: '8,320.50' },
  { code: 'VI-1120', name: 'International Service Assessment', amount: '15,780.25' },
  { code: 'AX-3010', name: 'Network Access Fee', amount: '4,210.00' },
];

@Component({
  selector: 'table-checkbox-column-example',
  templateUrl: './example.html',
  imports: [IntTable, IntCheckbox, FormsModule],
})
export class TableCheckboxColumnExample {
  protected readonly fees = FEES;
  /** Codes of the checked rows: each checkbox keeps its own state, as the knowledge base. */
  protected readonly selected = signal<ReadonlySet<string>>(new Set());
  protected readonly allSelected = computed(() => this.selected().size === FEES.length);
  protected readonly someSelected = computed(() => this.selected().size > 0 && !this.allSelected());

  protected isSelected(code: string): boolean {
    return this.selected().has(code);
  }

  protected toggle(code: string): void {
    this.selected.update((selected) => {
      const next = new Set(selected);
      if (!next.delete(code)) next.add(code);
      return next;
    });
  }

  protected toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(FEES.map((fee) => fee.code)));
  }
}
