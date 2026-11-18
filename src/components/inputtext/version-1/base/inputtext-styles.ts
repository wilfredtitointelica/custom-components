import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Style carrier of InputText. `IntInputText` is a directive (`input[intInputText]`, like PrimeNG
 * `pInputText`) and a directive cannot own a stylesheet, so it registers this component with
 * `injectStyles(IntInputTextStyles)` and the stylesheet is added once. Not a visible component.
 */
@Component({
  selector: 'int-inputtext-styles',
  templateUrl: './inputtext.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntInputTextStyles {}
