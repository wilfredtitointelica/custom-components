import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DocApi } from '../../service/catalog.model';

/** A block of the API tab, in display order; only the ones with entries. */
export interface DocApiBlock {
  readonly key: 'inputs' | 'outputs' | 'templates' | 'methods' | 'tokens';
  readonly title: string;
  readonly count: number;
}

export function apiBlocks(api: DocApi | undefined): DocApiBlock[] {
  if (!api) return [];
  const blocks: DocApiBlock[] = [
    { key: 'inputs', title: 'Properties', count: api.inputs.length },
    { key: 'outputs', title: 'Events', count: api.outputs.length },
    { key: 'templates', title: 'Templates', count: api.templates.length },
    { key: 'methods', title: 'Methods', count: api.methods.length },
    { key: 'tokens', title: 'CSS tokens', count: api.tokens.length },
  ];
  return blocks.filter((block) => block.count > 0);
}

/** Anchor of one block: #<componentId>-api-<key>. */
export const apiBlockId = (componentId: string, key: string) => `${componentId}-api-${key}`;

/**
 * Jump buttons to each block of the API tab, in the sticky chips bar (in place of the variants,
 * status, Figma and dependencies chips, which only matter to Features). Same outlined style as the
 * other actions of the bar, so they read as clickable.
 */
@Component({
  selector: 'app-doc-api-toc',
  imports: [RouterLink],
  templateUrl: './doc-api-toc.html',
  styleUrl: './doc-api-toc.scss',
  host: { role: 'group', 'aria-labelledby': 'doc-api-toc-label' },
})
export class DocApiToc {
  readonly api = input<DocApi>();
  readonly componentId = input.required<string>();
  /** Route of the documentation page, for the anchors. */
  readonly path = input.required<string>();

  protected readonly blocks = computed(() => apiBlocks(this.api()));
  protected readonly blockId = apiBlockId;
}
