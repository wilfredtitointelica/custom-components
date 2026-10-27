import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Input family · version 1: InputText (`input[intInputText]`), InputNumber (`<int-inputnumber>`),
 * Checkbox (`<int-checkbox>`) and RadioButton (`<int-radiobutton>`), one file each in this folder.
 * All of them are the BEM block `int-input` with a type modifier (`int-input--checkbox`…), sharing
 * `../styles/_index.scss`.
 *
 * Deviation: `IntInput` is not a visible component but the style carrier of the family. Every
 * control registers it with `injectStyles(IntInput)`, so the stylesheet is added once. Selectors keep
 * the PrimeNG v20 names (pInputText, p-inputnumber, p-checkbox, p-radiobutton).
 */
@Component({
  selector: 'int-input-styles',
  templateUrl: './input.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntInput {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';
}
