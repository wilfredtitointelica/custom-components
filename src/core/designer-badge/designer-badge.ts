import { Component, computed, input } from '@angular/core';

import { designerColor, designerInitials, UNASSIGNED_DESIGNER } from '../../service/designers';

/**
 * Designer in charge of a component version (static `designer` of its base class): avatar with the
 * initials in the designer's color ring + "Diseñador" + name. Same colors as Reference → Status.
 */
@Component({
  selector: 'app-designer-badge',
  template: `
    <span class="doc-avatar" [style.--doc-designer-color]="color()" aria-hidden="true">{{ initials() }}</span>
    <span class="doc-text">
      <span class="doc-label">Diseñador</span>
      <span class="doc-name" [class.doc-is-empty]="!designer()">{{ name() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .doc-avatar {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow:
        0 0 0 2px var(--doc-surface),
        0 0 0 4px var(--doc-designer-color);
      background: var(--doc-primary-container);
      color: var(--doc-on-primary-container);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .doc-text {
      display: grid;
      line-height: 1.25;
    }
    .doc-label {
      color: var(--doc-ink-muted);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .doc-name {
      color: var(--doc-ink);
      font-size: 0.875rem;
      font-weight: 500;
    }
    .doc-name.doc-is-empty {
      color: var(--doc-ink-muted);
      font-style: italic;
    }
  `,
})
export class DesignerBadge {
  /** '' or missing = unassigned. */
  readonly designer = input<string | undefined>();

  protected readonly name = computed(() => this.designer() || UNASSIGNED_DESIGNER);
  protected readonly color = computed(() => designerColor(this.designer()));
  protected readonly initials = computed(() => designerInitials(this.designer()));
}
