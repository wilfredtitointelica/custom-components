import { Component } from '@angular/core';

import { IntCarousel, IntCarouselResponsiveOptions } from '../../base/carousel';

interface Slide {
  id: number;
  title: string;
}

const SLIDES: readonly Slide[] = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, title: `Slide ${i + 1}` }));

@Component({
  selector: 'carousel-responsive-example',
  templateUrl: './example.html',
  imports: [IntCarousel],
})
export class CarouselResponsiveExample {
  readonly slides = [...SLIDES];
  readonly responsiveOptions: IntCarouselResponsiveOptions[] = [
    { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
    { breakpoint: '767px', numVisible: 1, numScroll: 1 },
  ];
}
