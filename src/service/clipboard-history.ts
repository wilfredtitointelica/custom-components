import { Injectable, computed, signal } from '@angular/core';

/** What was copied: example code, an icon class, a style token or a helper class. */
export type ClipKind = 'code' | 'icon' | 'token' | 'class';

export interface ClipEntry {
  readonly id: string;
  readonly kind: ClipKind;
  /** Text written to the clipboard. */
  readonly text: string;
  /** What the list shows (the code shows its language and variant, not the source). */
  readonly label: string;
  readonly at: number;
}

export const CLIP_KINDS: readonly ClipKind[] = ['code', 'icon', 'token', 'class'];

/** Entries kept per kind; older ones are dropped. */
const MAX_PER_KIND = 5;
/** A copy of the same text within this time (repeated clicks) is ignored. */
const REPEAT_MS = 1000;
const STORAGE_KEY = 'doc-clipboard-history';

/**
 * Memory of the last copies of the whole app (global floating button), saved in localStorage.
 * Copying an entry again moves it to the top instead of repeating it.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardHistory {
  private readonly items = signal<readonly ClipEntry[]>(load());
  private readonly pulses = signal(0);

  /** Newest first. */
  readonly entries = this.items.asReadonly();
  readonly count = computed(() => this.items().length);
  /** Grows on every recorded copy, so the button can react. */
  readonly pulse = this.pulses.asReadonly();

  /** Writes `text` to the clipboard and records it. False when the browser blocks the clipboard. */
  async copy(kind: ClipKind, text: string, label = text): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return false;
    }
    this.record(kind, text, label);
    return true;
  }

  /** Copies an entry from the history again without moving it, so the list stays where the user is looking. */
  async recopy(entry: ClipEntry): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(entry.text);
      return true;
    } catch {
      return false;
    }
  }

  remove(id: string): void {
    this.save(this.items().filter((entry) => entry.id !== id));
  }

  clear(): void {
    this.save([]);
  }

  private record(kind: ClipKind, text: string, label: string): void {
    const now = Date.now();
    const current = this.items();
    const same = current.find((entry) => entry.kind === kind && entry.text === text);
    if (same && now - same.at < REPEAT_MS) {
      return;
    }
    const entry: ClipEntry = { id: `${now}-${Math.random().toString(36).slice(2, 7)}`, kind, text, label, at: now };
    const rest = current.filter((item) => item !== same);
    const sameKind = rest.filter((item) => item.kind === kind).slice(0, MAX_PER_KIND - 1);
    this.save([entry, ...rest.filter((item) => item.kind !== kind || sameKind.includes(item))]);
    this.pulses.update((n) => n + 1);
  }

  private save(entries: readonly ClipEntry[]): void {
    this.items.set(entries);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage blocked or full: the history lives only in this session.
    }
  }
}

function load(): readonly ClipEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((entry) => CLIP_KINDS.includes(entry?.kind)) : [];
  } catch {
    return [];
  }
}
