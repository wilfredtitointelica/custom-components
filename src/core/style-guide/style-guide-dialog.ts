import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';

import { readStyleTokens, StyleToken, TokenFile, TokenGroup } from './style-guide-tokens';

type StyleGuideTab = 'tokens' | 'helpers';

const TABS: readonly StyleGuideTab[] = ['tokens', 'helpers'];
const GROUPS: readonly { readonly id: TokenGroup; readonly label: string }[] = [
  { id: 'main', label: 'Main' },
  { id: 'custom', label: 'Custom' },
  { id: 'draft', label: 'Draft' },
];
const REFRESH_DEBOUNCE_MS = 150;

/**
 * Modal <dialog> with what the Intelica Style Guide puts in the page: its --i-* tokens grouped by source file
 * (read when it opens and again on every change of its CSS while open, see style-guide-tokens.ts) and its helpers. Closes with X, Esc or the backdrop.
 */
@Component({
  selector: 'app-style-guide-dialog',
  templateUrl: './style-guide-dialog.html',
  styleUrl: './style-guide-dialog.scss',
})
export class StyleGuideDialog {
  protected readonly tabs = TABS;
  protected readonly tab = signal<StyleGuideTab>('tokens');
  protected readonly query = signal('');
  /** Null when the bundle's source map could not be read. */
  protected readonly files = signal<readonly TokenFile[] | null>([]);
  protected readonly activeFile = signal<string | null>(null);
  protected readonly copied = signal<string | null>(null);

  /** Files with the tokens that match the search (name, value, resolved value or note). */
  protected readonly visibleFiles = computed(() => {
    const term = this.query().trim().toLowerCase();
    return (this.files() ?? []).map((file) => ({
      ...file,
      tokens: term ? file.tokens.filter((token) => matches(token, term)) : file.tokens,
    }));
  });
  protected readonly matchCount = computed(() => this.visibleFiles().reduce((sum, file) => sum + file.tokens.length, 0));
  protected readonly groups = computed(() =>
    GROUPS.map((group) => ({ ...group, files: this.visibleFiles().filter((file) => file.group === group.id) })).filter(
      (group) => group.files.length,
    ),
  );

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private copiedTimer?: ReturnType<typeof setTimeout>;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  /**
   * While open: the style guide's dev server (HMR) rewrites its <style> in <head> when a token changes in its
   * repo, so any change there re-reads the tokens (debounced: HMR may add the new style and remove the old one).
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
    this.activeFile.set(this.files()?.[0]?.id ?? null);
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

  /** Reads the tokens again; search, scroll and active file are kept (rows are tracked by name). */
  private refresh(): void {
    const files = readStyleTokens();
    this.files.set(files);
    if (!files?.some((file) => file.id === this.activeFile())) {
      this.activeFile.set(files?.[0]?.id ?? null);
    }
  }

  protected sectionId(file: TokenFile): string {
    return `doc-sg-tokens-${file.id}`;
  }

  protected goTo(file: TokenFile): void {
    this.activeFile.set(file.id);
    document.getElementById(this.sectionId(file))?.scrollIntoView({ block: 'start' });
  }

  /** Esc with text clears the search; with an empty search it reaches the dialog and closes it. */
  protected clearOnEscape(event: Event): void {
    if (this.query()) {
      this.query.set('');
      event.preventDefault();
      event.stopPropagation();
    }
  }

  protected async copy(token: StyleToken): Promise<void> {
    await navigator.clipboard.writeText(`var(${token.name})`);
    clearTimeout(this.copiedTimer);
    this.copied.set(token.name);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 1500);
  }
}

function matches(token: StyleToken, term: string): boolean {
  return [token.name, token.value, token.resolved, token.note].some((text) => text.toLowerCase().includes(term));
}
