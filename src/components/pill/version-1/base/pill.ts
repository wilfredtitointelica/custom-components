import { Component, ViewEncapsulation } from '@angular/core';

/** <int-pill> · version 1. */
@Component({
  selector: 'int-pill',
  templateUrl: './pill.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntPill {}
