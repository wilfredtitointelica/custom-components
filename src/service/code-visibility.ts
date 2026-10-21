import { Injectable, signal } from '@angular/core';

/**
 * Which code panels are shown. The global switch (top bar) shows or hides all of them;
 * each variant's own "Code" button overrides that choice for its variant only.
 */
@Injectable({ providedIn: 'root' })
export class CodeVisibility {
  private readonly all = signal(false);
  private readonly overrides = signal<ReadonlyMap<string, boolean>>(new Map());

  /** State of the global switch. */
  readonly allVisible = this.all.asReadonly();

  isVisible(variantId: string): boolean {
    return this.overrides().get(variantId) ?? this.all();
  }

  /** Global switch: shows or hides every panel, discarding per-variant choices. */
  setAll(visible: boolean): void {
    this.all.set(visible);
    this.overrides.set(new Map());
  }

  /** Per-variant button. */
  toggle(variantId: string): void {
    const visible = !this.isVisible(variantId);
    this.overrides.update((current) => new Map(current).set(variantId, visible));
  }
}
