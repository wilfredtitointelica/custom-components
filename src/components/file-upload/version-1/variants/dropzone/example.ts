import { Component, signal } from '@angular/core';

import { IntButton } from '../../../../button/version-1/base/button';
import { IntFileUpload, IntFileUploadHandlerEvent } from '../../base/file-upload';

@Component({
  selector: 'file-upload-dropzone-example',
  templateUrl: './example.html',
  imports: [IntFileUpload, IntButton],
})
export class FileUploadDropzoneExample {
  readonly uploaded = signal<string[]>([]);
  readonly queued = signal(0);

  /** In an app: this.fileSharingService.upload(event.files).subscribe(...). */
  upload(event: IntFileUploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
