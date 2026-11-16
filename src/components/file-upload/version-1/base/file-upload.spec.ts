import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { IntFileUpload, IntFileUploadHandlerEvent } from './file-upload';

@Component({
  imports: [IntFileUpload],
  template: `
    <int-file-upload multiple accept=".csv,.xlsx" [maxFileSize]="1000" [fileLimit]="2"
                     (uploadHandler)="uploaded = $event" />
  `,
})
class Host {
  uploaded: IntFileUploadHandlerEvent | null = null;
}

@Component({
  imports: [IntFileUpload],
  template: `
    <int-file-upload #fu dropzone multiple accept=".csv, .xlsx" [maxFileSize]="2048" [fileLimit]="3"
                     hint="One per period" (uploadHandler)="uploaded = $event" />
  `,
})
class DropzoneHost {
  uploaded: IntFileUploadHandlerEvent | null = null;
}

function selectFiles(input: HTMLInputElement, files: File[]): void {
  const transfer = new DataTransfer();
  files.forEach((f) => transfer.items.add(f));
  input.files = transfer.files;
  input.dispatchEvent(new Event('change'));
}

const file = (name: string, size = 10) => new File(['x'.repeat(size)], name);

describe('IntFileUpload', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    return { fixture, el, input, host: fixture.componentInstance };
  }

  it('queues valid files and lists them', () => {
    const { fixture, el, input } = setup();
    selectFiles(input, [file('fees.csv'), file('rates.xlsx')]);
    fixture.detectChanges();
    const names = Array.from(el.querySelectorAll('.int-file-upload__file-name')).map((n) => n.textContent);
    expect(names).toEqual(['fees.csv', 'rates.xlsx']);
  });

  it('rejects invalid type and size with alert messages', () => {
    const { fixture, el, input } = setup();
    selectFiles(input, [file('photo.png'), file('big.csv', 5000)]);
    fixture.detectChanges();
    const messages = Array.from(el.querySelectorAll('[role="alert"]')).map((m) => m.textContent?.trim());
    expect(messages.length).toBe(2);
    expect(messages[0]).toContain('photo.png: Invalid file type');
    expect(messages[1]).toContain('big.csv: Invalid file size');
    expect(el.querySelector('.int-file-upload__file')).toBeNull();
  });

  it('enforces the file limit', () => {
    const { fixture, el, input } = setup();
    selectFiles(input, [file('a.csv'), file('b.csv'), file('c.csv')]);
    fixture.detectChanges();
    expect(el.querySelectorAll('.int-file-upload__file').length).toBe(2);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('limit is 2');
  });

  it('emits uploadHandler with the queued files and supports removal', () => {
    const { fixture, el, input, host } = setup();
    selectFiles(input, [file('a.csv'), file('b.csv')]);
    fixture.detectChanges();
    el.querySelector<HTMLButtonElement>('.int-file-upload__file button')!.click();
    fixture.detectChanges();

    const upload = Array.from(el.querySelectorAll<HTMLButtonElement>('.int-file-upload__header button')).find(
      (b) => b.textContent?.trim() === 'Upload',
    )!;
    upload.click();
    expect(host.uploaded?.files.map((f) => f.name)).toEqual(['b.csv']);
  });

  describe('dropzone', () => {
    function setupDropzone() {
      const fixture = TestBed.createComponent(DropzoneHost);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      return { fixture, el, host: fixture.componentInstance };
    }

    it('hides the header and shows hint + requirements built from the validation inputs', () => {
      const { el } = setupDropzone();
      expect(el.querySelector('int-file-upload')!.classList).toContain('int-file-upload--dropzone');
      expect(el.querySelector('.int-file-upload__header')).toBeNull();
      expect(el.querySelector('.int-file-upload__hint')?.textContent).toContain('One per period');
      const reqs = Array.from(el.querySelectorAll('.int-file-upload__requirement')).map((r) =>
        Array.from(r.children).map((c) => c.textContent?.trim()).join(' '),
      );
      expect(reqs).toEqual(['Formats: .csv, .xlsx', 'Max size: 2 KB', 'Max files: 3']);
    });

    it('lists queued files below the zone and uploads through upload()', () => {
      const { fixture, el, host } = setupDropzone();
      const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
      selectFiles(input, [file('a.csv')]);
      fixture.detectChanges();
      expect(el.querySelector('.int-file-upload__dropzone .int-file-upload__file')).toBeNull();
      expect(el.querySelector('.int-file-upload__file-name')?.textContent).toBe('a.csv');

      const upload = fixture.debugElement.children[0].componentInstance as IntFileUpload;
      upload.upload();
      expect(host.uploaded?.files.map((f) => f.name)).toEqual(['a.csv']);
    });
  });
});
