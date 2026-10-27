import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntCheckbox } from '../../base/checkbox';

@Component({
  selector: 'input-checkbox-select-all-example',
  templateUrl: './example.html',
  imports: [IntCheckbox, FormsModule],
})
export class InputCheckboxSelectAllExample {
  readonly regions = ['LATAM', 'North America', 'Europe'];
  readonly selected = signal<string[]>(['LATAM']);
  readonly allChecked = computed(() => this.selected().length === this.regions.length);
  readonly someChecked = computed(() => this.selected().length > 0 && !this.allChecked());

  toggleAll(checked: boolean): void {
    this.selected.set(checked ? [...this.regions] : []);
  }
}
