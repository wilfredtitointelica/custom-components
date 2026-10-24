import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';

import { ConnectionStatus, ExternalResources } from '../../service/external-resources';

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  checking: 'Verificando',
  connected: 'Conectado',
  disconnected: 'Sin conexión',
};

const CHECKING_MIN_MS = 600;
const DONE_MS = 2_000;

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
  /**
   * Feedback of "Verificar ahora": spinning while checking, then the result for a moment (green if every
   * resource answered, red if not) while the time of the check flashes in the same color.
   */
  protected readonly phase = signal<'idle' | 'checking' | 'connected' | 'disconnected'>('idle');
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private doneTimer?: ReturnType<typeof setTimeout>;

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected check(): void {
    clearTimeout(this.doneTimer);
    this.phase.set('checking');
    // A local check takes a few ms: keep the spinner long enough to be seen.
    const minimum = new Promise((resolve) => setTimeout(resolve, CHECKING_MIN_MS));
    Promise.all([this.connections.check(), minimum]).finally(() => {
      this.phase.set(this.connections.overall() === 'connected' ? 'connected' : 'disconnected');
      this.doneTimer = setTimeout(() => this.phase.set('idle'), DONE_MS);
    });
  }
}
