import {
  Component,
  computed,
  inject,
  input,
  reflectComponentType,
  resource,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DocExampleCode, DocExampleSource } from '../../service/catalog.model';
import { CodeVisibility } from '../../service/code-visibility';
import { ComponentCatalog } from '../../service/component-catalog';
import { parseDocHtml } from '../../service/doc-html';
import { NavigationState } from '../../service/navigation-state';
import { CodePanel } from '../toggle-code/code-panel';
import { VersionPicker } from './version-picker';

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
  imports: [NgComponentOutlet, RouterLink, CodePanel, VersionPicker],
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

  /** Examples of the selected version, by slug; its chunk is loaded when the version changes. */
  protected readonly examples = resource({
    params: () => this.nav.activeVersion(),
    loader: async ({ params: version }): Promise<ReadonlyMap<string, DocExample>> => {
      const chunk = await version.loadExamples?.();
      return new Map((chunk?.default ?? []).flatMap(toExample));
    },
  });
}
