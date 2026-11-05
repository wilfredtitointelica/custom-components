import { Component } from '@angular/core';

import { IntTimeline } from '../../base/timeline';

const YEARS: readonly string[] = ['2020', '2021', '2022', '2023'];

@Component({
  selector: 'timeline-horizontal-example',
  templateUrl: './example.html',
  imports: [IntTimeline],
})
export class TimelineHorizontalExample {
  readonly years = YEARS;
}
