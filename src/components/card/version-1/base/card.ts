import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

/** Gap between the #content blocks: none 0 · small 4px · (default 6px) · medium 12px · large 16px. */
export type IntCardContentGap = 'none' | 'small' | 'medium' | 'large';
/** Visual formats of the knowledge base; they exclude each other (compact / outlined / noBg add up). */
export type IntCardAppearance = 'mini' | 'option' | 'version' | 'data' | 'group';

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
    '[class.int-card--compact]': 'compact()',
    '[class.int-card--outlined]': 'outlined()',
    '[class.int-card--no-bg]': 'noBg()',
    '[class.int-card--stretch-content]': 'stretchContent()',
    '[class.int-card--content-gap-none]': "contentGap() === 'none'",
    '[class.int-card--content-gap-small]': "contentGap() === 'small'",
    '[class.int-card--content-gap-medium]': "contentGap() === 'medium'",
    '[class.int-card--content-gap-large]': "contentGap() === 'large'",
    '[class.int-card--mini]': "appearance() === 'mini'",
    '[class.int-card--option]': "appearance() === 'option'",
    '[class.int-card--version]': "appearance() === 'version'",
    '[class.int-card--data]': "appearance() === 'data'",
    '[class.int-card--group]': "appearance() === 'group'",
    '[class.int-card--selectable]': 'selectable()',
    '[class.int-card--selected]': 'selectable() && selected()',
    '[class.int-card--disabled]': 'disabled()',
    '[attr.role]': "selectable() ? 'button' : null",
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-pressed]': 'selectable() ? selected() : null',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'activate($event)',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class IntCard {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Christian Abanto';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Título de la card; una plantilla #title tiene prioridad. */
  readonly header = input<string>();
  /** Subtítulo de la card; una plantilla #subtitle tiene prioridad. */
  readonly subheader = input<string>();
  /** int-* extension: alto fijo del #header (cualquier medida CSS, p. ej. '240px'); la imagen lo llena. */
  readonly headerHeight = input<string>();
  /** int-* extension: menos padding, separación y radio, y texto más pequeño (.prCard--compact de la base de conocimientos). */
  readonly compact = input(false, { transform: booleanAttribute });
  /** int-* extension: borde visible en lugar de la sombra (.prCard--outlined de la base de conocimientos). */
  readonly outlined = input(false, { transform: booleanAttribute });
  /** int-* extension: sin fondo ni sombra (se usa con appearance="group"). */
  readonly noBg = input(false, { transform: booleanAttribute });
  /** int-* extension: el cuerpo y el contenido llenan el alto de la card, para centrar un estado vacío o de error. */
  readonly stretchContent = input(false, { transform: booleanAttribute });
  /** int-* extension: separación entre los bloques de #content; sin él, la de por defecto (6px). */
  readonly contentGap = input<IntCardContentGap>();
  /**
   * int-* extension: formato visual de la base de conocimientos: mini (compacta con borde), option
   * (elegir una opción), version (elegir una versión), data (KPI sin sombra ni padding) o group
   * (métricas en fila con divisores); sin él, la card estándar.
   */
  readonly appearance = input<IntCardAppearance>();

  /**
   * int-* extension: la card funciona como botón de alternar (appearance mini, option y version de la
   * base de conocimientos). Agrega role="button", parada de tabulación, aria-pressed y Enter/Espacio.
   * Como es un botón, no debe contener otros botones ni links (p. ej. acciones en #footer).
   */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** int-* extension: estado presionado de una card selectable (aria-pressed). Lo controla quien la usa. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** int-* extension: deshabilita una card selectable (sin tabulación, sin onSelect, aria-disabled). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** int-* extension: se emite con clic, Enter o Espacio cuando la card es selectable y está habilitada. */
  readonly onSelect = output<Event>();

  // Templates by reference, same names as PrimeNG (direct children only, like p-card).
  /** Imagen o gráfico arriba de la card; su alto es headerHeight. */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header', {
    descendants: false,
  });
  /** Título personalizado; tiene prioridad sobre header. */
  protected readonly titleTemplate = contentChild<TemplateRef<unknown>>('title', {
    descendants: false,
  });
  /** Subtítulo personalizado; tiene prioridad sobre subheader. */
  protected readonly subtitleTemplate = contentChild<TemplateRef<unknown>>('subtitle', {
    descendants: false,
  });
  /** Cuerpo de la card, después del contenido proyectado; sus bloques se separan con contentGap. */
  protected readonly contentTemplate = contentChild<TemplateRef<unknown>>('content', {
    descendants: false,
  });
  /** Acciones al pie, sobre un divisor. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer', {
    descendants: false,
  });

  protected readonly hasTitle = computed(() => !!this.header() || !!this.titleTemplate());
  protected readonly hasSubtitle = computed(() => !!this.subheader() || !!this.subtitleTemplate());

  /** One tab stop only when selectable; a disabled card leaves the tab order. */
  protected readonly tabIndex = computed(() => {
    if (!this.selectable()) return null;
    return this.disabled() ? -1 : 0;
  });

  protected activate(event: Event): void {
    if (!this.selectable() || this.disabled()) return;
    // Space would scroll the page and Enter could submit a surrounding form.
    if (event instanceof KeyboardEvent) event.preventDefault();
    this.onSelect.emit(event);
  }
}
