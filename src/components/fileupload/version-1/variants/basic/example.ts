import { Component, signal } from '@angular/core';

import { IntFileupload, IntFileuploadHandlerEvent } from '../../base/fileupload';

@Component({
  selector: 'fileupload-basic-example',
  templateUrl: './example.html',
  imports: [IntFileupload],
})
export class FileuploadBasicExample {
  readonly uploaded = signal<string[]>([]);

  /** In an app: this.fileSharingService.upload(event.files).subscribe(...). */
  upload(event: IntFileuploadHandlerEvent): void {
    this.uploaded.set(event.files.map((file) => file.name));
  }
}
