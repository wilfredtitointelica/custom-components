import { Component } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntCard } from '../../../../card/version-1/base/card';
import { IntLitetable, IntLitetableColumn } from '../../../../litetable/version-1/base/litetable';
import { IntLinechart, IntLinechartData } from '../../base/linechart';

/** Month of the tooltip header: `Jan, 2026`. */
const PERIODS = [
  'Nov, 2025',
  'Dec, 2025',
  'Jan, 2026',
  'Feb, 2026',
  'Mar, 2026',
  'Apr, 2026',
  'May, 2026',
  'Jun, 2026',
  'Jul, 2026',
  'Aug, 2026',
  'Sep, 2026',
  'Oct, 2026',
  'Nov, 2026',
];

/** Breakdown of each net amount (demo): what the tooltip template reads from `meta`. */
const breakdown = (values: readonly (number | null)[]) =>
  values.map((net, i) => {
    if (net === null) return null;
    const adjustments = Math.round(net * 0.0015);
    return {
      period: PERIODS[i],
      gross: net - adjustments,
      adjustments,
      exclusions: 0,
      notAllocated: 0,
      net,
    };
  });

const mastercard = [
  1_030_000, 880_000, 1_870_000, 630_000, 1_180_000, 1_950_000, 1_550_000, 1_720_000, 3_220_000,
  2_700_000, 1_820_000, 2_850_000, 1_050_000,
];
const visa = [
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
];

/** Breakdown of one month, as `meta` of each point. */
type Breakdown = NonNullable<ReturnType<typeof breakdown>[number]>;

const amount = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

@Component({
  selector: 'linechart-net-fees-example',
  templateUrl: './example.html',
  imports: [IntCard, IntButton, IntLinechart, IntLitetable],
  // As wide as its container, like the dashboard panel.
  host: { class: 'u-full-width' },
})
export class LinechartNetFeesExample {
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
      { label: 'Mastercard', color: 'mastercard', data: mastercard, meta: breakdown(mastercard) },
      { label: 'Visa', color: 'visa', data: visa, meta: breakdown(visa) },
    ],
  };

  /** Columns of the tooltip breakdown: label and amount on the right. */
  readonly columns: IntLitetableColumn[] = [
    { field: 'label' },
    { field: 'amount' },
  ];

  /** Rows of the tooltip breakdown from the point `meta`; amounts as 1.86M, 2.69K, 0. */
  readonly rows = (meta: Breakdown): { label: string; amount: string }[] => [
    { label: 'Gross', amount: amount.format(meta.gross) },
    { label: 'Adjustments', amount: amount.format(meta.adjustments) },
    { label: 'Exclusions', amount: amount.format(meta.exclusions) },
    { label: 'Not allocated', amount: amount.format(meta.notAllocated) },
    { label: 'Net Expenses', amount: amount.format(meta.net) },
  ];
}
