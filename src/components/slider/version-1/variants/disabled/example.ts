import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSlider } from '../../base/slider';

@Component({
  selector: 'slider-disabled-example',
  templateUrl: './example.html',
  imports: [IntSlider, FormsModule],
})
export class SliderDisabledExample {
  value = 50;
}
