import { Component, computed, ElementRef, inject, signal } from '@angular/core';

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
  imports: [IntTreetableModule],
  // TODO(dep:dropdown-select provisional) a press outside the rows per page list closes it.
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class TreetableFeeChartExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly fees = buildFees();
  protected readonly total = this.fees.reduce((sum, node) => sum + (node.data?.amount ?? 0), 0);

  // Paginator controlled from the example: templateLeft changes the rows per page and the page.
  protected readonly rows = signal(10);
  protected readonly first = signal(0);
  protected readonly currentPage = computed(() => Math.floor(this.first() / this.rows()) + 1);
  protected readonly totalPages = computed(() => Math.ceil(this.fees.length / this.rows()));

  // TODO(dep:dropdown-select provisional) open state and options of the rows per page list.
  protected readonly rowsOpen = signal(false);
  /** The list shows the sizes that are not selected, as in the design. */
  protected readonly otherPageSizes = computed(() => PAGE_SIZES.filter((size) => size !== this.rows()));

  protected onPage(event: IntTreetablePageEvent): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  protected toggleRows(): void {
    this.rowsOpen.update((open) => !open);
  }

  /** Same keys as p-select on its trigger: Enter, Space and the arrows open; Escape closes. */
  protected onRowsTriggerKeydown(event: KeyboardEvent): void {
    if (['Enter', ' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.rowsOpen.set(true);
      queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[role="option"]')?.focus());
    } else if (event.key === 'Escape') {
      this.rowsOpen.set(false);
    }
  }

  protected selectRowsPerPage(size: number, trigger: HTMLElement): void {
    this.rows.set(size);
    this.first.set(0);
    this.closeRows(trigger);
  }

  protected closeRows(trigger: HTMLElement): void {
    this.rowsOpen.set(false);
    trigger.focus();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const list = this.host.nativeElement.querySelector('[data-dep="dropdown-select"]');
    if (this.rowsOpen() && !list?.contains(event.target as Node)) this.rowsOpen.set(false);
  }

  // TODO(dep:input provisional) the number input of int-input will clamp the value itself.
  protected onPageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = Math.min(Math.max(Number(input.value) || 1, 1), this.totalPages());
    this.first.set((page - 1) * this.rows());
    input.value = String(page);
  }
}
