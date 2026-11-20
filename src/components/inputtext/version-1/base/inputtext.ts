import {
  Directive,
  DoCheck,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

import { IntControlStatus, IntSize, injectStyles } from '../../../_shared_';
import { IntInputTextStyles } from './inputtext-styles';

/**
 * InputText — styles a native `<input>` or `<textarea>` (PrimeNG `pInputText` equivalent).
 * Works with ngModel / reactive forms as-is; the invalid state is picked up from the NgControl.
 *
 * @example
 * <input intInputText [(ngModel)]="name" placeholder="Name" />
 * <input intInputText intSize="small" [invalid]="nameInvalid" />
 * <input intInputText success value="Verified" />
 */
@Directive({
  selector: 'input[intInputText], textarea[intInputText]',
  host: {
    class: 'int-inputtext',
    '[class.int-inputtext--textarea]': 'textarea',
    '[class.int-inputtext--small]': 'intSize() === "small"',
    '[class.int-inputtext--large]': 'intSize() === "large"',
    '[class.int-inputtext--fluid]': 'fluid()',
    '[class.int-inputtext--filter]': 'filter()',
    '[class.int-inputtext--invalid]': 'isInvalid()',
    '[class.int-inputtext--success]': 'success() && !isInvalid()',
    '[attr.aria-invalid]': 'isInvalid() || null',
  },
})
export class IntInputText implements DoCheck {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** Tamaño del campo: `small` o `large`. Se llama `intSize` porque `size` es un atributo nativo de `<input>`. */
  readonly intSize = input<IntSize | undefined>(undefined);
  /** Marca el campo como inválido (borde de error). */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ocupa todo el ancho de su contenedor. */
  readonly fluid = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: campo de búsqueda dentro del panel desplegable de otro componente (`int-multiselect`,
   * `int-treeselect`, `int-select`). Solo cambia el color del borde en reposo; hover y foco no cambian.
   */
  readonly filter = input(false, { transform: booleanAttribute });
  /**
   * int-* extension: estado de éxito (borde y texto verdes).
   * Si el control también es inválido, gana el estado inválido.
   */
  readonly success = input(false, { transform: booleanAttribute });

  protected readonly textarea =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'TEXTAREA';
  private readonly status = new IntControlStatus();
  protected readonly isInvalid = computed(() => this.invalid() || this.status.invalid());

  constructor() {
    injectStyles(IntInputTextStyles);
  }

  ngDoCheck(): void {
    this.status.check();
  }
}
