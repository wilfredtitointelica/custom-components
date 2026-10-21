import { Component, ViewEncapsulation } from '@angular/core';

/** <int-list-box> · version 1. */
@Component({
  selector: 'int-list-box',
  templateUrl: './list-box.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntListBox {}
