import { Component, computed, input } from '@angular/core';

import { DocApi, DocApiToken } from '../../service/catalog.model';
import { InlineCode } from '../inline-code/inline-code';
import { resolveColor } from '../style-guide/style-guide-source';
import { apiBlockId } from './doc-api-toc';

/** A token with the color its value resolves to on :root (null when it is not a color). */
interface ResolvedToken extends DocApiToken {
  readonly color: string | null;
}

/** Tokens of one `// --- group ---` of the :root, in source order. */
interface TokenGroup {
  readonly name?: string;
  readonly tokens: readonly ResolvedToken[];
}

/**
 * API tab of a documentation page: inputs, outputs, templates, methods and --int-* tokens of the
 * selected version, as extracted from its sources by scripts/extract-api.mjs. Empty blocks are left out.
 * The jump buttons to each block live in the sticky bar (app-doc-api-toc).
 */
@Component({
  selector: 'app-doc-api',
  imports: [InlineCode],
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

  /** Color tokens get a swatch, like the color helpers of the Style Guide dialog. */
  protected readonly tokenGroups = computed(() => {
    const root = getComputedStyle(document.documentElement);
    return (this.api()?.tokens ?? []).reduce<TokenGroup[]>((groups, raw) => {
      const token = { ...raw, color: resolveColor(raw.value, root) };
      const last = groups.at(-1);
      if (last && last.name === token.group)
        return [...groups.slice(0, -1), { ...last, tokens: [...last.tokens, token] }];
      return [...groups, { name: token.group, tokens: [token] }];
    }, []);
  });
}
