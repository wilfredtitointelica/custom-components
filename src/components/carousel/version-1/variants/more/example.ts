import { Component } from '@angular/core';

import { IntCarousel } from '../../base/carousel';

interface Slide {
  id: number;
  title: string;
}

const SLIDES: readonly Slide[] = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, title: `Slide ${i + 1}` }));

@Component({
  selector: 'carousel-more-example',
  templateUrl: './example.html',
  imports: [IntCarousel],
})
export class CarouselMoreExample {
  readonly slides = [...SLIDES];
}
