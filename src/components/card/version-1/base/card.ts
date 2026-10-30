import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute, ChangeDetectionStrategy, Component, computed, contentChild, input, output,
  TemplateRef, ViewEncapsulation,
} from '@angular/core';

/** Gap between the #content blocks: none 0 · small 4px · (default 6px) · medium 12px · large 16px. */
export type IntCardContentGap = 'none' | 'small' | 'medium' | 'large';

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
  // Same root as PrimeNG: p-card puts its root class on the host. Each modifier is an input that sets
  // its int-card--* class here; single class bindings keep the consumer's own classes (u-*) on the host.
  host: {
    class: 'int-card',
    '[style.inline-size]': 'width()',
    '[class.int-card--compact]': 'compact()',
    '[class.int-card--outlined]': 'outlined()',
    '[class.int-card--no-bg]': 'noBg()',
    '[class.int-card--stretch-content]': 'stretchContent()',
    '[class.int-card--content-gap-none]': "contentGap() === 'none'",
    '[class.int-card--content-gap-small]': "contentGap() === 'small'",
    '[class.int-card--content-gap-medium]': "contentGap() === 'medium'",
    '[class.int-card--content-gap-large]': "contentGap() === 'large'",
    '[class.int-card--mini]': 'mini()',
    '[class.int-card--option]': 'option()',
    '[class.int-card--version]': 'version()',
    '[class.int-card--data]': 'data()',
    '[class.int-card--group]': 'group()',
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
  /** int-* extension: fixed width of the card (any CSS length, e.g. '240px'); without it, it fills its container. */
  readonly width = input<string>();
  /** int-* extension: less padding, gap and radius, and smaller type (.prCard--compact of the knowledge base). */
  readonly compact = input(false, { transform: booleanAttribute });
  /** int-* extension: visible border instead of the shadow (.prCard--outlined of the knowledge base). */
  readonly outlined = input(false, { transform: booleanAttribute });
  /** int-* extension: no background nor shadow (used with group). */
  readonly noBg = input(false, { transform: booleanAttribute });
  /** int-* extension: body and content fill the card height, to center an empty or error state. */
  readonly stretchContent = input(false, { transform: booleanAttribute });
  /** int-* extension: gap between the blocks of #content; without it, the default (6px). */
  readonly contentGap = input<IntCardContentGap>();
  /** int-* extension: compact bordered card (mini format of the knowledge base). */
  readonly mini = input(false, { transform: booleanAttribute });
  /** int-* extension: card to choose an option (option format of the knowledge base). */
  readonly option = input(false, { transform: booleanAttribute });
  /** int-* extension: bordered card to choose a version (version format of the knowledge base). */
  readonly version = input(false, { transform: booleanAttribute });
  /** int-* extension: KPI card without shadow nor padding (data format of the knowledge base). */
  readonly data = input(false, { transform: booleanAttribute });
  /** int-* extension: several metrics in a row, split by dividers (group format of the knowledge base). */
  readonly group = input(false, { transform: booleanAttribute });

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
