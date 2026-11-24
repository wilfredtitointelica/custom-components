import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

/** Shape of the skeleton, as PrimeNG. */
export type IntSkeletonShape = 'rectangle' | 'circle';

/** Animation of the skeleton, as PrimeNG: `wave` (shine that crosses the block) or `none`. */
export type IntSkeletonAnimation = 'wave' | 'none';

/**
 * <int-skeleton> · version 1. Replica of PrimeNG v20 p-skeleton without PrimeNG at runtime.
 * A loading block for free layouts (text lines, avatars, KPIs, charts). To show an int-* component while
 * it loads, use the `[intSkeleton]` directive on the component itself (skeleton-mask.ts): it keeps the
 * component's real size, so there are no widths or heights to keep in sync.
 *
 * Deviation: the wave is an animated background instead of PrimeNG's `::after`, the same paint the
 * `[intSkeleton]` mask uses (an `::after` does not render on an `<input>`).
 */
@Component({
  selector: 'int-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same root as PrimeNG: p-skeleton puts its root classes and its size on the host element.
  host: {
    '[class]': 'classes()',
    '[style.width]': 'size() ?? width()',
    '[style.height]': 'size() ?? height()',
    '[style.border-radius]': 'borderRadius() ?? null',
    'aria-hidden': 'true',
  },
})
export class IntSkeleton {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  // JSDoc of the public API in Spanish: it is the Descripción column of the API tab of the page.
  /** Forma del bloque: `rectangle` o `circle` (radio del 50%). */
  readonly shape = input<IntSkeletonShape>('rectangle');
  /** Animación: `wave` (un brillo que recorre el bloque) o `none`. Sin animación si el sistema pide reducir movimiento. */
  readonly animation = input<IntSkeletonAnimation>('wave');
  /** Radio de las esquinas (p. ej. `1000px` para una pastilla); sin valor usa el del tema. */
  readonly borderRadius = input<string>();
  /** Ancho y alto a la vez (p. ej. `3rem` para un avatar); pisa `width` y `height`. */
  readonly size = input<string>();
  /** Ancho del bloque. */
  readonly width = input('100%');
  /** Alto del bloque. */
  readonly height = input('1rem');
  /** Clase adicional del componente. Obsoleto en PrimeNG: usar `class`. */
  readonly styleClass = input<string>();

  /** Block plus active modifiers, as PrimeNG's root classes. */
  protected readonly classes = computed(() =>
    [
      'int-skeleton',
      this.shape() === 'circle' ? 'int-skeleton--circle' : '',
      this.animation() === 'none' ? 'int-skeleton--animation-none' : '',
      this.styleClass() ?? '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
