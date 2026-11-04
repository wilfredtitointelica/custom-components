import { Component } from '@angular/core';

import { IntProgressbar, IntProgressbarSeverity } from '../../base/progressbar';

interface ThresholdRow {
  label: string;
  current: number;
  minimum: number;
  severity: IntProgressbarSeverity;
}

/** Compliance rows: current value vs the minimum, colored by status. */
const MOCK_ROWS: readonly ThresholdRow[] = [
  { label: 'Non compliant', current: 42.18, minimum: 75, severity: 'danger' },
  { label: 'Risky', current: 65.42, minimum: 75, severity: 'warn' },
  { label: 'Compliant', current: 88.9, minimum: 75, severity: 'success' },
];

@Component({
  selector: 'progressbar-threshold-progress-bar-example',
  templateUrl: './example.html',
  imports: [IntProgressbar],
})
export class ProgressbarThresholdProgressBarExample {
  protected readonly rows = MOCK_ROWS;
}
