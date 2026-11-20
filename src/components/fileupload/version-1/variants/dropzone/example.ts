import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntFileupload, IntFileuploadHandlerEvent } from '../../base/fileupload';

@Component({
  selector: 'fileupload-dropzone-example',
  templateUrl: './example.html',
  imports: [IntFileupload, IntButton],
})
export class FileuploadDropzoneExample {
  readonly uploaded = signal<string[]>([]);
  readonly queued = signal(0);

  /** In an app: this.fileSharingService.upload(event.files).subscribe(...). */
  upload(event: IntFileuploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
