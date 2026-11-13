import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import { IntIcon, uniqueId } from '../../../_shared_';

export type IntAccordionValue = string | number;

/**
 * <int-accordion> · version 1. PrimeNG v20 composition API (panel / header / content); arrow keys
 * move between headers. Parts are BEM elements of `int-accordion`: __panel, __header, __trigger,
 * __content…
 *
 * @example
 * <int-accordion [(value)]="open" multiple>
 *   <int-accordion-panel value="fees">
 *     <int-accordion-header>Fees</int-accordion-header>
 *     <int-accordion-content>...</int-accordion-content>
 *   </int-accordion-panel>
 * </int-accordion>
 */
@Component({
  selector: 'int-accordion',
  templateUrl: './accordion.html',
  styleUrl: '../styles/_index.scss',
  host: { class: 'int-accordion', '[class.int-accordion--card]': 'variant() === "card"' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntAccordion {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Active panel value (single) or values (`multiple`). */
  readonly value = model<IntAccordionValue | IntAccordionValue[] | null>(null);
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * int-* extension (PrimeNG restyles through `dt`): `card` renders each panel as a bordered card
   * (Style Guide alerts `.borderWrapper`, "Alert sent" accordion). Default: panels separated by lines.
   */
  readonly variant = input<'card' | undefined>(undefined);

  readonly onOpen = output<IntAccordionValue>();
  readonly onClose = output<IntAccordionValue>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  isActive(panel: IntAccordionValue): boolean {
    const value = this.value();
    return Array.isArray(value) ? value.includes(panel) : value === panel;
  }

  toggle(panel: IntAccordionValue): void {
    const active = this.isActive(panel);
    const value = this.value();
    if (this.multiple()) {
      const list = Array.isArray(value) ? value : value == null ? [] : [value];
      this.value.set(active ? list.filter((v) => v !== panel) : [...list, panel]);
    } else {
      this.value.set(active ? null : panel);
    }
    if (active) this.onClose.emit(panel);
    else this.onOpen.emit(panel);
  }

  /** Roving focus between headers (WAI-ARIA accordion pattern). */
  focusHeader(from: HTMLElement, key: string): void {
    const headers = Array.from(
      this.el.nativeElement.querySelectorAll<HTMLButtonElement>(
        ':scope > int-accordion-panel > int-accordion-header > .int-accordion__trigger:not([disabled])',
      ),
    );
    const i = headers.indexOf(from as HTMLButtonElement);
    const target =
      key === 'ArrowDown' ? headers[(i + 1) % headers.length]
      : key === 'ArrowUp' ? headers[(i - 1 + headers.length) % headers.length]
      : key === 'Home' ? headers[0]
      : headers[headers.length - 1];
    target?.focus();
  }
}

@Component({
  selector: 'int-accordion-panel',
  template: '<ng-content />',
  host: {
    class: 'int-accordion__panel',
    '[class.int-accordion__panel--active]': 'active()',
    '[class.int-accordion__panel--disabled]': 'disabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntAccordionPanel {
  readonly value = input.required<IntAccordionValue>();
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly accordion = inject(IntAccordion);
  readonly active = computed(() => this.accordion.isActive(this.value()));
  readonly headerId = uniqueId('int-accordion-header');
  readonly contentId = uniqueId('int-accordion-content');
}

@Component({
  selector: 'int-accordion-header',
  imports: [IntIcon],
  template: `
    <button
      type="button"
      class="int-accordion__trigger"
      [id]="panel.headerId"
      [disabled]="panel.disabled()"
      [attr.aria-expanded]="panel.active()"
      [attr.aria-controls]="panel.contentId"
      (click)="panel.accordion.toggle(panel.value())"
      (keydown)="onKeydown($event)"
    >
      <span class="int-accordion__title"><ng-content /></span>
      <int-icon class="int-accordion__toggle-icon" name="chevron-down" />
    </button>
  `,
  host: { class: 'int-accordion__header', role: 'heading', 'aria-level': '3' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntAccordionHeader {
  protected readonly panel = inject(IntAccordionPanel);

  protected onKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.panel.accordion.focusHeader(event.currentTarget as HTMLElement, event.key);
    }
  }
}

@Component({
  selector: 'int-accordion-content',
  template: `
    <div class="int-accordion__content-inner">
      <div class="int-accordion__content-body"><ng-content /></div>
    </div>
  `,
  host: {
    class: 'int-accordion__content',
    role: 'region',
    '[id]': 'panel.contentId',
    '[attr.aria-labelledby]': 'panel.headerId',
    '[attr.inert]': 'panel.active() ? null : ""',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntAccordionContent {
  protected readonly panel = inject(IntAccordionPanel);
}

/** Convenience array: `imports: [...IntAccordionImports]`. */
export const IntAccordionImports = [
  IntAccordion,
  IntAccordionPanel,
  IntAccordionHeader,
  IntAccordionContent,
] as const;
