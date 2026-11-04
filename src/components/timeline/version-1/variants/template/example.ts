import { Component } from '@angular/core';

import { IntCard } from '../../../../card/version-1/base/card';
import { IntTimeline } from '../../base/timeline';

interface TimelineEvent {
  status: string;
  date: string;
  /** Style Guide icon class of the marker. */
  icon: string;
}

const EVENTS: readonly TimelineEvent[] = [
  { status: 'Ordered', date: '15/10/2020 10:30', icon: 'icon-calendar' },
  { status: 'Processing', date: '15/10/2020 14:00', icon: 'icon-settings' },
  { status: 'Shipped', date: '15/10/2020 16:15', icon: 'icon-clock' },
  { status: 'Delivered', date: '16/10/2020 10:00', icon: 'icon-check' },
];

@Component({
  selector: 'timeline-template-example',
  templateUrl: './example.html',
  imports: [IntTimeline, IntCard],
})
export class TimelineTemplateExample {
  readonly events = EVENTS;
}
