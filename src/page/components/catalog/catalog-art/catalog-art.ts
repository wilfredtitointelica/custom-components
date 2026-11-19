import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cover of a catalog card: a flat vector drawing of the component (in the style of a component gallery),
 * drawn from the finished int-* examples. Own artwork only, no icon font. Colors come from the --doc-*
 * tokens through the doc-art-* classes, so it follows the documentation theme. Unknown IDs get a generic
 * drawing.
 */
@Component({
  selector: 'app-catalog-art',
  templateUrl: './catalog-art.html',
  styleUrl: './catalog-art.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class CatalogArt {
  /** ID of the component (CatalogComponent.id). */
  readonly id = input.required<string>();
}
