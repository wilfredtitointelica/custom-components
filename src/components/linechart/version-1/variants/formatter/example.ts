import { Component } from '@angular/core';

import { IntLinechart, IntLinechartData } from '../../base/linechart';

@Component({
  selector: 'linechart-formatter-example',
  templateUrl: './example.html',
  imports: [IntLinechart],
})
export class LinechartFormatterExample {
  readonly data: IntLinechartData = {
    labels: [
      'Nov 25',
      'Dec 25',
      'Jan 26',
      'Feb 26',
      'Mar 26',
      'Apr 26',
      'May 26',
      'Jun 26',
      'Jul 26',
      'Aug 26',
      'Sep 26',
      'Oct 26',
      'Nov 26',
    ],
    datasets: [
      {
        label: 'Mastercard',
        color: 'mastercard',
        data: [
          1_030_000, 880_000, 1_880_000, 630_000, 1_180_000, 1_950_000, 1_550_000, 1_720_000,
          3_220_000, 2_700_000, 1_820_000, 2_850_000, 1_050_000,
        ],
      },
      {
        label: 'Visa',
        color: 'visa',
        data: [
          430_000,
          350_000,
          1_160_000,
          450_000,
          530_000,
          1_260_000,
          870_000,
          1_060_000,
          2_260_000,
          1_270_000,
          1_060_000,
          2_090_000,
          null,
        ],
      },
    ],
  };

  /** Millions with two decimals: 1.88M. */
  readonly millions = (value: number): string => `${(value / 1_000_000).toFixed(2)}M`;
}
