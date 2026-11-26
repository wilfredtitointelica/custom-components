import { Component } from '@angular/core';

import { IntLinechart, IntLinechartData } from '../../base/linechart';

@Component({
  selector: 'linechart-colors-example',
  templateUrl: './example.html',
  imports: [IntLinechart],
})
export class LinechartColorsExample {
  private readonly labels = ['Q1', 'Q2', 'Q3', 'Q4'];

  /** Brand colors by name. */
  readonly brands: IntLinechartData = {
    labels: this.labels,
    datasets: [
      { label: 'Mastercard', color: 'mastercard', data: [12, 18, 15, 22] },
      { label: 'Visa', color: 'visa', data: [9, 11, 14, 17] },
      { label: 'Amex', color: 'amex', data: [4, 6, 5, 8] },
    ],
  };

  /** No color: the categorical palette in order (1, 2, 3…). */
  readonly palette: IntLinechartData = {
    labels: this.labels,
    datasets: [
      { label: 'Series 1', data: [20, 24, 22, 28] },
      { label: 'Series 2', data: [15, 17, 19, 18] },
      { label: 'Series 3', data: [10, 12, 9, 14] },
      { label: 'Series 4', data: [6, 8, 7, 9] },
      { label: 'Series 5', data: [3, 4, 5, 4] },
    ],
  };
}
