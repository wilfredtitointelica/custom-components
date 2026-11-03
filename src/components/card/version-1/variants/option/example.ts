import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface Option {
  id: string;
  /** Style Guide icon class of the option (icon-*). */
  icon: string;
  title: string;
  description: string;
  disabled: boolean;
}

const OPTIONS: readonly Option[] = [
  { id: 'report', icon: 'icon-file', title: 'Report', description: 'Generate a PDF report', disabled: false },
  { id: 'dashboard', icon: 'icon-dashboard', title: 'Dashboard', description: 'Open the live dashboard', disabled: false },
  { id: 'export', icon: 'icon-download', title: 'Export', description: 'Download the raw data', disabled: false },
  { id: 'share', icon: 'icon-shared', title: 'Share', description: 'Not available yet', disabled: true },
];

@Component({
  selector: 'card-option-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardOptionExample {
  readonly options = OPTIONS;
  /** Single choice: only one option is pressed. */
  readonly chosen = signal('report');
}
