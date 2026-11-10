import { Component } from '@angular/core';

import { IntCarousel } from '../../base/carousel';

interface Slide {
  id: number;
  title: string;
}

const SLIDES: readonly Slide[] = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, title: `Slide ${i + 1}` }));

@Component({
  selector: 'carousel-template-example',
  templateUrl: './example.html',
  imports: [IntCarousel],
})
export class CarouselTemplateExample {
  readonly slides = [...SLIDES];
}
