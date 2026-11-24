import { booleanAttribute, Directive, input } from '@angular/core';

import { injectStyles } from '../../../_shared_/style-loader';
import { IntSkeleton } from './skeleton';

/**
 * `[intSkeleton]` · int-* extension (PrimeNG has no equivalent: there each loading state is drawn again with
 * p-skeleton blocks of fixed size). Turns the element it is applied to — usually an int-* component — into its
 * own skeleton while `intSkeleton` is true:
 * - The component keeps rendering with its real inputs, so its size, `size`, `fluid`, `[style]` and
 *   `--int-*` overrides stay; the skeleton has no widths or heights of its own to keep in sync.
 * - The mask (`.int-skeleton-mask`, styles of int-skeleton) hides text, icons, borders and shadows and paints
 *   the box with the skeleton color and wave. A component whose visible box is an inner element moves that
 *   paint in the SKELETON section of its own styles.
 * - `inert` + `aria-busy`: no focus, clicks or screen reader content while it loads.
 *
 * @example
 * <button intButton label="Guardar" size="small" [intSkeleton]="loading()"></button>
 * <int-select [options]="cities" fluid [intSkeleton]="loading()" />
 */
@Directive({
  selector: '[intSkeleton]',
  host: {
    '[class.int-skeleton-mask]': 'intSkeleton()',
    '[attr.aria-busy]': 'intSkeleton() || null',
    '[attr.inert]': "intSkeleton() ? '' : null",
  },
})
export class IntSkeletonMask {
  /** Muestra el elemento como skeleton mientras es `true`; con `false` se ve normal. */
  readonly intSkeleton = input(false, { transform: booleanAttribute });

  constructor() {
    // The mask rules and the --int-skeleton-* tokens live in the styles of int-skeleton.
    injectStyles(IntSkeleton);
  }
}
