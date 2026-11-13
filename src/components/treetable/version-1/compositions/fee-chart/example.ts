import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntDropdownSelect } from '../../../../dropdown-select/version-1/base/dropdown-select';
import { IntInputNumber } from '../../../../input/version-1/base/input-number';
import { IntSearch } from '../../../../search/version-1/base/search';
import { IntTreeNode, IntTreetableModule, IntTreetablePageEvent } from '../../base/treetable';

interface FeeChartRow {
  brand: 'visa' | 'mastercard';
  institution: string;
  business: string;
  service: string;
  lastBilling: string;
  feeCode: string;
  feeName: string;
  consecutiveBilling: string;
  amount: number;
  adoptionRate: string;
  /** false: the opt-out steps are not available for this service yet. */
  optOut: boolean;
}

const PAGE_SIZES: readonly number[] = [10, 20, 50];

const SERVICES: readonly Omit<FeeChartRow, 'feeCode' | 'feeName' | 'consecutiveBilling' | 'adoptionRate'>[] = [
  { brand: 'visa', institution: 'OTP Bank - Bulgaria', business: 'Issuer', service: 'Visa Risk Essentials and Visa Provisioning Intelligence', lastBilling: '30 Sep, 2026', amount: 608747.95, optOut: true },
  { brand: 'visa', institution: 'OTP Bank NKBM - Slovenia', business: 'Issuer', service: 'Visa Risk Essentials and Visa Provisioning Intelligence', lastBilling: '30 Sep, 2026', amount: 370344.62, optOut: true },
  { brand: 'mastercard', institution: 'OTP Bank - Hungary', business: 'Member', service: 'Smart Authentication Direct', lastBilling: '07 Oct, 2026', amount: 232171.52, optOut: true },
  { brand: 'mastercard', institution: 'OTP Bank - Bulgaria', business: 'Issuer', service: 'Mastercard Principal Member - Understand', lastBilling: '25 Oct, 2026', amount: 228691.57, optOut: true },
  { brand: 'mastercard', institution: 'OTP Bank - Hungary', business: 'Issuer', service: 'Mastercard Principal Member - Understand', lastBilling: '25 Oct, 2026', amount: 139970.99, optOut: false },
  { brand: 'mastercard', institution: 'OTP Bank - Serbia', business: 'Issuer', service: 'Mastercard Principal Member - Understand', lastBilling: '25 Oct, 2026', amount: 139970.99, optOut: false },
  { brand: 'mastercard', institution: 'OTP Bank - Croatia', business: 'Issuer', service: 'Mastercard Principal Member - Understand', lastBilling: '25 Oct, 2026', amount: 136380.99, optOut: false },
  { brand: 'visa', institution: 'OTP Bank - Bulgaria', business: 'Issuer', service: 'VPAI Score Fees', lastBilling: '30 Sep, 2026', amount: 106987.07, optOut: true },
  { brand: 'visa', institution: 'OTP Bank - Croatia', business: 'Issuer', service: 'Visa Risk Essentials and Visa Provisioning Intelligence', lastBilling: '30 Sep, 2026', amount: 91359.55, optOut: false },
  { brand: 'mastercard', institution: 'OTP Bank - Serbia', business: 'Issuer', service: 'Mastercard Threat Scan', lastBilling: '27 Sep, 2026', amount: 72000, optOut: true },
];

/** 100 services (10 pages): each one with its fees as children, splitting the service amount. */
function buildFees(): IntTreeNode<FeeChartRow>[] {
  return Array.from({ length: 100 }, (_, i) => {
    const service = SERVICES[i % SERVICES.length];
    const count = (i % 4) + 1;
    return {
      key: `${i}`,
      data: { ...service, feeCode: `${count} Fees`, feeName: '', consecutiveBilling: '', adoptionRate: '' },
      children: Array.from({ length: count }, (_, j) => ({
        key: `${i}-${j}`,
        data: {
          ...service,
          feeCode: `FC-${1000 + i * 10 + j}`,
          feeName: `Service fee ${j + 1}`,
          consecutiveBilling: `${j + 2} months`,
          amount: Math.round((service.amount / count) * 100) / 100,
          adoptionRate: `${40 + j * 10}%`,
        },
      })),
    };
  });
}

@Component({
  selector: 'treetable-fee-chart-example',
  templateUrl: './example.html',
  imports: [FormsModule, IntTreetableModule, IntSearch, IntButton, IntDropdownSelect, IntInputNumber],
})
export class TreetableFeeChartExample {
  protected readonly fees = buildFees();
  protected readonly total = this.fees.reduce((sum, node) => sum + (node.data?.amount ?? 0), 0);

  // Paginator controlled from the example: templateLeft changes the rows per page and the page.
  protected readonly rows = signal(10);
  protected readonly first = signal(0);
  protected readonly currentPage = computed(() => Math.floor(this.first() / this.rows()) + 1);
  protected readonly totalPages = computed(() => Math.ceil(this.fees.length / this.rows()));

  protected readonly pageSizes = PAGE_SIZES;

  protected onPage(event: IntTreetablePageEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  protected selectRowsPerPage(size: number): void {
    this.rows.set(size);
    this.first.set(0);
  }

  /** int-inputnumber clamps to min / max on blur; while typing, only whole pages in range are applied. */
  protected onPageSelect(page: number | null): void {
    if (page != null && Number.isInteger(page) && page >= 1 && page <= this.totalPages()) {
      this.first.set((page - 1) * this.rows());
    }
  }
}
