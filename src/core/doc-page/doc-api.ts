import { Component, computed, input } from '@angular/core';

import { DocApi, DocApiToken } from '../../service/catalog.model';
import { apiBlockId } from './doc-api-toc';

/** Tokens of one `// --- group ---` of the :root, in source order. */
interface TokenGroup {
  readonly name?: string;
  readonly tokens: readonly DocApiToken[];
}

/**
 * API tab of a documentation page: inputs, outputs, templates, methods and --int-* tokens of the
 * selected version, as extracted from its sources by scripts/extract-api.mjs. Empty blocks are left out.
 * The jump buttons to each block live in the sticky bar (app-doc-api-toc).
 */
@Component({
  selector: 'app-doc-api',
  templateUrl: './doc-api.html',
  styleUrl: './doc-api.scss',
})
export class DocApiView {
  readonly api = input<DocApi>();
  /** Component ID: prefix of the block anchors (#<id>-api-inputs…). */
  readonly componentId = input.required<string>();

  protected readonly blockId = apiBlockId;

  /** Some member says where it comes from: show the legend of the PrimeNG / int-* chips. */
  protected readonly hasOrigins = computed(() => {
    const api = this.api();
    return (
      !!api &&
      [...api.inputs, ...api.outputs, ...api.templates, ...api.methods].some((m) => m.origin)
    );
  });

  protected readonly tokenGroups = computed(() =>
    (this.api()?.tokens ?? []).reduce<TokenGroup[]>((groups, token) => {
      const last = groups.at(-1);
      if (last && last.name === token.group)
        return [...groups.slice(0, -1), { ...last, tokens: [...last.tokens, token] }];
      return [...groups, { name: token.group, tokens: [token] }];
    }, []),
  );
}
