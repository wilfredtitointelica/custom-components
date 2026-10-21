import { Component, computed, input } from '@angular/core';

import { designerColor, designerInitials, UNASSIGNED_DESIGNER } from '../../service/designers';

/**
 * Designer in charge of a component version (static `designer` of its base class): avatar with the
 * initials in the designer's color ring + "Diseñador" + name. Same colors as Reference → Status.
 */
@Component({
  selector: 'app-designer-badge',
  template: `
    <span class="avatar" [style.--designer-color]="color()" aria-hidden="true">{{ initials() }}</span>
    <span class="text">
      <span class="label">Diseñador</span>
      <span class="name" [class.is-empty]="!designer()">{{ name() }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow:
        0 0 0 2px var(--c-surface),
        0 0 0 4px var(--designer-color);
      background: var(--c-primary-container);
      color: var(--c-on-primary-container);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .text {
      display: grid;
      line-height: 1.25;
    }
    .label {
      color: var(--c-ink-muted);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .name {
      color: var(--c-ink);
      font-size: 0.875rem;
      font-weight: 500;
    }
    .name.is-empty {
      color: var(--c-ink-muted);
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
