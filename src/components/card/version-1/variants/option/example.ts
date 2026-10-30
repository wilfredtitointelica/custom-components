import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface Option {
  id: string;
  /** primeicons class of the option. */
  icon: string;
  title: string;
  description: string;
  disabled: boolean;
}

const OPTIONS: readonly Option[] = [
  { id: 'report', icon: 'pi-file', title: 'Report', description: 'Generate a PDF report', disabled: false },
  { id: 'dashboard', icon: 'pi-chart-line', title: 'Dashboard', description: 'Open the live dashboard', disabled: false },
  { id: 'export', icon: 'pi-download', title: 'Export', description: 'Download the raw data', disabled: false },
  { id: 'share', icon: 'pi-share-alt', title: 'Share', description: 'Not available yet', disabled: true },
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
