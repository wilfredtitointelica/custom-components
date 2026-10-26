import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { HelperCategory, readStyleHelpers } from './style-guide-helpers';
import { StyleGuideCodeSwitch } from './style-guide-code-switch';
import { StyleGuideHelperRule } from './style-guide-helper-rule';
import { readStyleGuideSources } from './style-guide-source';
import { StyleGuideTokenTable } from './style-guide-token-table';
import { readStyleTokens, StyleToken, TokenFile, TokenGroup } from './style-guide-tokens';

type StyleGuideTab = 'tokens' | 'helpers';

/** Entry of the side menu: a token file or a helper category (scrolls to its section). */
interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

interface NavGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavItem[];
}

const TABS: readonly StyleGuideTab[] = ['tokens', 'helpers'];
const GROUPS: readonly { readonly id: TokenGroup; readonly label: string }[] = [
  { id: 'main', label: 'Main' },
  { id: 'custom', label: 'Custom' },
  { id: 'draft', label: 'Draft' },
];
const REFRESH_DEBOUNCE_MS = 150;

/**
 * Modal <dialog> with what the Intelica Style Guide puts in the page: its --i-* tokens grouped by source file
 * and its helper classes grouped by the section comments of _helpers.scss. Both are read from the bundle's
 * sources when it opens and again on every change of its CSS while open (style-guide-source.ts).
 * Closes with X, Esc or the backdrop.
 */
@Component({
  selector: 'app-style-guide-dialog',
  imports: [StyleGuideCodeSwitch, StyleGuideHelperRule, StyleGuideTokenTable],
  templateUrl: './style-guide-dialog.html',
  styleUrl: './style-guide-dialog.scss',
})
export class StyleGuideDialog {
  protected readonly tabs = TABS;
  protected readonly tab = signal<StyleGuideTab>('tokens');
  /** Null when the bundle's sources could not be read. */
  protected readonly files = signal<readonly TokenFile[] | null>([]);
  protected readonly helpers = signal<readonly HelperCategory[] | null>([]);
  protected readonly copied = signal<string | null>(null);
  /** Helpers tab, Properties switch: on, the blocks with their properties; off, only the class names (no dot, no braces). */
  protected readonly showCode = signal(true);

  /** Each tab keeps its own search and active menu entry. */
  private readonly queries = { tokens: signal(''), helpers: signal('') };
  private readonly actives = { tokens: signal<string | null>(null), helpers: signal<string | null>(null) };
  protected readonly query = computed(() => this.queries[this.tab()]());
  protected readonly active = computed(() => this.actives[this.tab()]());
  protected readonly unreadable = computed(() => (this.tab() === 'tokens' ? this.files() : this.helpers()) === null);

  /** Files with the tokens that match the search (name, value, resolved value or note). */
  protected readonly visibleFiles = computed(() => {
    const term = this.queries.tokens().trim().toLowerCase();
    return (this.files() ?? []).map((file) => ({
      ...file,
      tokens: term ? file.tokens.filter((token) => matches(token, term)) : file.tokens,
    }));
  });
  /** Categories with the blocks that define a class matching the search (class names only, not the content). */
  protected readonly visibleCategories = computed(() => {
    const term = this.queries.helpers().trim().toLowerCase().replace(/^\./, '');
    return (this.helpers() ?? []).map((category) => ({
      ...category,
      rules: term ? category.rules.filter((rule) => rule.classes.some((name) => name.toLowerCase().includes(term))) : category.rules,
    }));
  });
  protected readonly matchCount = computed(() =>
    this.tab() === 'tokens'
      ? this.visibleFiles().reduce((sum, file) => sum + file.tokens.length, 0)
      : this.visibleCategories().reduce((sum, category) => sum + category.rules.length, 0),
  );
  protected readonly navGroups = computed<readonly NavGroup[]>(() => {
    if (this.tab() === 'helpers') {
      // "Helpers Colors" → "Colors": under Categories of the Helpers tab the prefix is implied.
      const items = this.visibleCategories().map(({ id, title, rules }) => ({
        id,
        label: title.replace(/^Helpers\s+/i, ''),
        count: rules.length,
      }));
      return items.length ? [{ id: 'categories', label: 'Categories', items }] : [];
    }
    return GROUPS.map((group) => ({
      ...group,
      items: this.visibleFiles()
        .filter((file) => file.group === group.id)
        .map(({ id, file, tokens }) => ({ id, label: file, count: tokens.length })),
    })).filter((group) => group.items.length);
  });

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly nav = viewChild<ElementRef<HTMLElement>>('nav');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  /** Both tabs render in the same scroll containers: each one keeps its own position (menu and content). */
  private readonly scrolls: Record<StyleGuideTab, { nav: number; content: number }> = {
    tokens: { nav: 0, content: 0 },
    helpers: { nav: 0, content: 0 },
  };
  private readonly injector = inject(Injector);
  private copiedTimer?: ReturnType<typeof setTimeout>;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  /**
   * While open: the style guide's dev server (HMR) rewrites its <style> in <head> when a token or helper
   * changes in its repo, so any change there reads them again (debounced: HMR may add the new style and
   * remove the old one).
   */
  private readonly headObserver = new MutationObserver(() => {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refresh(), REFRESH_DEBOUNCE_MS);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopWatching());
  }

  open(): void {
    this.refresh();
    this.actives.tokens.set(this.files()?.[0]?.id ?? null);
    this.actives.helpers.set(this.helpers()?.[0]?.id ?? null);
    this.dialog().nativeElement.showModal();
    this.headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  /** Native close event (X, Esc, backdrop, close() from outside). */
  protected stopWatching(): void {
    this.headObserver.disconnect();
    clearTimeout(this.refreshTimer);
  }

  /** Reads tokens and helpers again; searches, scroll and active entries are kept (rows are tracked). */
  private refresh(): void {
    const sources = readStyleGuideSources();
    const files = readStyleTokens(sources);
    const helpers = readStyleHelpers(sources);
    this.files.set(files);
    this.helpers.set(helpers);
    keepActive(this.actives.tokens, files);
    keepActive(this.actives.helpers, helpers);
  }

  /** Changes tab keeping the scroll of the one left and restoring the one of the tab shown (once rendered). */
  protected selectTab(tab: StyleGuideTab): void {
    const previous = this.tab();
    if (tab === previous) {
      return;
    }
    this.scrolls[previous] = {
      nav: this.nav()?.nativeElement.scrollTop ?? 0,
      content: this.content()?.nativeElement.scrollTop ?? 0,
    };
    this.tab.set(tab);
    afterNextRender(
      () => {
        const { nav, content } = this.scrolls[tab];
        this.nav()?.nativeElement.scrollTo({ top: nav });
        this.content()?.nativeElement.scrollTo({ top: content });
      },
      { injector: this.injector },
    );
  }

  protected setQuery(value: string): void {
    this.queries[this.tab()].set(value);
  }

  protected sectionId(id: string): string {
    return `doc-sg-${this.tab()}-${id}`;
  }

  protected goTo(id: string): void {
    this.actives[this.tab()].set(id);
    document.getElementById(this.sectionId(id))?.scrollIntoView({ block: 'start' });
  }

  /** Esc with text clears the search; with an empty search it reaches the dialog and closes it. */
  protected clearOnEscape(event: Event): void {
    if (this.query()) {
      this.setQuery('');
      event.preventDefault();
      event.stopPropagation();
    }
  }

  protected copyToken(token: StyleToken): void {
    this.copy(`var(${token.name})`, token.name);
  }

  /** Copies `text` and marks `key` (token or class name) as just copied for a moment. */
  protected async copy(text: string, key = text): Promise<void> {
    await navigator.clipboard.writeText(text);
    clearTimeout(this.copiedTimer);
    this.copied.set(key);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 1500);
  }
}

function matches(token: StyleToken, term: string): boolean {
  return [token.name, token.value, token.resolved, token.note].some((text) => text.toLowerCase().includes(term));
}

/** Keeps the active entry if it still exists after a refresh, else the first one. */
function keepActive(active: { (): string | null; set(id: string | null): void }, list: readonly { id: string }[] | null): void {
  if (!list?.some((item) => item.id === active())) {
    active.set(list?.[0]?.id ?? null);
  }
}
