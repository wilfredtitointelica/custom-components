import { Injectable, signal } from '@angular/core';

/** Remembers, per variant ID, whether its code panel is shown. */
@Injectable({ providedIn: 'root' })
export class CodeVisibility {
  private readonly visible = signal<ReadonlySet<string>>(new Set());

  isVisible(variantId: string): boolean {
    return this.visible().has(variantId);
  }

  toggle(variantId: string): void {
    this.visible.update((current) => {
      const next = new Set(current);
      if (!next.delete(variantId)) next.add(variantId);
      return next;
    });
  }
}
