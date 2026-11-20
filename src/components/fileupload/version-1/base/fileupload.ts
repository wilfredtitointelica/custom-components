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
import { IntTag } from '../../../tag/version-1/base/tag';

export interface IntFileSelectEvent {
  originalEvent: Event;
  /** Valid files added by this selection. */
  files: File[];
  /** All files currently queued. */
  currentFiles: File[];
}

export interface IntFileuploadHandlerEvent {
  files: File[];
}

/**
 * <int-fileupload> · version 1. File picker with drag & drop, validation and a pending-files list; API mirrors
 * PrimeNG v20 FileUpload (ported from @intelica/ui `int-fileupload`).
 * Deviation: no built-in HTTP. Uploading is delegated to the app through `uploadHandler` (PrimeNG
 * `customUpload` mode), so each app keeps using its own HTTP service, auth and error handling.
 * int-* extensions: `dropzone` (File Sharing drop-zone look) and `hint`.
 *
 * @example
 * <int-fileupload #fu multiple accept=".xlsx,.csv" [maxFileSize]="10_000_000"
 *                  (uploadHandler)="upload($event.files); fu.clear()" />
 */
@Component({
  selector: 'int-fileupload',
  imports: [NgTemplateOutlet, IntButton, IntIcon, IntTag],
  templateUrl: './fileupload.html',
  styleUrl: '../styles/_index.scss',
  host: {
    class: 'int-fileupload',
    '[class.int-fileupload--advanced]': 'mode() === "advanced"',
    '[class.int-fileupload--dropzone]': 'mode() === "advanced" && dropzone()',
    '[class.int-fileupload--disabled]': 'disabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntFileupload {
  /** Implementation status, shown on the documentation page: pending → in-progress → done. */
  static readonly status: 'pending' | 'in-progress' | 'done' = 'done';
  /** Designer in charge of this version, shown on the documentation page and in Reference → Status. */
  static readonly designer = 'Yony León';

  /** `advanced` muestra la zona de arrastre y la lista de pendientes; `basic` solo el botón de elegir. */
  readonly mode = input<'advanced' | 'basic'>('advanced');
  /** Atributo `name` del `<input type="file">` interno. */
  readonly name = input<string | undefined>(undefined);
  /** Permite elegir y encolar varios archivos. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Tipos aceptados, con la sintaxis del atributo nativo `accept`: `.pdf,image/*,application/zip`. */
  readonly accept = input<string | undefined>(undefined);
  /** Tamaño máximo por archivo, en bytes. */
  readonly maxFileSize = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Cantidad máxima de archivos en cola. */
  readonly fileLimit = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Deshabilita la selección, el arrastre y los botones. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emite `uploadHandler` apenas se elige una selección válida (sin botón Upload). */
  readonly auto = input(false, { transform: booleanAttribute });
  /** Texto del botón Choose (por defecto, traducción `choose`). */
  readonly chooseLabel = input<string | undefined>(undefined);
  /** Texto del botón Upload (por defecto, traducción `upload`). */
  readonly uploadLabel = input<string | undefined>(undefined);
  /** Texto del botón Cancel (por defecto, traducción `cancel`). */
  readonly cancelLabel = input<string | undefined>(undefined);
  /** Clase del icono del botón Choose, p. ej. `icon icon-add`. */
  readonly chooseIcon = input<string | undefined>(undefined);
  /** Clase del icono del botón Upload. */
  readonly uploadIcon = input<string | undefined>(undefined);
  /** Clase del icono del botón Cancel. */
  readonly cancelIcon = input<string | undefined>(undefined);
  /** Muestra el botón Upload en la cabecera (modo `advanced`, sin `auto`). */
  readonly showUploadButton = input(true, { transform: booleanAttribute });
  /** Muestra el botón Cancel en la cabecera (modo `advanced`, sin `auto`). */
  readonly showCancelButton = input(true, { transform: booleanAttribute });
  /**
   * int-* extension: aspecto de zona de arrastre de File Sharing: sin cabecera, borde
   * punteado, enlace "browse" y requisitos (formatos, tamaño y cantidad máximos) armados desde `accept`,
   * `maxFileSize` y `fileLimit`. La subida se dispara con `auto` o llamando a `upload()`.
   */
  readonly dropzone = input(false, { transform: booleanAttribute });
  /** int-* extension: texto de ayuda bajo el mensaje de la zona de arrastre (solo con `dropzone`). */
  readonly hint = input<string | undefined>(undefined);

  /** Se emite al encolar archivos válidos. */
  readonly onSelect = output<IntFileSelectEvent>();
  /** Se emite al quitar un archivo de la cola. */
  readonly onRemove = output<{ originalEvent: Event; file: File }>();
  /** Se emite al vaciar la cola con `clear()` o el botón Cancel. */
  readonly onClear = output<void>();
  /** Entrega los archivos en cola para que la app los suba (Upload, `auto` o `upload()`). */
  readonly uploadHandler = output<IntFileuploadHandlerEvent>();

  protected readonly config = inject(IntConfig);
  /** Plantilla `#empty`: reemplaza el contenido de la zona cuando no hay archivos en cola. */
  protected readonly emptyTemplate = contentChild<TemplateRef<unknown>>('empty');
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** Queued files. */
  readonly files = signal<File[]>([]);
  protected readonly messages = signal<string[]>([]);
  protected readonly dragOver = signal(false);

  protected readonly fileNames = computed(() => this.files().map((f) => f.name).join(', '));
  /** Requisitos de la zona `dropzone`, armados desde las entradas de validación. */
  protected readonly requirements = computed(() => {
    const t = this.config.translation();
    const list: { label: string; value: string }[] = [];
    const accept = this.accept();
    if (accept) list.push({ label: t.acceptedFormats, value: accept.split(',').map((a) => a.trim()).join(', ') });
    const max = this.maxFileSize();
    if (max != null) list.push({ label: t.maxFileSizeLabel, value: this.formatSize(max) });
    const limit = this.fileLimit();
    if (limit != null) list.push({ label: t.fileLimitLabel, value: String(limit) });
    return list;
  });
  protected readonly limitReached = computed(() => {
    const limit = this.fileLimit();
    return limit != null && this.files().length >= limit;
  });

  /** Abre el diálogo nativo de selección de archivos. */
  choose(): void {
    if (this.disabled()) return;
    this.fileInput().nativeElement.click();
  }

  /** Emite `uploadHandler` con los archivos en cola. */
  upload(): void {
    if (!this.files().length) return;
    this.uploadHandler.emit({ files: [...this.files()] });
  }

  /** Vacía la cola y los mensajes de validación, y emite `onClear`. */
  clear(): void {
    this.files.set([]);
    this.messages.set([]);
    this.onClear.emit();
  }

  /** Quita de la cola el archivo en `index` y emite `onRemove`. */
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
