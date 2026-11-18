import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntDropdownSelect } from '../../base/dropdown-select';

@Component({
  selector: 'dropdown-select-placement-example',
  templateUrl: './example.html',
  imports: [IntDropdownSelect, FormsModule],
})
export class DropdownSelectPlacementExample {
  rows = 10;
  readonly sizes = [10, 25, 50, 100];
}
