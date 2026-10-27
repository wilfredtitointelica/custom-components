import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  reflectComponentType,
  resource,
  Type,
  untracked,
} from '@angular/core';
import { NgComponentOutlet, ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DocExampleCode, DocExampleSource } from '../../service/catalog.model';
import { CodeVisibility } from '../../service/code-visibility';
import { ComponentCatalog } from '../../service/component-catalog';
import { parseDocHtml } from '../../service/doc-html';
import { NavigationState } from '../../service/navigation-state';
import { CodePanel } from '../toggle-code/code-panel';
import { VersionPicker } from './version-picker';
import { DesignerBadge } from '../designer-badge/designer-badge';
import { StatusChip } from '../status-chip/status-chip';

/** A rendered example: the component exported by variants/<slug>/example.ts and its code. */
interface DocExample {
  readonly component: Type<unknown>;
  readonly sources: DocExampleCode;
  /** example.html is empty or only has comments: "Preview pending" instead of the preview. */
  readonly pending: boolean;
}

/** The Angular component exported by an example module (whatever its class name). */
function toExample({ slug, module, sources }: DocExampleSource): [string, DocExample][] {
  const component = Object.values(module).find(
    (value): value is Type<unknown> =>
      typeof value === 'function' && reflectComponentType(value as Type<unknown>) !== null,
  );
  if (!component) {
    console.warn(`[doc-page] variants/${slug}/example.ts does not export a component.`);
    return [];
  }
  // The code panel shows example.html without its documentation header.
  const html = parseDocHtml(sources.html);
  return [
    [slug, { component, sources: { ...sources, html: html.body, ts: sources.ts?.trim() }, pending: html.pending }],
  ];
}

/**
 * Documentation layout shared by every component page. Renders one anchored section per visible
 * variant (<id>.config.ts + detected folders) with the example of the selected version, found by
 * convention in version-N/variants/<slug>/ (see scripts/generate-docs.mjs). Nothing is registered by hand.
 */
@Component({
  selector: 'app-doc-page',
  imports: [NgComponentOutlet, RouterLink, CodePanel, VersionPicker, StatusChip, DesignerBadge],
  templateUrl: './doc-page.html',
  styleUrl: './doc-page.scss',
})
export class DocPage {
  readonly componentId = input.required<string>();

  private readonly catalog = inject(ComponentCatalog);
  protected readonly nav = inject(NavigationState);
  protected readonly code = inject(CodeVisibility);

  protected readonly component = computed(() => {
    const component = this.catalog.find(this.componentId());
    if (!component)
      throw new Error(`[doc-page] "${this.componentId()}" is not in the component inventory.`);
    return component;
  });

  /**
   * Components this one composes (config `requires`), with the status of their latest version; a
   * missing one is not created yet. Not done = the base still uses a provisional for it.
   */
  protected readonly requirements = computed(() =>
    this.component().requires.map((id) => {
      const required = this.catalog.find(id);
      return {
        id,
        name: required?.name ?? id,
        path: required?.path,
        status: required ? (required.versions.at(-1)?.status ?? 'pending') : undefined,
      };
    }),
  );

  /** Examples of the selected version, by slug; its chunk is loaded when the version changes. */
  protected readonly examples = resource({
    params: () => this.nav.activeVersion(),
    loader: async ({ params: version }): Promise<ReadonlyMap<string, DocExample>> => {
      const chunk = await version.loadExamples?.();
      return new Map((chunk?.default ?? []).flatMap(toExample));
    },
  });

  constructor() {
    // The router scrolls to #<variant> as soon as the page opens, but the previews load afterwards and
    // push the sections down. Once they are rendered, scroll to the selected variant again (reload,
    // direct link, version change). Clicking a variant later does not re-run this.
    const scroller = inject(ViewportScroller);
    const injector = inject(Injector);
    effect(() => {
      if (this.examples.isLoading() || !this.examples.hasValue()) return;
      const variantId = untracked(() => this.nav.activeVariantId());
      if (variantId) afterNextRender(() => scroller.scrollToAnchor(variantId), { injector });
    });
  }
}
