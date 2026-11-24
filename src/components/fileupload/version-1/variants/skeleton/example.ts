import { Component, signal } from '@angular/core';

import { IntFileupload } from '../../base/fileupload';
import { IntButton } from '../../../../button/version-1/base/button';
import { IntSkeletonMask } from '../../../../skeleton/version-1/base/skeleton-mask';

@Component({
  selector: 'fileupload-skeleton-example',
  templateUrl: './example.html',
  imports: [IntFileupload, IntButton, IntSkeletonMask],
})
export class FileuploadSkeletonExample {
  readonly loading = signal(true);
}
