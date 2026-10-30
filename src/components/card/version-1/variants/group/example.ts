import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';

import { IntCard } from '../../base/card';

interface Metric {
  label: string;
  date: string;
  currency: string;
  value: string;
  /** u-color-* helper of the amount. */
  color: string;
}

const METRICS: readonly Metric[] = [
  { label: 'Visa', date: 'Jan 2026', currency: 'USD', value: '999 K', color: 'u-color-secondary' },
  { label: 'Mastercard', date: 'Jan 2026', currency: 'USD', value: '845 K', color: 'u-color-primary' },
  { label: 'Amex', date: 'Jan 2026', currency: 'USD', value: '312 K', color: 'u-color-teal-500' },
];

@Component({
  selector: 'card-group-example',
  templateUrl: './example.html',
  imports: [IntCard, NgTemplateOutlet],
})
export class CardGroupExample {
  readonly metrics = METRICS;
}
