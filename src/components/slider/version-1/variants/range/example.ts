import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSlider } from '../../base/slider';

@Component({
  selector: 'slider-range-example',
  templateUrl: './example.html',
  imports: [IntSlider, FormsModule],
})
export class SliderRangeExample {
  rangeValues = [20, 80];
}
