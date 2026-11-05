import { Component } from '@angular/core';

import { IntTimeline } from '../../base/timeline';

interface TimelineEvent {
  status: string;
  date: string;
}

const EVENTS: readonly TimelineEvent[] = [
  { status: 'Ordered', date: '15/10/2020' },
  { status: 'Processing', date: '15/10/2020' },
  { status: 'Shipped', date: '15/10/2020' },
  { status: 'Delivered', date: '16/10/2020' },
];

@Component({
  selector: 'timeline-disabled-example',
  templateUrl: './example.html',
  imports: [IntTimeline],
})
export class TimelineDisabledExample {
  readonly events = EVENTS;
}
