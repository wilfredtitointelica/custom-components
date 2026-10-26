import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

import {
  importStyleGuide,
  pingStyleGuide,
  removeStyleGuide,
  setIconLabFallback,
  STYLE_GUIDE_BASE_URL,
} from '../core/style-guide/style-guide';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

/** Resource of another repo consumed at runtime (listed in the Connections dialog of the rail). */
export interface ExternalResource {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  /** Repo that publishes it and how to start it. */
  readonly source: string;
  /** What this project takes from it. */
  readonly provides: readonly string[];
  /** What happens while it is not available. */
  readonly fallback: string;
}

export interface ResourceState {
  readonly resource: ExternalResource;
  readonly status: ConnectionStatus;
  readonly checkedAt: Date | null;
}

export interface ConnectionNotice {
  readonly id: number;
  readonly tone: 'success' | 'danger';
  readonly title: string;
  readonly message: string;
  /** URL shown after `message` (bold, never wrapped), followed by `suffix`. */
  readonly url?: string;
  readonly suffix?: string;
}

const STYLE_GUIDE: ExternalResource = {
  id: 'style-guide',
  name: 'Intelica Style Guide',
  url: STYLE_GUIDE_BASE_URL,
  source: 'Repo Intelica.Style.Guide.New (IntelicaStyleGuide) · npm start',
  provides: ['Tokens --i-*', 'Reset y clases pr*', 'Fuente incontrol-icons', 'Marcas (visa, mastercard, amex)'],
  fallback:
    'Los int-* quedan sin tokens; Icon Lab usa su copia local de la fuente y las marcas (icon-lab-fallback.css).',
};

const POLL_MS = 15_000;
const NOTICE_MS = 10_000;

/**
 * Loads the external resources and watches their connection: polls every 15 s and when the tab gets
 * focus. Status changes are published as notices (toasts of app-connection-toast).
 */
@Injectable({ providedIn: 'root' })
export class ExternalResources {
  private readonly state = signal<ResourceState>({ resource: STYLE_GUIDE, status: 'checking', checkedAt: null });
  private readonly noticeList = signal<readonly ConnectionNotice[]>([]);
  private nextNoticeId = 0;
  /** The bundle's CSS is in the page (taken out as soon as the connection is lost). */
  private readonly styleGuideInPage = signal(false);
  private started = false;

  /** Where the icon font and brand marks come from right now (null until the first load ends). */
  readonly iconSource = computed<'styleguide' | 'local' | null>(() =>
    this.styleGuideInPage() ? 'styleguide' : this.state().status === 'checking' ? null : 'local',
  );

  readonly resources = computed<readonly ResourceState[]>(() => [this.state()]);
  /** Style guide alone (Styleguides button of the top bar: its tokens can only be read while connected). */
  readonly styleGuide = this.state.asReadonly();
  readonly notices = this.noticeList.asReadonly();
  readonly connectedCount = computed(() => this.resources().filter((r) => r.status === 'connected').length);
  /** Worst status of all resources, for the dot of the rail button. */
  readonly overall = computed<ConnectionStatus>(() => {
    const statuses = this.resources().map((r) => r.status);
    return statuses.includes('disconnected') ? 'disconnected' : statuses.includes('checking') ? 'checking' : 'connected';
  });

  private readonly destroyRef = inject(DestroyRef);

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.load(true);

    const timer = setInterval(() => this.check(), POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && this.check();
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  /** Checks the connection now (Connections dialog, poll, tab focus). */
  check(): Promise<void> {
    return pingStyleGuide().then((up) => {
      if (up) {
        return this.styleGuideInPage() ? this.setStatus('connected') : this.load(false);
      }
      // Lost: the page shows what a reload would (local icons, int-* without tokens), not a stale copy.
      if (this.styleGuideInPage()) {
        removeStyleGuide();
        this.styleGuideInPage.set(false);
        setIconLabFallback(true);
      }
      this.setStatus('disconnected');
    });
  }

  dismiss(id: number): void {
    this.noticeList.update((list) => list.filter((notice) => notice.id !== id));
  }

  private load(first: boolean): Promise<void> {
    return importStyleGuide().then(
      () => {
        this.styleGuideInPage.set(true);
        setIconLabFallback(false);
        this.setStatus('connected', first);
      },
      (err) => {
        if (first) {
          console.warn(`[style-guide] Not loaded from ${STYLE_GUIDE_BASE_URL}. Start the style guide repo (npm start).`, err);
        }
        setIconLabFallback(true);
        this.setStatus('disconnected', first);
      },
    );
  }

  private setStatus(status: ConnectionStatus, first = false): void {
    const previous = this.state().status;
    this.state.set({ resource: STYLE_GUIDE, status, checkedAt: new Date() });
    if (status === previous || (first && status === 'connected')) {
      return;
    }
    const name = STYLE_GUIDE.name;
    const url = STYLE_GUIDE.url;
    if (status === 'connected') {
      this.notify({ tone: 'success', title: `${name} conectado`, message: 'Tokens --i-*, clases pr* e iconos cargados desde', url, suffix: '.' });
    } else if (first) {
      this.notify({ tone: 'danger', title: `${name} no disponible`, message: 'Se usa el respaldo local de iconos. No responde', url, suffix: '.' });
    } else {
      this.notify({ tone: 'danger', title: `Se perdió la conexión con ${name}`, message: 'Se quitaron sus estilos; Icon Lab usa el respaldo local de iconos hasta que vuelva.' });
    }
  }

  private notify(notice: Omit<ConnectionNotice, 'id'>): void {
    const id = this.nextNoticeId++;
    this.noticeList.update((list) => [...list, { id, ...notice }]);
    setTimeout(() => this.dismiss(id), NOTICE_MS);
  }
}
