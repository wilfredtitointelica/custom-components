import { Component } from '@angular/core';

import { IntTimeline } from '../../base/timeline';

interface TimelineEvent {
  status: string;
  date: string;
}

const EVENTS: readonly TimelineEvent[] = [
  { status: 'Ordered', date: '15/10/2020 10:30' },
  { status: 'Processing', date: '15/10/2020 14:00' },
  { status: 'Shipped', date: '15/10/2020 16:15' },
  { status: 'Delivered', date: '16/10/2020 10:00' },
];

@Component({
  selector: 'timeline-basic-example',
  templateUrl: './example.html',
  imports: [IntTimeline],
})
export class TimelineBasicExample {
  readonly events = EVENTS;
}
