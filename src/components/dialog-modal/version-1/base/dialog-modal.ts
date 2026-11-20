import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  afterRenderEffect,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';

import { IntConfig, uniqueId } from '../../../_shared_';
import { IntButton } from '../../../button/version-1/base/button';

/**
 * Style Guide `.prDialog--sm|md|lg|xl` widths (--i-dialog-max-width-*: 400/600/800/1024px). Those tokens
 * ship with the Style Guide dialog component styles, so the SCSS falls back to the same values.
 */
export type IntDialogModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * <int-dialog-modal> · version 1. Modal window rendered in a CDK overlay (focus trap, Escape, scroll lock);
 * API mirrors PrimeNG v20 Dialog (ported from @intelica/ui `int-dialog`). The host is
 * `display: contents`: the `int-dialog-modal` block is the panel inside the overlay.
 *
 * @example
 * <int-dialog-modal header="Set alert" [(visible)]="showAlert" size="md">
 *   <p>Content</p>
 *   <ng-template #footer>
 *     <button intButton severity="secondary" label="Cancel" (click)="showAlert = false"></button>
 *     <button intButton label="Save" (click)="save()"></button>
 *   </ng-template>
 * </int-dialog-modal>
 */
@Component({
  selector: 'int-dialog-modal',
  imports: [CdkTrapFocus, NgStyle, NgTemplateOutlet, IntButton],
  templateUrl: './dialog-modal.html',
  styleUrl: '../styles/_index.scss',
  // role="alertdialog" on the tag feeds the `role` input; the host itself must not carry it (only the panel).
  host: { style: 'display: contents', '[attr.role]': 'null' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntDialogModal implements OnDestroy {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Abre (`true`) o cierra (`false`) el diálogo; admite `[(visible)]`. */
  readonly visible = model(false);
  /** Título de la cabecera (o la plantilla `#header`). */
  readonly header = input<string | undefined>(undefined);
  /** Muestra la máscara y bloquea la página detrás del diálogo. */
  readonly modal = input(true, { transform: booleanAttribute });
  /** Muestra el botón de cerrar en la cabecera. */
  readonly closable = input(true, { transform: booleanAttribute });
  /** Cierra el diálogo al hacer clic en la máscara (solo con `modal`). */
  readonly dismissableMask = input(false, { transform: booleanAttribute });
  /** Escape cierra el diálogo. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Bloquea el scroll de la página mientras está abierto. */
  readonly blockScroll = input(true, { transform: booleanAttribute });
  /** Enfoca el primer elemento enfocable al abrir; al cerrar, el foco vuelve al elemento que lo abrió. */
  readonly focusOnShow = input(true, { transform: booleanAttribute });
  /** Posición del panel en la pantalla: centrado o arriba. */
  readonly position = input<'center' | 'top'>('center');
  /**
   * int-* extension: ancho del panel con los tamaños del Style Guide: `sm` 400px, `md` 600px, `lg` 800px y `xl`
   * 1024px. Para otro ancho (p. ej. 440px de una confirmación) usa `--int-dialog-width` con `styleClass`.
   */
  readonly size = input<IntDialogModalSize | undefined>(undefined);
  /**
   * Estilos en línea del panel, p. ej. `{ width: '40rem' }`. Mejor usar `size`: las guías de la app desaconsejan
   * `[style]` en los diálogos.
   */
  readonly style = input<Record<string, string> | null>(null);
  /** Clases extra para el panel. */
  readonly styleClass = input<string | undefined>(undefined);
  /**
   * Muestra la cabecera (título y botón de cerrar). En `false` el panel queda solo con contenido y pie, p. ej. un
   * aviso de confirmación; dale entonces un nombre accesible con `ariaLabel` o `ariaLabelledBy`.
   * @defaultValue true
   */
  readonly showHeader = input(true, { transform: booleanAttribute });
  /**
   * Rol ARIA del panel: `dialog` (por defecto) o `alertdialog` para avisos que piden una respuesta (confirmar una
   * eliminación).
   * @defaultValue 'dialog'
   */
  readonly role = input<'dialog' | 'alertdialog'>('dialog');
  /** `id` del elemento que nombra al panel; por defecto, el título de la cabecera. */
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /** int-* extension: nombre accesible del panel cuando no hay un elemento visible que lo nombre (sin cabecera). */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** int-* extension: `id` del elemento que describe el panel (`aria-describedby`), p. ej. el mensaje de un aviso. */
  readonly ariaDescribedBy = input<string | undefined>(undefined);

  /** Se emite al abrirse el diálogo. */
  readonly onShow = output<void>();
  /** Se emite al cerrarse el diálogo. */
  readonly onHide = output<void>();

  protected readonly config = inject(IntConfig);
  protected readonly headerId = uniqueId('int-dialog-modal-title');
  /** Size modifier (int-dialog-modal--<size>) plus the consumer's styleClass. */
  protected readonly panelClass = computed(() =>
    [this.size() && `int-dialog-modal--${this.size()}`, this.styleClass()].filter(Boolean).join(' '),
  );
  /** aria-labelledby: the consumer's id, else the header title (only when it is rendered and no ariaLabel). */
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.showHeader() && !this.ariaLabel() ? this.headerId : null),
  );
  /** Plantilla `#header`: reemplaza el texto de `header` en la cabecera. */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Plantilla `#footer`: botones de acción, alineados a la derecha. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  private readonly dialogTemplate = viewChild.required<TemplateRef<unknown>>('dialog');

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  constructor() {
    afterRenderEffect(() => {
      const visible = this.visible();
      untracked(() => (visible ? this.attach() : this.detach()));
    });
  }

  /** Cierra el diálogo (`visible` pasa a `false`). */
  close(): void {
    this.visible.set(false);
  }

  ngOnDestroy(): void {
    this.overlayRef?.dispose();
  }

  private attach(): void {
    if (this.overlayRef) return;
    const position = this.overlay.position().global().centerHorizontally();
    if (this.position() === 'top') position.top('2rem');
    else position.centerVertically();

    this.overlayRef = this.overlay.create({
      positionStrategy: position,
      hasBackdrop: this.modal(),
      backdropClass: 'int-dialog-modal__mask',
      panelClass: 'int-dialog-modal__pane',
      scrollStrategy: this.blockScroll()
        ? this.overlay.scrollStrategies.block()
        : this.overlay.scrollStrategies.noop(),
    });
    this.overlayRef.attach(new TemplatePortal(this.dialogTemplate(), this.vcr));
    this.overlayRef.backdropClick().subscribe(() => {
      if (this.dismissableMask()) this.close();
    });
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
        event.preventDefault();
        this.close();
      }
    });
    this.onShow.emit();
  }

  private detach(): void {
    if (!this.overlayRef) return;
    // Disposing destroys the view; CdkTrapFocus restores focus to the previously focused element.
    this.overlayRef.dispose();
    this.overlayRef = null;
    this.onHide.emit();
  }
}
