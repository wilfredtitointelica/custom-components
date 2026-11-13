import {
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

/** Every user-visible string rendered by the library. Override via `provideIntelicaUI` or `IntConfig.setTranslation`. */
export interface IntTranslation {
  emptyMessage: string;
  emptyFilterMessage: string;
  searchPlaceholder: string;
  clear: string;
  close: string;
  choose: string;
  upload: string;
  cancel: string;
  remove: string;
  pending: string;
  dragDropMessage: string;
  invalidFileSizeMessage: string;
  invalidFileTypeMessage: string;
  invalidFileLimitMessage: string;
  increment: string;
  decrement: string;
  prevMonth: string;
  nextMonth: string;
  prevYear: string;
  nextYear: string;
  chooseMonth: string;
  chooseYear: string;
  today: string;
}

export const INT_DEFAULT_TRANSLATION: IntTranslation = {
  emptyMessage: 'No available options',
  emptyFilterMessage: 'No results found',
  searchPlaceholder: 'Search',
  clear: 'Clear',
  close: 'Close',
  choose: 'Choose',
  upload: 'Upload',
  cancel: 'Cancel',
  remove: 'Remove',
  pending: 'Pending',
  dragDropMessage: 'Drag and drop files here to upload.',
  invalidFileSizeMessage: '{0}: Invalid file size, maximum upload size is {1}.',
  invalidFileTypeMessage: '{0}: Invalid file type, allowed file types: {1}.',
  invalidFileLimitMessage: 'Maximum number of files exceeded, limit is {0} at most.',
  increment: 'Increment',
  decrement: 'Decrement',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  prevYear: 'Previous year',
  nextYear: 'Next year',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  today: 'Today',
};

export interface IntelicaUIConfig {
  /** BCP 47 locale used for number/date formatting. Defaults to `en-US`. */
  locale?: string;
  translation?: Partial<IntTranslation>;
}

export const INT_CONFIG = new InjectionToken<IntelicaUIConfig>('INT_CONFIG');

/** Global runtime configuration (locale + translations). Reactive: components re-render on change. */
@Injectable({ providedIn: 'root' })
export class IntConfig {
  private readonly initial = inject(INT_CONFIG, { optional: true }) ?? {};

  readonly locale = signal(this.initial.locale ?? 'en-US');
  readonly translation = signal<IntTranslation>({
    ...INT_DEFAULT_TRANSLATION,
    ...this.initial.translation,
  });

  setTranslation(translation: Partial<IntTranslation>): void {
    this.translation.update((current) => ({ ...current, ...translation }));
  }

  setLocale(locale: string): void {
    this.locale.set(locale);
  }

  /** Returns a translated string, replacing `{0}`, `{1}`... with `params`. */
  t(key: keyof IntTranslation, ...params: (string | number)[]): string {
    return params.reduce<string>(
      (text, param, i) => text.replace(`{${i}}`, String(param)),
      this.translation()[key],
    );
  }
}

/** Registers global configuration for @intelica/ui. Use in `bootstrapApplication` providers. */
export function provideIntelicaUI(config: IntelicaUIConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: INT_CONFIG, useValue: config }]);
}
