import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { IntConfig, IntIcon } from '../../../_shared_';
import { IntButton } from '../../../button/version-1/base/button';
import { IntPill } from '../../../pill/version-1/base/pill';

export interface IntFileSelectEvent {
  originalEvent: Event;
  /** Valid files added by this selection. */
  files: File[];
  /** All files currently queued. */
  currentFiles: File[];
}

export interface IntFileUploadHandlerEvent {
  files: File[];
}

/**
 * <int-file-upload> · version 1. File picker with drag & drop, validation and a pending-files list; API mirrors
 * PrimeNG v20 FileUpload (ported from @intelica/ui `int-fileupload`).
 * Deviation: no built-in HTTP. Uploading is delegated to the app through `uploadHandler` (PrimeNG
 * `customUpload` mode), so each app keeps using its own HTTP service, auth and error handling.
 *
 * @example
 * <int-file-upload #fu multiple accept=".xlsx,.csv" [maxFileSize]="10_000_000"
 *                  (uploadHandler)="upload($event.files); fu.clear()" />
 */
@Component({
  selector: 'int-file-upload',
  imports: [NgTemplateOutlet, IntButton, IntIcon, IntPill],
  templateUrl: './file-upload.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-file-upload',
    '[class.int-file-upload--advanced]': 'mode() === "advanced"',
    '[class.int-file-upload--disabled]': 'disabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntFileUpload {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'in-progress';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  readonly mode = input<'advanced' | 'basic'>('advanced');
  readonly name = input<string | undefined>(undefined);
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Same syntax as the native accept attribute: `.pdf,image/*,application/zip`. */
  readonly accept = input<string | undefined>(undefined);
  /** Maximum size per file, in bytes. */
  readonly maxFileSize = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Maximum number of queued files. */
  readonly fileLimit = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emit `uploadHandler` right after a valid selection. */
  readonly auto = input(false, { transform: booleanAttribute });
  readonly chooseLabel = input<string | undefined>(undefined);
  readonly uploadLabel = input<string | undefined>(undefined);
  readonly cancelLabel = input<string | undefined>(undefined);
  readonly chooseIcon = input<string | undefined>(undefined);
  readonly uploadIcon = input<string | undefined>(undefined);
  readonly cancelIcon = input<string | undefined>(undefined);
  readonly showUploadButton = input(true, { transform: booleanAttribute });
  readonly showCancelButton = input(true, { transform: booleanAttribute });

  readonly onSelect = output<IntFileSelectEvent>();
  readonly onRemove = output<{ originalEvent: Event; file: File }>();
  readonly onClear = output<void>();
  readonly uploadHandler = output<IntFileUploadHandlerEvent>();

  protected readonly config = inject(IntConfig);
  protected readonly emptyTemplate = contentChild<TemplateRef<unknown>>('empty');
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** Queued files. */
  readonly files = signal<File[]>([]);
  protected readonly messages = signal<string[]>([]);
  protected readonly dragOver = signal(false);

  protected readonly fileNames = computed(() => this.files().map((f) => f.name).join(', '));
  protected readonly limitReached = computed(() => {
    const limit = this.fileLimit();
    return limit != null && this.files().length >= limit;
  });

  choose(): void {
    if (this.disabled()) return;
    this.fileInput().nativeElement.click();
  }

  upload(): void {
    if (!this.files().length) return;
    this.uploadHandler.emit({ files: [...this.files()] });
  }

  clear(): void {
    this.files.set([]);
    this.messages.set([]);
    this.onClear.emit();
  }

  remove(event: Event, index: number): void {
    const file = this.files()[index];
    this.files.update((files) => files.filter((_, i) => i !== index));
    this.onRemove.emit({ originalEvent: event, file });
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(event, Array.from(input.files ?? []));
    input.value = ''; // allow re-selecting the same file
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related || !(event.currentTarget as HTMLElement).contains(related)) this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.disabled()) return;
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(event, this.multiple() ? dropped : dropped.slice(0, 1));
  }

  protected formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = new Intl.NumberFormat(this.config.locale(), { maximumFractionDigits: 1 }).format(
      bytes / 1024 ** i,
    );
    return `${value} ${units[i]}`;
  }

  private addFiles(event: Event, incoming: File[]): void {
    const messages: string[] = [];
    const valid = incoming.filter((file) => {
      if (!this.isAccepted(file)) {
        messages.push(this.config.t('invalidFileTypeMessage', file.name, this.accept() ?? ''));
        return false;
      }
      const max = this.maxFileSize();
      if (max != null && file.size > max) {
        messages.push(this.config.t('invalidFileSizeMessage', file.name, this.formatSize(max)));
        return false;
      }
      // Skip files already queued.
      return !this.files().some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
      );
    });

    let next = this.multiple() ? [...this.files(), ...valid] : valid.slice(0, 1);
    const limit = this.fileLimit();
    if (limit != null && next.length > limit) {
      messages.push(this.config.t('invalidFileLimitMessage', limit));
      next = next.slice(0, limit);
    }
    const added = next.filter((f) => !this.files().includes(f));

    this.messages.set(messages);
    this.files.set(next);
    if (!added.length) return;
    this.onSelect.emit({ originalEvent: event, files: added, currentFiles: next });
    if (this.auto()) this.upload();
  }

  private isAccepted(file: File): boolean {
    const accept = this.accept();
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean)
      .some((rule) =>
        rule.startsWith('.') ? name.endsWith(rule)
        : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1))
        : type === rule,
      );
  }
}
