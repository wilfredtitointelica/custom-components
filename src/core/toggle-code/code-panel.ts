import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';

import { CODE_LANGUAGES, CodeLanguage, DocExampleCode } from '../../service/catalog.model';
import { ClipCodeSource, ClipboardHistory } from '../../service/clipboard-history';
import { CodeVisibility } from '../../service/code-visibility';

type CodePartKind = 'int' | 'ng' | 'flow' | 'dep' | 'import' | 'interface' | 'decorator' | 'class' | 'method' | 'comment';
type CodePart = { text: string; kind: CodePartKind | null; name: boolean };
/** Lines (0-based) from where a block opens to where it closes; `kind` colors its guide. */
type FoldBlock = { start: number; end: number; kind: CodePartKind | null };

/**
 * Code viewer shown under a variant when its Code switch is on.
 * Shows the real source of the example folder (example.html / example.ts); nothing is invented here.
 * The body is limited to 480px (scroll); Expand opens the same viewer in a modal <dialog>
 * (closes with the X button, Esc or a click on the backdrop).
 */
@Component({
  selector: 'app-code-panel',
  imports: [NgTemplateOutlet, UpperCasePipe],
  template: `
    <div class="doc-code-panel" role="region" [attr.aria-label]="'Code: ' + label()">
      <ng-container *ngTemplateOutlet="toolbar; context: { $implicit: false }" />
      <ng-container *ngTemplateOutlet="legend" />
      <ng-container *ngTemplateOutlet="body" />
    </div>

    <dialog
      #dialog
      class="doc-code-dialog"
      [attr.aria-label]="'Code: ' + label()"
      (click)="$event.target === dialog && close()"
    >
      <div class="doc-code-panel">
        <ng-container *ngTemplateOutlet="toolbar; context: { $implicit: true }" />
        <ng-container *ngTemplateOutlet="legend" />
        <ng-container *ngTemplateOutlet="body" />
      </div>
    </dialog>

    <ng-template #toolbar let-inDialog>
      <div class="doc-code-toolbar">
        <div class="doc-code-tabs" role="tablist" aria-label="Language">
          @for (language of languages; track language) {
            <button
              type="button"
              role="tab"
              class="doc-code-tab"
              [class.doc-is-selected]="language === selected()"
              [attr.aria-selected]="language === selected()"
              (click)="selected.set(language)"
            >
              {{ language | uppercase }}
            </button>
          }
        </div>
        <div class="doc-code-actions">
          <button
            type="button"
            class="doc-code-action"
            [disabled]="!current()"
            [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
            [title]="copied() ? 'Copied' : 'Copy code'"
            (click)="copy()"
          >
            <i
              class="pi"
              [class.pi-copy]="!copied()"
              [class.pi-check]="copied()"
              aria-hidden="true"
            ></i>
          </button>
          @if (inDialog) {
            <button
              type="button"
              class="doc-code-action"
              aria-label="Close"
              title="Close"
              autofocus
              (click)="close()"
            >
              <i class="pi pi-times" aria-hidden="true"></i>
            </button>
          } @else {
            <button
              type="button"
              class="doc-code-action"
              aria-label="Expand code"
              title="Expand"
              aria-haspopup="dialog"
              (click)="expand()"
            >
              <i class="pi pi-window-maximize" aria-hidden="true"></i>
            </button>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #body>
      <div
        #scroller
        class="doc-code-body"
        role="tabpanel"
        [class.doc-code-plain]="!highlight()"
        (scroll)="remember(scroller)"
      >
        @if (current() && fold()) {
          <!-- Blocks switch on: one row per line; the row that opens a block draws its guide down to
               the closing line and the button that folds it. -->
          <pre><code class="doc-code-lines">@for (row of rows(); track row.index) {<span class="doc-code-line" [style.--doc-code-extra]="row.extra || null">@if (row.block; as block) {<span [class]="'doc-code-guide' + (block.kind ? ' doc-code-' + block.kind : '')" [style.--doc-code-indent]="block.indent" [style.--doc-code-span]="block.span"><button type="button" class="doc-code-fold" [attr.aria-expanded]="!block.folded" [attr.aria-label]="(block.folded ? 'Unfold' : 'Fold') + ' lines ' + (row.index + 1) + '–' + (block.end + 1)" (click)="toggleFold(row.index)"></button></span>}@if (row.lead) {<span class="doc-code-lead">{{ row.lead }}</span>}@for (part of row.parts; track $index) {<span [class]="part.kind ? 'doc-code-' + part.kind : ''" [class.doc-code-name]="part.name">{{ part.text }}</span>}@if (row.block?.folded) {<button type="button" class="doc-code-ellipsis" aria-label="Unfold" (click)="toggleFold(row.index)"></button>}</span>}</code></pre>
        } @else if (current()) {
          <pre><code>@for (part of parts(); track $index) {<span [class]="part.kind ? 'doc-code-' + part.kind : ''" [class.doc-code-name]="part.name">{{ part.text }}</span>}</code></pre>
        } @else {
          <p class="doc-code-pending">
            {{ selected() | uppercase }} code not available yet. It will be published once this
            variant has its example folder.
          </p>
        }
      </div>
    </ng-template>

    <!-- What each color means (only the kinds this example uses), the switch that shows the block
         guides (Blocks) and the one that turns the colors off (Highlights); both for this panel only. -->
    <ng-template #legend>
      @if (kinds().size || blocks().length) {
        <div class="doc-code-legend-bar">
          <ul class="doc-code-legend" aria-label="Color legend">
            @if (kinds().has('int')) {
              <li><span class="doc-code-swatch doc-code-int"></span><code class="doc-code-int">int-*</code> Component</li>
            }
            @if (kinds().has('ng')) {
              <li><span class="doc-code-swatch doc-code-ng"></span><code class="doc-code-ng">ng-*</code> Angular template</li>
            }
            @if (kinds().has('flow')) {
              <li><span class="doc-code-swatch doc-code-flow"></span><code class="doc-code-flow">&#64;if &#64;for</code> Control flow</li>
            }
            @if (kinds().has('dep')) {
              <li><span class="doc-code-swatch doc-code-dep"></span><code class="doc-code-dep">dep:</code> Provisional dependency</li>
            }
            @if (kinds().has('import')) {
              <li><span class="doc-code-swatch doc-code-import"></span><code class="doc-code-import">import</code> Import</li>
            }
            @if (kinds().has('interface')) {
              <li><span class="doc-code-swatch doc-code-interface"></span><code class="doc-code-interface">interface</code> Type</li>
            }
            @if (kinds().has('decorator')) {
              <li><span class="doc-code-swatch doc-code-decorator"></span><code class="doc-code-decorator">&#64;Component</code> Decorator</li>
            }
            @if (kinds().has('class')) {
              <li><span class="doc-code-swatch doc-code-class"></span><code class="doc-code-class">class</code> Class</li>
            }
            @if (kinds().has('method')) {
              <li><span class="doc-code-swatch doc-code-method"></span><code class="doc-code-method">method()</code> Method</li>
            }
          </ul>
          <div class="doc-code-switches">
            @if (blocks().length) {
              <button
                type="button"
                class="doc-code-toggle"
                [attr.aria-pressed]="fold()"
                title="Show a guide from the start to the end of each block and fold it, like a code editor"
                (click)="fold.set(!fold())"
              >
                Blocks
                <span class="doc-code-switch" aria-hidden="true"></span>
              </button>
            }
            <button
              type="button"
              class="doc-code-toggle doc-code-highlight"
              [attr.aria-pressed]="highlight()"
              title="Color the highlighted pieces of this code"
              (click)="highlight.set(!highlight())"
            >
              Highlights
              <span class="doc-code-switch" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      }
    </ng-template>
  `,
  styleUrl: './code-panel.scss',
})
export class CodePanel {
  readonly label = input.required<string>();
  readonly sources = input<DocExampleCode>();
  /** Variant shown (page, #fragment, version): saved with every copy so the history can link back. */
  readonly source = input<Omit<ClipCodeSource, 'language'>>();

  protected readonly languages = CODE_LANGUAGES;
  protected readonly selected = signal<CodeLanguage>(CODE_LANGUAGES[0]);
  protected readonly current = computed(() => this.sources()?.[this.selected()] ?? null);
  /**
   * Source split so some pieces stand out (text only, no innerHTML): htmlParts / tsParts.
   * The Highlights switch of the legend bar only removes the colors (CSS); the split stays.
   */
  protected readonly parts = computed(() => {
    const source = this.current() ?? '';
    return this.selected() === 'html' ? htmlParts(source) : tsParts(source);
  });
  /** Kinds present in the current source: the legend lists only these (comments have no entry). */
  protected readonly kinds = computed(
    () => new Set(this.parts().flatMap((part) => (part.kind && part.kind !== 'comment' ? [part.kind] : []))),
  );
  /** Highlights switch of the legend bar: own state of each variant's panel, on by default. */
  protected readonly highlight = signal(true);
  /** Blocks of the current source that span more than one line (one per start line). */
  protected readonly blocks = computed(() => {
    const source = this.current() ?? '';
    return this.selected() === 'html' ? htmlBlocks(source) : tsBlocks(source);
  });
  /** Blocks switch of the legend bar: block guides + fold buttons; on by default. */
  protected readonly fold = signal(true);
  /** Folded blocks as "language:start line"; a new example (another version) starts unfolded. */
  protected readonly folded = linkedSignal<DocExampleCode | undefined, ReadonlySet<string>>({
    source: this.sources,
    computation: () => new Set(),
  });
  /**
   * Lines shown with the Blocks switch on: the inner lines of a folded block are left out (its closing
   * line stays). `span` is how many shown lines the guide goes down to reach the closing one.
   */
  protected readonly rows = computed(() => {
    const lines = toLines(this.parts());
    const language = this.selected();
    const folded = this.folded();
    const starts = new Map(this.blocks().map((block) => [block.start, block]));
    const hidden = new Array<boolean>(lines.length).fill(false);
    for (const block of starts.values()) {
      if (folded.has(`${language}:${block.start}`)) {
        hidden.fill(true, block.start + 1, block.end);
      }
    }
    const shown: number[] = [];
    let count = 0;
    for (const line of lines.keys()) {
      shown[line] = count;
      count += hidden[line] ? 0 : 1;
    }
    const leads = lines.map((parts) => parts.map((part) => part.text).join('').match(/^\s*/)?.[0] ?? '');
    // A block that wraps others starting in its same column (a "dep:" pair around its element)
    // counts as one more level: its inner lines go one level to the right (`extra`) so the guides
    // keep their room instead of overlapping.
    const wrappers = [...starts.values()].filter((block) =>
      [...starts.values()].some(
        (inner) =>
          inner.start > block.start &&
          inner.start < block.end &&
          leads[inner.start].length === leads[block.start].length,
      ),
    );
    return lines.flatMap((parts, index) => {
      if (hidden[index]) {
        return [];
      }
      const block = starts.get(index);
      const lead = leads[index];
      return [
        {
          index,
          extra: wrappers.filter((wrapper) => wrapper.start < index && index < wrapper.end).length,
          // Indentation apart, so the CSS can widen it (the spaces stay: copying keeps them).
          lead,
          parts: dropLead(parts, lead.length),
          block: block && {
            kind: block.kind,
            end: block.end,
            indent: lead.length,
            span: shown[block.end] - shown[index],
            folded: folded.has(`${language}:${index}`),
          },
        },
      ];
    });
  });
  protected readonly copied = signal(false);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly clipboard = inject(ClipboardHistory);
  /** Body of the panel and of the dialog: both get back the scroll of the tab shown. */
  private readonly scrollers = viewChildren<ElementRef<HTMLElement>>('scroller');
  /** Scroll of each tab, so going HTML → TS → HTML keeps where each one was. */
  private readonly scrolls = new Map<CodeLanguage, { top: number; left: number }>();

  constructor() {
    // Link of the history: switch to the tab the code was copied from (once).
    const code = inject(CodeVisibility);
    effect(() => {
      const requested = code.requested();
      if (requested && requested.variantId === this.source()?.variantId) {
        this.selected.set(requested.language);
        untracked(() => code.requested.set(null));
      }
    });
    // Tab shown (once its code is in the DOM): back to where that tab was left, or to the top.
    afterRenderEffect(() => {
      const { top, left } = this.scrolls.get(this.selected()) ?? { top: 0, left: 0 };
      for (const { nativeElement } of this.scrollers()) {
        nativeElement.scrollTo({ top, left });
      }
    });
  }

  protected toggleFold(start: number): void {
    const key = `${this.selected()}:${start}`;
    this.folded.update((folded) => {
      const next = new Set(folded);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  protected remember(scroller: HTMLElement): void {
    this.scrolls.set(this.selected(), { top: scroller.scrollTop, left: scroller.scrollLeft });
  }

  protected async copy(): Promise<void> {
    const label = `${this.selected().toUpperCase()} · ${this.label()}`;
    const from = this.source();
    const source = from && { ...from, language: this.selected() };
    if (!(await this.clipboard.copy('code', this.current() ?? '', label, source))) {
      return;
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  protected expand(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}

/** Angular control flow blocks: `@if (…) {`, `} @else {`, `@for (…) {`, `@switch`, `@defer`… */
const FLOW_BLOCK = '@(?:if|else|for|empty|switch|case|default|defer|placeholder|loading|error)\\b';

/**
 * HTML tab: <int-*> tags, <ng-*> tags, the "dep:" comments that wrap a provisional, the other
 * comments (dimmed) and the control flow (`@for (…) {` and its closing `}`). Other tags and
 * {{ interpolations }} are skipped whole so a brace inside them does not close a block.
 */
function htmlParts(source: string): CodePart[] {
  const parts: CodePart[] = [];
  const tokens = new RegExp(
    [
      /<!--\s*\/?(dep:)?[\s\S]*?-->/.source,
      /(<\/?)((int|ng)-[\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*>)/.source,
      /<\/?[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>|\{\{[\s\S]*?\}\}/.source,
      `(${FLOW_BLOCK})([^{}\\n]*\\{)`,
      /\}/.source,
    ].join('|'),
    'g',
  );
  let flow = 0;
  let last = 0;
  for (const match of source.matchAll(tokens)) {
    const [token, dep, open, name, prefix, rest, keyword, condition] = match;
    let found: CodePart[];
    if (token.startsWith('<!--')) {
      found = [{ text: token, kind: dep ? 'dep' : 'comment', name: false }];
    } else if (name) {
      const kind = prefix === 'int' ? 'int' : 'ng';
      found = [
        { text: open, kind, name: false },
        { text: name, kind, name: true },
        { text: rest, kind, name: false },
      ];
    } else if (keyword) {
      flow++;
      found = [
        { text: keyword, kind: 'flow', name: true },
        { text: condition, kind: 'flow', name: false },
      ];
    } else if (token === '}' && flow) {
      flow--;
      found = [{ text: token, kind: 'flow', name: false }];
    } else {
      continue;
    }
    parts.push({ text: source.slice(last, match.index), kind: null, name: false }, ...found);
    last = match.index + token.length;
  }
  parts.push({ text: source.slice(last), kind: null, name: false });
  return parts.filter((part) => part.text);
}

/**
 * TS tab: only the line that opens each piece and the one with its closing brace are colored
 * (the body keeps the base color).
 * Groups: before the name · name (bold) · rest of the line; imports have no name.
 */
const TS_LINES: readonly (readonly [CodePartKind, RegExp])[] = [
  ['import', /^(import\b.*)$/],
  ['interface', /^((?:export\s+)?(?:interface|type)\s+)([\w$]+)(.*)$/],
  ['decorator', /^(\s*@)([A-Z][\w$]*)(.*)$/],
  ['class', /^((?:export\s+)?(?:abstract\s+)?class\s+)([\w$]+)(.*)$/],
  [
    'method',
    /^(\s+(?:(?:public|protected|private|static|async|override|get|set)\s+)*)(?!(?:if|for|while|switch|catch|return)\b)([\w$]+)(\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::[^{=;]+)?\{\s*)$/,
  ],
];

/** Braces of a line outside its '…' / "…" strings. */
function braceDelta(text: string): number {
  const code = text.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '');
  return (code.match(/\{/g)?.length ?? 0) - (code.match(/\}/g)?.length ?? 0);
}

/**
 * Comments of a TS line (dimmed): `// …` to the end and `/* … *\/`, which may come from the
 * previous lines (`inBlock`) or go on to the next ones. Strings are skipped so a '//' inside
 * them is not a comment.
 */
function splitComments(text: string, inBlock: boolean): { parts: CodePart[]; inBlock: boolean } {
  const parts: CodePart[] = [];
  let last = 0;
  if (inBlock) {
    const end = text.indexOf('*/');
    if (end < 0) {
      return { parts: [{ text, kind: 'comment', name: false }], inBlock: true };
    }
    last = end + 2;
    parts.push({ text: text.slice(0, last), kind: 'comment', name: false });
  }
  const tokens = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/g;
  tokens.lastIndex = last;
  for (let match = tokens.exec(text); match; match = tokens.exec(text)) {
    const [token] = match;
    if (token[0] !== '/') {
      continue;
    }
    parts.push({ text: text.slice(last, match.index), kind: null, name: false }, { text: token, kind: 'comment', name: false });
    last = match.index + token.length;
    if (token[1] === '*' && (token.length < 4 || !token.endsWith('*/'))) {
      return { parts, inBlock: true };
    }
  }
  parts.push({ text: text.slice(last), kind: null, name: false });
  return { parts, inBlock: false };
}

function tsParts(source: string): CodePart[] {
  const parts: CodePart[] = [];
  // Open pieces: the line where the depth goes back to `depth` (its closing brace) gets the same color.
  const open: { kind: CodePartKind; depth: number }[] = [];
  let depth = 0;
  let inComment = false;
  for (const line of source.split(/(?<=\n)/)) {
    const eol = line.match(/\r?\n$/)?.[0] ?? '';
    const text = line.slice(0, line.length - eol.length);
    const startsInComment = inComment;
    const split = splitComments(text, inComment);
    inComment = split.inBlock;
    const code = split.parts.flatMap((part) => (part.kind ? [] : [part.text])).join('');
    const start = depth;
    depth += braceDelta(code);
    const found = startsInComment
      ? undefined
      : TS_LINES.map(([kind, pattern]) => ({ kind, match: text.match(pattern) })).find((line) => line.match);
    if (!found?.match) {
      const closes = open.at(-1);
      if (closes && depth <= closes.depth && /^\s*\}/.test(code)) {
        open.pop();
        parts.push({ text, kind: closes.kind, name: false });
      } else {
        parts.push(...split.parts);
      }
      parts.push({ text: eol, kind: null, name: false });
      continue;
    }
    if (depth > start) {
      open.push({ kind: found.kind, depth: start });
    }
    const { kind } = found;
    const [, before, name, after] = found.match;
    parts.push({ text: before, kind, name: false });
    if (name !== undefined) {
      parts.push({ text: name, kind, name: true }, { text: after, kind, name: false });
    }
    parts.push({ text: eol, kind: null, name: false });
  }
  return parts.filter((part) => part.text);
}

/** Parts grouped by line (without the line breaks); a final line break adds no empty line. */
function toLines(parts: CodePart[]): CodePart[][] {
  const lines: CodePart[][] = [[]];
  for (const part of parts) {
    part.text.split(/\r?\n/).forEach((text, i) => {
      if (i) {
        lines.push([]);
      }
      if (text) {
        lines[lines.length - 1].push({ ...part, text });
      }
    });
  }
  if (lines.length > 1 && !lines[lines.length - 1].length) {
    lines.pop();
  }
  return lines;
}

/** Parts of a line without its first `count` characters (its indentation). */
function dropLead(parts: CodePart[], count: number): CodePart[] {
  return parts.flatMap((part) => {
    const cut = Math.min(count, part.text.length);
    count -= cut;
    return cut === part.text.length ? [] : [{ ...part, text: part.text.slice(cut) }];
  });
}

/** Line (0-based) of each offset of the source. */
function lineIndex(source: string): number[] {
  const lineOf: number[] = [];
  let line = 0;
  for (let i = 0; i <= source.length; i++) {
    lineOf.push(line);
    line += source[i] === '\n' ? 1 : 0;
  }
  return lineOf;
}

/** One block per start line (the one that goes furthest), only if it spans more than one line. */
function foldBlocks(blocks: FoldBlock[]): FoldBlock[] {
  const byStart = new Map<number, FoldBlock>();
  for (const block of blocks) {
    const same = byStart.get(block.start);
    if (block.end > block.start && (!same || block.end > same.end)) {
      byStart.set(block.start, block);
    }
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start);
}

/**
 * TS blocks: { }, [ ] and ( ) that close on another line, and /* … *\/ comments. The guide takes the
 * color of the declaration that opens it (TS_LINES); the rest go neutral.
 */
function tsBlocks(source: string): FoldBlock[] {
  const lineOf = lineIndex(source);
  const lines = source.split(/\r?\n/);
  const kindOf = (line: number) => TS_LINES.find(([, pattern]) => pattern.test(lines[line]))?.[0] ?? null;
  const blocks: FoldBlock[] = [];
  const open: number[] = [];
  for (const match of source.matchAll(/\/\/.*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|[{[()\]}]/g)) {
    const [token] = match;
    const line = lineOf[match.index];
    if (token.startsWith('/*')) {
      blocks.push({ start: line, end: lineOf[match.index + token.length - 1], kind: 'comment' });
    } else if (token.length === 1 && '{[('.includes(token)) {
      open.push(line);
    } else if (token.length === 1 && '}])'.includes(token)) {
      const start = open.pop();
      if (start !== undefined) {
        blocks.push({ start, end: line, kind: kindOf(start) });
      }
    }
  }
  return foldBlocks(blocks);
}

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/**
 * HTML blocks: elements from the opening tag to the closing one (or a tag that spans lines),
 * Angular control flow (@if / @for … { }), "dep:" pairs and comments. Guide color: int-* / ng-* /
 * control flow / dep like their highlight; any other element goes neutral.
 */
function htmlBlocks(source: string): FoldBlock[] {
  const lineOf = lineIndex(source);
  const tagKind = (name: string): CodePartKind | null =>
    name.startsWith('int-') ? 'int' : name.startsWith('ng-') ? 'ng' : null;
  const blocks: FoldBlock[] = [];
  const tags: { name: string; line: number }[] = [];
  const braces: number[] = [];
  const deps: number[] = [];
  const tokens = new RegExp(
    [
      /<!--\s*(\/?)(dep:)?[\s\S]*?-->/.source,
      /<(\/?)([a-zA-Z][\w-]*)(?:[^>"']|"[^"]*"|'[^']*')*?(\/?)>/.source,
      `${FLOW_BLOCK}[^{}\\n]*\\{`,
      /\{\{[\s\S]*?\}\}|\}/.source,
    ].join('|'),
    'g',
  );
  for (const match of source.matchAll(tokens)) {
    const [token, closeDep, dep, closeTag, name, selfClose] = match;
    const line = lineOf[match.index];
    const end = lineOf[match.index + token.length - 1];
    if (token.startsWith('<!--')) {
      if (dep && closeDep) {
        const start = deps.pop();
        if (start !== undefined) {
          blocks.push({ start, end, kind: 'dep' });
        }
      } else if (dep) {
        deps.push(line);
      } else {
        blocks.push({ start: line, end, kind: 'comment' });
      }
    } else if (name && closeTag) {
      const at = tags.map((tag) => tag.name).lastIndexOf(name);
      if (at >= 0) {
        blocks.push({ start: tags[at].line, end, kind: tagKind(name) });
        tags.length = at;
      }
    } else if (name) {
      if (selfClose || VOID_TAGS.has(name.toLowerCase())) {
        blocks.push({ start: line, end, kind: tagKind(name) });
      } else {
        tags.push({ name, line });
      }
    } else if (token.startsWith('@')) {
      braces.push(line);
    } else if (token === '}') {
      const start = braces.pop();
      if (start !== undefined) {
        blocks.push({ start, end: line, kind: 'flow' });
      }
    }
  }
  return foldBlocks(blocks);
}
