import { Component, signal } from '@angular/core';

import { IntFileupload, IntFileuploadHandlerEvent } from '../../base/fileupload';

@Component({
  selector: 'fileupload-basic-mode-auto-example',
  templateUrl: './example.html',
  imports: [IntFileupload],
})
export class FileuploadBasicModeAutoExample {
  readonly uploaded = signal<string[]>([]);

  upload(event: IntFileuploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
