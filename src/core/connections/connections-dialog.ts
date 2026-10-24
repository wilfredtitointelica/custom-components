import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ConnectionStatus, ExternalResources } from '../../service/external-resources';

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  checking: 'Verificando',
  connected: 'Conectado',
  disconnected: 'Sin conexión',
};

/**
 * Modal <dialog> listing the resources of other repos this project consumes at runtime, with their
 * connection status (opened from the Connections button of the rail). Closes with X, Esc or the backdrop.
 */
@Component({
  selector: 'app-connections-dialog',
  imports: [DatePipe],
  templateUrl: './connections-dialog.html',
  styleUrl: './connections-dialog.scss',
})
export class ConnectionsDialog {
  protected readonly connections = inject(ExternalResources);
  protected readonly labels = STATUS_LABELS;
  protected readonly checking = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected check(): void {
    this.checking.set(true);
    this.connections.check().finally(() => this.checking.set(false));
  }
}
