import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, input, output,
  TemplateRef, ViewEncapsulation,
} from '@angular/core';

/**
 * <int-card> · version 1. Replica of PrimeNG v20 p-card without PrimeNG at runtime.
 * Flexible container: optional #header, title/subtitle, projected content and #footer.
 */
@Component({
  selector: 'int-card',
  templateUrl: './card.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-card puts its root class on the host. Single class bindings keep the
  // consumer's own classes (int-card--mini, int-card--option…) on the same element.
  host: {
    class: 'int-card',
    '[class.int-card--selectable]': 'selectable()',
    '[class.int-card--selected]': 'selectable() && selected()',
    '[class.int-card--disabled]': 'disabled()',
    '[attr.role]': "selectable() ? 'button' : null",
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-pressed]': 'selectable() ? selected() : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'select($event)',
    '(keydown.enter)': 'select($event)',
    '(keydown.space)': 'select($event)',
  },
})
export class IntCard {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /** Header (title) of the card; a #title template takes precedence. */
  readonly header = input<string>();
  /** Subheader (subtitle) of the card; a #subtitle template takes precedence. */
  readonly subheader = input<string>();
  /** int-* extension: fixed height of the #header (any CSS length, e.g. '240px'); the media fills it. */
  readonly headerHeight = input<string>();

  /**
   * int-* extension: the card works as a toggle button (mini, option and version formats of the
   * knowledge base). Adds role="button", a tab stop, aria-pressed and Enter/Space.
   */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** int-* extension: pressed state of a selectable card (aria-pressed). The consumer owns it. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** int-* extension: disables a selectable card (no tab stop, no onSelect, aria-disabled). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** int-* extension: emitted on click, Enter or Space when the card is selectable and enabled. */
  readonly onSelect = output<Event>();

  // Templates by reference, same names as PrimeNG (direct children only, like p-card).
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header', { descendants: false });
  protected readonly titleTemplate = contentChild<TemplateRef<unknown>>('title', { descendants: false });
  protected readonly subtitleTemplate = contentChild<TemplateRef<unknown>>('subtitle', { descendants: false });
  protected readonly contentTemplate = contentChild<TemplateRef<unknown>>('content', { descendants: false });
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer', { descendants: false });

  protected readonly hasTitle = computed(() => !!this.header() || !!this.titleTemplate());
  protected readonly hasSubtitle = computed(() => !!this.subheader() || !!this.subtitleTemplate());

  /** One tab stop only when selectable; a disabled card leaves the tab order. */
  protected readonly tabIndex = computed(() => {
    if (!this.selectable()) return null;
    return this.disabled() ? -1 : 0;
  });

  protected select(event: Event): void {
    if (!this.selectable() || this.disabled()) return;
    // Space would scroll the page and Enter could submit a surrounding form.
    if (event instanceof KeyboardEvent) event.preventDefault();
    this.onSelect.emit(event);
  }
}
