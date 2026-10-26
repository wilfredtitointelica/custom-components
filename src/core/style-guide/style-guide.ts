// Intelica Style Guide (repo Intelica.Style.Guide.New, `npm start`): its base bundle injects the --i-* tokens,
// reset and pr* classes into <head>. Dev URL only for now; without it the app still runs, int-* unstyled.
// Loaded and watched by service/external-resources.ts.
export const STYLE_GUIDE_BASE_URL = '//localhost:8080/Intelica-IntelicaStyleGuide-base.js';

// Local copy of the icon font and brand marks (page/icon-lab/icon-lab-fallback.scss), only used without the style guide.
const ICON_LAB_FALLBACK_HREF = 'icon-lab-fallback.css';
const ICON_LAB_FALLBACK_ID = 'doc-icon-lab-fallback';

let attempts = 0;
/**
 * Token only the style guide defines (tokens of bundle-base.scss): marks the <style> its style-loader injects.
 * Found by content, not by insertion time: Angular adds component <style> tags in the same moment.
 */
const BUNDLE_MARKER = '--i-NOTE-GLOBAL';

/**
 * Runs the bundle (SystemJS); rejects if it cannot be fetched. SystemJS keeps a module in its registry
 * (s.min.js has no System.delete), so each new attempt uses a new URL (?retry=n) and runs it again.
 */
export function importStyleGuide(): Promise<void> {
  const system = (window as Window & { System?: { import(url: string): Promise<unknown> } }).System;
  if (!system) {
    return Promise.reject(new Error('SystemJS not loaded'));
  }
  const url = attempts++ ? `${STYLE_GUIDE_BASE_URL}?retry=${attempts}` : STYLE_GUIDE_BASE_URL;
  return system.import(url).then(() => undefined);
}

/** <style> tags injected by the bundle (it carries its own source map, read by style-guide-tokens.ts). */
export function findStyleGuideStyles(): HTMLStyleElement[] {
  return [...document.head.querySelectorAll('style')].filter((style) => style.textContent?.includes(BUNDLE_MARKER));
}

/** Takes the bundle's CSS out of the page, as a reload without the style guide would. */
export function removeStyleGuide(): void {
  findStyleGuideStyles().forEach((style) => style.remove());
}

/** Whether the style guide server answers (no-cors: any response means it is up). */
export function pingStyleGuide(): Promise<boolean> {
  return fetch(STYLE_GUIDE_BASE_URL, {
    method: 'HEAD',
    mode: 'no-cors',
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  }).then(
    () => true,
    () => false,
  );
}

export function setIconLabFallback(enabled: boolean): void {
  const current = document.getElementById(ICON_LAB_FALLBACK_ID);
  if (!enabled) {
    current?.remove();
    return;
  }
  if (current) {
    return;
  }
  const link = document.createElement('link');
  link.id = ICON_LAB_FALLBACK_ID;
  link.rel = 'stylesheet';
  link.href = ICON_LAB_FALLBACK_HREF;
  document.head.append(link);
}
