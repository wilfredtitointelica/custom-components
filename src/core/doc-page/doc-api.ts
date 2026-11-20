import { Component, computed, input, signal } from '@angular/core';

import { DocApi, DocApiToken } from '../../service/catalog.model';
import { InlineCode } from '../inline-code/inline-code';
import { readStyleGuideSources, resolveColor } from '../style-guide/style-guide-source';
import { apiBlockId } from './doc-api-toc';

/**
 * One `label: text` piece of the origin comment (`// _tokens_: … · SG: 4px · Aura: …`). Common tokens of
 * the repo and Style Guide tokens show only their file name as a chip, with the full path in the tooltip.
 */
interface SourcePart {
  readonly kind: 'common' | 'sg' | 'label' | 'text';
  /** Chip text (file name) or label (knowledgeBase, Figma, Aura…); '' for loose text. */
  readonly label: string;
  /** Tooltip: where the value comes from. */
  readonly tip: SourceTip | null;
  /** Text after the chip or label ('' when the chip says it all). */
  readonly text: string;
}

/** Content of the origin tooltip: source, file path and token it reads. */
interface SourceTip {
  readonly heading: string;
  readonly path?: string;
  readonly token?: string;
}

/** Origin tooltip on screen, fixed to the viewport so the scrolling table does not clip it. */
interface OpenTip extends SourceTip {
  readonly top: number;
  readonly left: number;
}

const TIP_WIDTH = 340;
const TIP_GAP = 8;
const TIP_GUTTER = 16;

/** A token with the color its value resolves to on :root (null when it is not a color). */
interface ResolvedToken extends DocApiToken {
  readonly color: string | null;
  readonly parts: readonly SourcePart[];
}

const COMMON_DIR = 'src/components/_tokens_/';
/** --int-<prefix>-* tokens shared by the components, declared in src/components/_tokens_/_tokens.<prefix>.scss. */
const COMMON_TOKEN = /--int-(control)-[\w-]+/;
const SG_TOKEN = /--i-[\w-]+/;
const SG_DECLARATION = /(--i-[\w-]+)\s*:/g;
const PART = /^(\w+):\s*([\s\S]*)$/;

const LABEL_TIPS: Readonly<Record<string, SourceTip>> = {
  knowledgeBase: {
    heading: 'Base de conocimientos: caso .pr del componente',
    path: 'Intelica.knowledgeBase/Desarrollo/Estandares/Diseño/components/',
  },
  Figma: { heading: 'Figma: referencia visual' },
  Aura: { heading: 'PrimeNG v20: token del preset Aura', path: '@primeuix/themes/aura' },
};

/** Path of the Style Guide file that declares each --i-* token, from the bundle's source map. */
function readStyleGuideFiles(): ReadonlyMap<string, string> {
  const files = new Map<string, string>();
  for (const { path, content } of readStyleGuideSources() ?? []) {
    const clean = path.replace(/^webpack:\/\/\.?\/?/, '');
    for (const [, name] of content.matchAll(SG_DECLARATION)) {
      if (!files.has(name)) files.set(name, clean);
    }
  }
  return files;
}

/** Splits the origin comment of a token into chips (_tokens_, SG), labels and loose text. */
function parseSource(token: DocApiToken, sgFiles: ReadonlyMap<string, string>): SourcePart[] {
  if (!token.source) return [];
  return token.source.split(/\s+·\s+/).map((piece): SourcePart => {
    const [, label = '', text = piece] = PART.exec(piece) ?? [];
    if (label === '_tokens_') {
      const common = COMMON_TOKEN.exec(text) ?? COMMON_TOKEN.exec(token.value);
      const file = common ? `_tokens.${common[1]}.scss` : '_tokens_';
      return {
        kind: 'common',
        label: file,
        tip: {
          heading: 'Token común del repo',
          path: COMMON_DIR + (common ? file : ''),
          token: common?.[0],
        },
        text: '',
      };
    }
    if (label === 'SG') {
      const name = SG_TOKEN.exec(token.value)?.[0] ?? SG_TOKEN.exec(text)?.[0];
      const path = name ? sgFiles.get(name) : undefined;
      return {
        kind: 'sg',
        label: path ? path.slice(path.lastIndexOf('/') + 1) : 'Style Guide',
        tip: {
          heading: 'Style Guide (Intelica.Style.Guide.New)',
          path: path ?? 'Bundle del Style Guide no cargado en la página',
          token: name,
        },
        text: text === name ? '' : text,
      };
    }
    if (label) return { kind: 'label', label, tip: LABEL_TIPS[label] ?? { heading: label }, text };
    return { kind: 'text', label: '', tip: null, text };
  });
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
  host: {
    '(window:scroll)': 'hideTip()',
    '(window:resize)': 'hideTip()',
    '(document:keydown.escape)': 'hideTip()',
  },
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
    const sgFiles = readStyleGuideFiles();
    return (this.api()?.tokens ?? []).reduce<TokenGroup[]>((groups, raw) => {
      const token = { ...raw, color: resolveColor(raw.value, root), parts: parseSource(raw, sgFiles) };
      const last = groups.at(-1);
      if (last && last.name === token.group)
        return [...groups.slice(0, -1), { ...last, tokens: [...last.tokens, token] }];
      return [...groups, { name: token.group, tokens: [token] }];
    }, []);
  });

  /** Origin tooltip open (hover or focus on a chip of the Origin column). */
  protected readonly tip = signal<OpenTip | null>(null);

  /** Opens the origin tooltip below the chip, kept inside the viewport. */
  protected showTip(event: Event, tip: SourceTip | null): void {
    if (!tip) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const maxLeft = window.innerWidth - Math.min(TIP_WIDTH, window.innerWidth - TIP_GUTTER * 2) - TIP_GUTTER;
    this.tip.set({
      ...tip,
      top: rect.bottom + TIP_GAP,
      left: Math.max(TIP_GUTTER, Math.min(rect.left, maxLeft)),
    });
  }

  protected hideTip(): void {
    this.tip.set(null);
  }
}
