import { Component, ViewEncapsulation } from '@angular/core';

/** <int-date-picker> · version 1. */
@Component({
  selector: 'int-date-picker',
  templateUrl: './date-picker.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntDatePicker {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the progress page (Reference → Status). */
  static readonly designer = 'Yony León';
}
