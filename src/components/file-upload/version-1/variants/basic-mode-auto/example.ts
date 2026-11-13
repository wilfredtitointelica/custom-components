import { Component, signal } from '@angular/core';

import { IntFileUpload, IntFileUploadHandlerEvent } from '../../base/file-upload';

@Component({
  selector: 'file-upload-basic-mode-auto-example',
  templateUrl: './example.html',
  imports: [IntFileUpload],
})
export class FileUploadBasicModeAutoExample {
  readonly uploaded = signal<string[]>([]);

  upload(event: IntFileUploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
