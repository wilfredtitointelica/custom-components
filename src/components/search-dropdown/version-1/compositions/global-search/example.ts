import { afterNextRender, Component, DestroyRef, DOCUMENT, inject, Injector, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearchDropdown } from '../../base/search-dropdown';

type Category = 'All' | 'Fees' | 'Reports';

interface Entry {
  name: string;
  icon: string;
  code?: string;
  banks?: number;
  lastViewed?: string;
  /** Navigation row (Explore…, Create…): kept while searching, no highlight. */
  action?: boolean;
  /** Fixed at the bottom of the list while it scrolls (optionSticky="sticky"). */
  sticky?: boolean;
}

interface Section {
  label: string;
  items: Entry[];
}

const RECENTS: readonly Entry[] = [
  {
    code: '3M6163430',
    name: 'Visa Risk Essentials - Domestic Card Not Present Transactions Fee',
    icon: 'icon-credit-card',
    banks: 4,
    lastViewed: '2 days ago',
  },
  { code: 'TDC0100', name: 'Data Integrity Monitoring Program', icon: 'icon-credit-card', banks: 12, lastViewed: '2 hours ago' },
];

const FEE_CATEGORIES: readonly Entry[] = [
  { name: 'Association Assessment', icon: 'icon-file' },
  { name: 'Authorization Services', icon: 'icon-file' },
  { name: 'Mandated Services', icon: 'icon-file' },
  { name: 'Optional Services', icon: 'icon-file' },
  { name: 'Penalties', icon: 'icon-file' },
  { name: 'Clearing and Settlement Services', icon: 'icon-file' },
];

const REPORTS: readonly Entry[] = [
  { code: 'OPC-1-ISS-CRD', name: 'L5Q - Mastercard & Visa - Cards by Program Type', icon: 'icon-file' },
  { code: '2024-25-V-M-TOTBILL', name: '2024-25 Visa Mastercard Monthly Expenses', icon: 'icon-file' },
  { code: 'BILL-ACQPOS-01', name: 'L12M - Mastercard & Visa Acquirer Merchant - POS Expenses', icon: 'icon-file' },
  { code: 'UC-1-OR-ISS-01', name: 'L4Q - Mastercard & Visa - Issuer - Unit Costs - Value', icon: 'icon-file' },
  { code: 'BILL-ISS-01', name: 'L12M - Mastercard & Visa Issuer - Monthly Expenses by Brand', icon: 'icon-file' },
  { code: 'ALLOC-01', name: 'L12M - Mastercard & Visa - Monthly Direct & Distributed Expenses', icon: 'icon-file' },
  { code: 'UC-1-TOT-ISS-01', name: 'L4Q - Mastercard & Visa - Issuer - Unit Costs - Total', icon: 'icon-file' },
  { code: 'BILL-ACQATM-01', name: 'L12M - Mastercard & Visa Acquirer ATM - Monthly Expenses', icon: 'icon-file' },
  { code: 'MC-REB-01', name: 'Rebateable Mastercard Monthly Expenses', icon: 'icon-file' },
];

const CUSTOM_REPORTS: readonly Entry[] = [
  { code: 'AH-200428B', name: 'All MasterCard fees - by Subcategory', icon: 'icon-file' },
  { code: 'AH-24042401', name: 'L12M - Monthly net fees by Bank, Brand, Business Line', icon: 'icon-file' },
  { code: 'BILL-ACQATM-PEN-BNK-02', name: 'L12M - Mastercard & Visa Acquirer ATM Penalties by Bank', icon: 'icon-file' },
  { code: 'BILL-ACQPOS-PEN-BNK-02', name: 'L12M - Mastercard & Visa Acquirer POS Penalties by Bank', icon: 'icon-file' },
];

const EXPLORE_ALL: readonly Entry[] = [
  { name: 'Explore all fees', icon: 'icon-list', action: true },
  { name: 'Explore reports', icon: 'icon-file', action: true },
];

/** Simulated answer time of the search service. */
const ANSWER_DELAY = 800;

@Component({
  selector: 'search-dropdown-global-search-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown, FormsModule],
})
export class SearchDropdownGlobalSearchExample {
  protected readonly categories: readonly Category[] = ['All', 'Fees', 'Reports'];
  /** Only one tooltip is open at a time. TODO(dep:tooltip provisional) */
  protected readonly tooltipId = 'global-search-tooltip';

  protected query = '';
  protected readonly activeCategory = signal<Category>('All');
  protected readonly results = signal<Section[]>([]);
  protected readonly loading = signal(false);
  /** First answer received: from then on header and footer keep their content while loading. */
  protected readonly loaded = signal(false);
  /** Name of the entry whose truncated label shows the tooltip. TODO(dep:tooltip provisional) */
  protected readonly tooltip = signal<string | null>(null);
  protected readonly last = signal('');
  private timeout?: ReturnType<typeof setTimeout>;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
  }

  // Empty text (completeOnFocus): the starting groups of the category.
  protected search(query: string): void {
    this.answer(() => this.sections(query, this.activeCategory()));
  }

  // A category change reloads the list with the current text; loading keeps the skeleton meanwhile.
  protected selectCategory(category: Category): void {
    this.activeCategory.set(category);
    this.loading.set(true);
    this.answer(() => this.sections(this.query, category));
  }

  protected open(value: unknown): void {
    const entry = value as Entry;
    this.last.set(`${entry.action ? 'Go to' : 'Open'}: ${entry.name}`);
  }

  // Only a label cut by the ellipsis needs the tooltip. TODO(dep:tooltip provisional)
  protected showTooltip(event: MouseEvent, entry: Entry): void {
    const label = event.currentTarget as HTMLElement;
    if (label.scrollWidth <= label.clientWidth) {
      this.tooltip.set(null);
      return;
    }
    this.tooltip.set(entry.name);
    // Fixed tooltip just above the label, from its position on screen (what int-tooltip will do when appended to
    // the body): the scroll of the results can neither cut nor shift it.
    afterNextRender(
      () => {
        const tooltip = this.document.getElementById(this.tooltipId);
        if (!tooltip) return;
        const rect = label.getBoundingClientRect();
        const gap = rect.height / 4;
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - gap}px`;
      },
      { injector: this.injector },
    );
  }

  private answer(sections: () => Section[]): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.results.set(sections());
      this.loading.set(false);
      this.loaded.set(true);
    }, ANSWER_DELAY);
  }

  /** Groups of each category (PRD): the actions close their group and stay while searching. */
  private sections(query: string, category: Category): Section[] {
    const text = query.toLowerCase();
    const match = (entries: readonly Entry[]) =>
      entries.filter((entry) => `${entry.code ?? ''} ${entry.name}`.toLowerCase().includes(text));
    const byCategory: Record<Category, Section[]> = {
      All: [
        { label: 'Recents', items: match(RECENTS) },
        { label: 'Results', items: text ? match([...FEE_CATEGORIES, ...REPORTS, ...CUSTOM_REPORTS]) : [] },
        { label: 'Explore', items: [...EXPLORE_ALL] },
      ],
      Fees: [
        { label: 'Recents', items: match(RECENTS) },
        {
          label: 'Fee Category',
          items: [...match(FEE_CATEGORIES), { name: 'Explore all fees', icon: 'icon-list', action: true }],
        },
      ],
      Reports: [
        { label: 'Explore reports', items: match(REPORTS) },
        {
          label: 'Custom reports',
          items: [
            ...match(CUSTOM_REPORTS),
            { name: 'Create custom report', icon: 'icon-add', action: true },
            { name: 'Explore all reports', icon: 'icon-file', action: true, sticky: true },
          ],
        },
      ],
    };
    const sections = byCategory[category].filter((section) => section.items.length);
    // Nothing found but the actions: empty state (the footer still offers Explore all reports).
    return sections.some((section) => section.items.some((item) => !item.action)) ? sections : [];
  }
}
