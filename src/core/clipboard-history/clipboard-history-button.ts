import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';

import { CLIP_KINDS, ClipEntry, ClipKind, ClipboardHistory } from '../../service/clipboard-history';
import { ExternalResources } from '../../service/external-resources';

const ICON_SOURCES = { styleguide: 'Styleguides', local: 'Local' } as const;

/** `source`: where the copied names come from, shown next to the title (icons: see ICON_SOURCES). */
const KIND_INFO: Record<ClipKind, { readonly title: string; readonly icon: string; readonly source?: string }> = {
  code: { title: 'Componentes', icon: 'pi-code', source: 'Code' },
  icon: { title: 'Icons Lab', icon: 'pi-images' },
  token: { title: 'Tokens', icon: 'pi-palette', source: 'Styleguides' },
  class: { title: 'Helpers', icon: 'pi-hashtag', source: 'Styleguides' },
};

/** Time the copy button of an entry shows its check. */
const COPIED_MS = 1500;

/**
 * Floating button of every view with the last copies (code, icons, tokens and helper classes).
 * The panel is a popover: it closes with Esc or a click outside. On every new copy the button bounces once.
 */
@Component({
  selector: 'app-clipboard-history-button',
  template: `
    <div class="doc-clip">
      <div
        #panel
        id="doc-clip-panel"
        class="doc-clip-panel"
        popover
        role="dialog"
        aria-labelledby="doc-clip-title"
        (toggle)="open.set($any($event).newState === 'open')"
      >
        <header class="doc-clip-head">
          <span class="doc-clip-head-icon"><i class="pi pi-history" aria-hidden="true"></i></span>
          <div class="doc-clip-head-text">
            <h2 id="doc-clip-title" class="doc-clip-title">Últimos copiados</h2>
            <p class="doc-clip-subtitle">Se guardan en este navegador · 5 por tipo</p>
          </div>
          <button type="button" class="doc-clip-icon-btn" aria-label="Cerrar" title="Cerrar" (click)="panel.hidePopover()">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </header>

        <div class="doc-clip-body">
          @for (group of groups(); track group.kind) {
            @if (!$first) {
              <hr class="doc-clip-divider" />
            }
            <section class="doc-clip-group" [attr.aria-labelledby]="'doc-clip-' + group.kind">
              <h3 class="doc-clip-group-title" [id]="'doc-clip-' + group.kind">
                <i class="pi {{ group.icon }}" aria-hidden="true"></i>
                {{ group.title }}
                @if (group.source) {
                  <span class="doc-clip-group-source">( {{ group.source }} )</span>
                }
                <span class="doc-clip-group-count">{{ group.entries.length }}</span>
              </h3>
              <ul class="doc-clip-list">
                @for (entry of group.entries; track entry.id) {
                  <li class="doc-clip-item" [class.doc-is-copied]="copied() === entry.id">
                    <span class="doc-clip-label" [class.doc-is-mono]="entry.kind !== 'code'" [title]="entry.label">
                      {{ entry.label }}
                    </span>
                    <button
                      type="button"
                      class="doc-clip-icon-btn"
                      [attr.aria-label]="(copied() === entry.id ? 'Copiado: ' : 'Copiar ') + entry.label"
                      (click)="copy(entry)"
                    >
                      <i class="pi" [class.pi-copy]="copied() !== entry.id" [class.pi-check]="copied() === entry.id" aria-hidden="true"></i>
                      <span class="doc-clip-tip" aria-hidden="true">{{ copied() === entry.id ? 'Copiado' : 'Copiar' }}</span>
                    </button>
                    <button
                      type="button"
                      class="doc-clip-icon-btn doc-is-danger"
                      [attr.aria-label]="'Quitar ' + entry.label"
                      (click)="history.remove(entry.id)"
                    >
                      <i class="pi pi-trash" aria-hidden="true"></i>
                      <span class="doc-clip-tip" aria-hidden="true">Quitar</span>
                    </button>
                  </li>
                }
              </ul>
            </section>
          } @empty {
            <div class="doc-clip-empty">
              <span class="doc-clip-empty-icon"><i class="pi pi-clipboard" aria-hidden="true"></i></span>
              <p>Aún no copiaste nada.</p>
              <p class="doc-clip-empty-hint">Copia un icono, un código, un token o una clase y aparecerá aquí.</p>
            </div>
          }
        </div>

        @if (history.count()) {
          <footer class="doc-clip-foot">
            <button type="button" class="doc-clip-clear" (click)="history.clear()">
              <i class="pi pi-trash" aria-hidden="true"></i>
              Limpiar todo
            </button>
          </footer>
        }
      </div>

      <button
        type="button"
        class="doc-clip-fab"
        [class.doc-is-open]="open()"
        popovertarget="doc-clip-panel"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'Últimos copiados (' + history.count() + ')'"
      >
        <!-- Re-created on every copy, so the drop / receive animation runs again. -->
        @for (pulse of [history.pulse()]; track pulse) {
          <span class="doc-clip-fab-icon" [class.doc-is-bumped]="pulse > 0">
            <i class="pi pi-clipboard" aria-hidden="true"></i>
          </span>
          @if (pulse > 0) {
            <span class="doc-clip-drop" aria-hidden="true"></span>
            <span class="doc-clip-ripple" aria-hidden="true"></span>
          }
        }
      </button>
    </div>
  `,
  styleUrl: './clipboard-history-button.scss',
  host: { '[style.--doc-clip-toast-h]': "toastHeight() + 'px'" },
})
export class ClipboardHistoryButton {
  protected readonly history = inject(ClipboardHistory);
  protected readonly open = signal(false);
  /** Entry whose copy button shows the check. */
  protected readonly copied = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  /** Where the icon font comes from right now (Style Guide bundle or the local fallback). */
  private readonly iconSource = inject(ExternalResources).iconSource;

  /** Kinds with entries, in a fixed order. */
  protected readonly groups = computed(() =>
    CLIP_KINDS.map((kind) => ({
      kind,
      ...KIND_INFO[kind],
      ...(kind === 'icon' && this.iconSource() ? { source: ICON_SOURCES[this.iconSource()!] } : {}),
      entries: this.history.entries().filter((entry) => entry.kind === kind),
    })).filter((group) => group.entries.length),
  );

  /** Height of the connection toast stack (app-connection-toast), which sits to the left of the button. */
  protected readonly toastHeight = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => clearTimeout(this.timer));

    afterNextRender(() => {
      const stack = document.querySelector('.doc-toast-stack');
      if (!stack) {
        return;
      }
      const observer = new ResizeObserver(([entry]) => this.toastHeight.set(Math.round(entry.borderBoxSize[0].blockSize)));
      observer.observe(stack);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected async copy(entry: ClipEntry): Promise<void> {
    if (!(await this.history.recopy(entry))) {
      return;
    }
    clearTimeout(this.timer);
    this.copied.set(entry.id);
    this.timer = setTimeout(() => this.copied.set(null), COPIED_MS);
  }
}
