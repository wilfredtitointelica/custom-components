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
import { IntInput } from './input';

/**
 * InputText — styles a native `<input>` or `<textarea>` (PrimeNG `pInputText` equivalent).
 * Works with ngModel / reactive forms as-is; the invalid state is picked up from the NgControl.
 *
 * @example
 * <input intInputText [(ngModel)]="name" placeholder="Name" />
 * <input intInputText intSize="small" [invalid]="nameInvalid" />
 */
@Directive({
  selector: 'input[intInputText], textarea[intInputText]',
  host: {
    class: 'int-input',
    '[class.int-input--textarea]': 'textarea',
    '[class.int-input--small]': 'intSize() === "small"',
    '[class.int-input--large]': 'intSize() === "large"',
    '[class.int-input--fluid]': 'fluid()',
    '[class.int-input--invalid]': 'isInvalid()',
    '[attr.aria-invalid]': 'isInvalid() || null',
  },
})
export class IntInputText implements DoCheck {
  /** Named `intSize` because `size` is a native input attribute. */
  readonly intSize = input<IntSize | undefined>(undefined);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });

  protected readonly textarea =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'TEXTAREA';
  private readonly status = new IntControlStatus();
  protected readonly isInvalid = computed(() => this.invalid() || this.status.invalid());

  constructor() {
    injectStyles(IntInput);
  }

  ngDoCheck(): void {
    this.status.check();
  }
}
