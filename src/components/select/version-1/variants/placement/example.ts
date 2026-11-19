import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSelect } from '../../base/select';

@Component({
  selector: 'select-placement-example',
  templateUrl: './example.html',
  imports: [IntSelect, FormsModule],
})
export class SelectPlacementExample {
  rows = 10;
  readonly sizes = [10, 25, 50, 100];
}
