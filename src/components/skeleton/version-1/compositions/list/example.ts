import { Component } from '@angular/core';

import { IntSkeleton } from '../../base/skeleton';

@Component({
  selector: 'skeleton-list-example',
  templateUrl: './example.html',
  imports: [IntSkeleton],
})
export class SkeletonListExample {
  readonly rows = Array.from({ length: 4 });
}
