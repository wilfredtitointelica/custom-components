import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, contentChild, input, TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/**
 * <int-card> · version 1. Replica of PrimeNG v20 p-card without PrimeNG at runtime.
 * Flexible container: optional header slot, title/subtitle, projected content and footer.
 */
@Component({
  selector: 'int-card',
  templateUrl: './card.html',
  styleUrl: '../styles/_index.scss',
  imports: [NgTemplateOutlet],
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-card puts its root class on the host element. A static class keeps the
  // consumer's own classes (int-card--data, int-card--mini…) on the same element.
  host: { class: 'int-card' },
})
export class IntCard {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  /** Title of the card; ignored when a #title template is given. */
  readonly header = input<string>();
  /** Subtitle of the card; ignored when a #subtitle template is given. */
  readonly subheader = input<string>();

  // Projectable templates, same reference names as PrimeNG (direct children only, like p-card).
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header', { descendants: false });
  protected readonly titleTemplate = contentChild<TemplateRef<unknown>>('title', { descendants: false });
  protected readonly subtitleTemplate = contentChild<TemplateRef<unknown>>('subtitle', { descendants: false });
  protected readonly contentTemplate = contentChild<TemplateRef<unknown>>('content', { descendants: false });
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer', { descendants: false });

  protected readonly hasTitle = computed(() => !!this.header() || !!this.titleTemplate());
  protected readonly hasSubtitle = computed(() => !!this.subheader() || !!this.subtitleTemplate());
}
