import { Component, ViewEncapsulation } from '@angular/core';

/** <int-progress-bar> · version 1. */
@Component({
  selector: 'int-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: '../styles/_index.scss',
  // Global styles scoped by the int- BEM block, so .sk-* skeletons and modifiers work from any view.
  encapsulation: ViewEncapsulation.None,
})
export class IntProgressBar {}
