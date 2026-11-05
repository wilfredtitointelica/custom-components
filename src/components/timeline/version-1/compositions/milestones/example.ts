import { Component } from '@angular/core';

import { IntTimeline } from '../../base/timeline';

interface Milestone {
  date: string;
  title: string;
}

const MILESTONES: readonly Milestone[] = [
  { date: '20 Jul 2023', title: 'Publication Date' },
  { date: '1 Nov 2023', title: 'Trial Period Starts' },
  { date: '1 Dec 2023', title: 'Last Day Opt-Out' },
  { date: '1 Jan 2024', title: 'Billing Starts' },
  { date: '1 Jul 2024', title: 'Next Opt Out Window' },
];

@Component({
  selector: 'timeline-milestones-example',
  templateUrl: './example.html',
  imports: [IntTimeline],
})
export class TimelineMilestonesExample {
  readonly milestones = MILESTONES;}
