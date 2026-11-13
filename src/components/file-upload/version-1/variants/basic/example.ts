import { Component, signal } from '@angular/core';

import { IntFileUpload, IntFileUploadHandlerEvent } from '../../base/file-upload';

@Component({
  selector: 'file-upload-basic-example',
  templateUrl: './example.html',
  imports: [IntFileUpload],
})
export class FileUploadBasicExample {
  readonly uploaded = signal<string[]>([]);

  /** In an app: this.fileSharingService.upload(event.files).subscribe(...). */
  upload(event: IntFileUploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
