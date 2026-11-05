import { Component } from '@angular/core';

import { IntTimeline } from '../../base/timeline';

interface LogEntry {
  title: string;
  description: string;
}

const ENTRIES: readonly LogEntry[] = [
  { title: 'File uploaded', description: 'Fee schedule Q3 uploaded by J. Perez' },
  { title: 'Validation passed', description: '1,240 rows checked without errors' },
  { title: 'Sent for approval', description: 'Waiting for the finance team' },
  { title: 'Approved', description: 'Changes applied to the October billing' },
];

@Component({
  selector: 'timeline-event-list-example',
  templateUrl: './example.html',
  imports: [IntTimeline],
})
export class TimelineEventListExample {
  readonly entries = ENTRIES;
}
