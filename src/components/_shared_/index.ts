/**
 * Library core shared by every `<id>/version-N/base/`: form-control base, i18n config, icons,
 * overlay positions and option helpers (ported from @intelica/ui/core).
 * Not a catalog entry (no version-N/ folder). Must not import from the documentation app
 * (`core/`, `service/`, `variants/`), so it can be extracted to npm together with the bases.
 * SCSS building blocks: `@use '../../../_shared_/mixins' as int;`.
 */
export * from './types';
export * from './id';
export * from './config';
export * from './options';
export * from './base-control';
export * from './icon';
export * from './overlay';
export * from './style-loader';
