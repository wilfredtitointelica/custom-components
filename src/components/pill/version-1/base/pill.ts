import { Component, ViewEncapsulation } from '@angular/core';

/** <int-pill> · version 1. */
@Component({
  selector: 'int-pill',
  templateUrl: './pill.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntPill {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'pending';
  /** Designer in charge of this version, shown on the progress page (Reference → Status). */
  static readonly designer = 'Yony León';
}
