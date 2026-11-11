import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IntSearchDropdown } from '../../base/search-dropdown';

type Category = 'All' | 'Fees' | 'Reports' | 'Dashboards';

interface Entry {
  code: string;
  name: string;
  icon: string;
  category: Exclude<Category, 'All'>;
  banks?: number;
  lastViewed?: string;
}

interface Section {
  label: string;
  items: Entry[];
}

const RECENT: readonly Entry[] = [
  {
    code: '3M6163430',
    name: 'Visa Risk Essentials - Domestic Card Not Present Transactions Fee',
    icon: 'icon-credit-card',
    category: 'Fees',
    banks: 4,
    lastViewed: '2 days ago',
  },
  { code: 'TDC0100', name: 'Data Integrity Monitoring Program', icon: 'icon-credit-card', category: 'Fees', banks: 12, lastViewed: '2 hours ago' },
  { code: 'Code here', name: 'Text of description', icon: 'icon-file', category: 'Reports' },
];

const CATALOG: readonly Entry[] = [
  { code: 'FEE-01', name: 'Authorization Services', icon: 'icon-list', category: 'Fees' },
  { code: 'FEE-02', name: 'Clearing and Settlement Services', icon: 'icon-list', category: 'Fees' },
  { code: 'FEE-03', name: 'Mandated Services', icon: 'icon-list', category: 'Fees' },
  { code: 'RPT-01', name: 'Mastercard Issuer - Top 20 Fee Group', icon: 'icon-reports', category: 'Reports' },
  { code: 'RPT-02', name: 'Visa Issuer - Top 5 Fee Group', icon: 'icon-reports', category: 'Reports' },
  { code: 'DSH-01', name: 'Cost Analysis Dashboard', icon: 'icon-dashboards', category: 'Dashboards' },
  { code: 'DSH-02', name: 'Penalties & Optional Services Dashboard', icon: 'icon-dashboards', category: 'Dashboards' },
];

/** Simulated answer time of the search service. */
const ANSWER_DELAY = 800;

@Component({
  selector: 'search-dropdown-global-search-example',
  templateUrl: './example.html',
  imports: [IntSearchDropdown, FormsModule],
})
export class SearchDropdownGlobalSearchExample {
  protected readonly categories: readonly Category[] = ['All', 'Fees', 'Reports', 'Dashboards'];
  protected readonly explore = [
    { label: 'Explore all fees', icon: 'icon-list' },
    { label: 'Explore reports', icon: 'icon-reports' },
    { label: 'Explore dashboards', icon: 'icon-dashboards' },
  ] as const;

  protected query = '';
  protected readonly activeCategory = signal<Category>('All');
  protected readonly results = signal<Section[]>([]);
  protected readonly loading = signal(false);
  /** First answer received: from then on header and footer keep their content while loading. */
  protected readonly loaded = signal(false);
  /** Code of the entry whose truncated label shows the tooltip. TODO(dep:tooltip provisional) */
  protected readonly tooltip = signal<string | null>(null);
  protected readonly last = signal('');
  private timeout?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timeout));
  }

  // Empty text (completeOnFocus): only the recent items.
  protected search(query: string): void {
    this.answer(() => this.filter(query, this.activeCategory()));
  }

  // A category change reloads the list with the current text; loading keeps the skeleton meanwhile.
  protected selectCategory(category: Category): void {
    this.activeCategory.set(category);
    this.loading.set(true);
    this.answer(() => this.filter(this.query, category));
  }

  protected open(value: unknown): void {
    this.last.set(`Open: ${(value as Entry).name}`);
  }

  // Only a label cut by the ellipsis needs the tooltip. TODO(dep:tooltip provisional)
  protected showTooltip(event: MouseEvent, entry: Entry): void {
    const label = event.currentTarget as HTMLElement;
    this.tooltip.set(label.scrollWidth > label.clientWidth ? entry.code : null);
  }

  private answer(results: () => Section[]): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.results.set(results());
      this.loading.set(false);
      this.loaded.set(true);
    }, ANSWER_DELAY);
  }

  private filter(query: string, category: Category): Section[] {
    const text = query.toLowerCase();
    const matches = (entry: Entry) =>
      (category === 'All' || entry.category === category) && entry.name.toLowerCase().includes(text);
    const sections: Section[] = [
      { label: 'Recent', items: RECENT.filter(matches) },
      { label: category === 'All' ? 'Results' : category, items: text ? CATALOG.filter(matches) : [] },
    ];
    return sections.filter((section) => section.items.length);
  }
}
