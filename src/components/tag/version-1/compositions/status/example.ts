import { Component } from '@angular/core';

import { IntTag, IntTagSeverity } from '../../base/tag';

interface Status {
  readonly value: string;
  readonly severity: IntTagSeverity;
  readonly icon: string;
  readonly disabled?: boolean;
}

// The design system states, in the order of the knowledge base.
const STATUSES: readonly Status[] = [
  { value: 'Default', severity: 'secondary', icon: 'icon icon-info' },
  { value: 'Info', severity: 'info', icon: 'icon icon-info' },
  { value: 'Success', severity: 'success', icon: 'icon icon-check' },
  { value: 'Caution', severity: 'caution', icon: 'icon icon-alert' },
  { value: 'Warning', severity: 'warn', icon: 'icon icon-alert' },
  { value: 'Error', severity: 'danger', icon: 'icon icon-alert' },
  { value: 'Disabled', severity: 'secondary', icon: 'icon icon-info', disabled: true },
];

@Component({
  selector: 'tag-status-example',
  templateUrl: './example.html',
  imports: [IntTag],
})
export class TagStatusExample {
  readonly statuses = STATUSES;
}
