import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  reflectComponentType,
  resource,
  signal,
  Type,
  untracked,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet, ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CatalogVariant, DocExampleCode, DocExampleSource } from '../../service/catalog.model';
import { CodeVisibility } from '../../service/code-visibility';
import { ComponentCatalog } from '../../service/component-catalog';
import { parseDocHtml } from '../../service/doc-html';
import { NavigationState } from '../../service/navigation-state';
import { DocApiView } from './doc-api';
import { DocApiToc } from './doc-api-toc';
import { DocTabs } from './doc-tabs';
import { InlineCode } from '../inline-code/inline-code';
import { CodePanel } from '../toggle-code/code-panel';
import { VersionPicker } from './version-picker';
import { DesignerBadge } from '../designer-badge/designer-badge';
import { StatusChip } from '../status-chip/status-chip';

/** A rendered example: the component exported by variants|compositions/<slug>/example.ts and its code. */
interface DocExample {
  readonly component: Type<unknown>;
  readonly sources: DocExampleCode;
  /** example.html is empty or only has comments: "Preview pending" instead of the preview. */
  readonly pending: boolean;
  /** Dependencies still provisional in example.html (`data-dep="<id>"` of the provisional element). */
  readonly provisionalDeps: readonly string[];
}

/** `data-dep="<id>"`: root element of a provisional marked `dep:<id> provisional` (skill replicar-primeng). */
const PROVISIONAL_DEP = /\bdata-dep="([a-z0-9-]+)"/g;

/** `<int-<id>`: a finished int-* component used in an example template. */
const INT_TAG = /<int-([a-z0-9-]+)/g;

/**
 * IDs of the int-* components the given examples contain, real (`<int-button>`) or provisional
 * (`data-dep="button"`), read from their example.html of the selected version.
 */
function usedDependencies(
  exampleHtml: Readonly<Record<string, string>> | undefined,
  examples: readonly CatalogVariant[],
): ReadonlySet<string> {
  const html = examples.map((example) => exampleHtml?.[example.slug] ?? '').join('\n');
  return new Set([...html.matchAll(PROVISIONAL_DEP), ...html.matchAll(INT_TAG)].map((m) => m[1]));
}

/** The Angular component exported by an example module (whatever its class name). */
function toExample({ slug, module, sources }: DocExampleSource): [string, DocExample][] {
  const component = Object.values(module).find(
    (value): value is Type<unknown> =>
      typeof value === 'function' && reflectComponentType(value as Type<unknown>) !== null,
  );
  if (!component) {
    console.warn(`[doc-page] ${slug}/example.ts does not export a component.`);
    return [];
  }
  // The code panel shows example.html without its documentation header.
  const html = parseDocHtml(sources.html);
  const provisionalDeps = [
    ...new Set([...(sources.html ?? '').matchAll(PROVISIONAL_DEP)].map((m) => m[1])),
  ];
  return [
    [
      slug,
      {
        component,
        sources: { ...sources, html: html.body, ts: sources.ts?.trim() },
        pending: html.pending,
        provisionalDeps,
      },
    ],
  ];
}

/**
 * Documentation layout shared by every component page. Renders one anchored section per visible
 * variant (<id>.config.ts + detected folders) with the example of the selected version, found by
 * convention in version-N/variants/<slug>/ (see scripts/generate-docs.mjs). Nothing is registered by hand.
 * The API tab (?tab=api) shows the inputs, outputs, templates and tokens extracted from that version's base.
 * The Compositions tab (?tab=compositions) renders the version-N/compositions/<slug>/ folders the same way.
 */
@Component({
  selector: 'app-doc-page',
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    RouterLink,
    CodePanel,
    VersionPicker,
    StatusChip,
    DesignerBadge,
    DocApiView,
    DocTabs,
    DocApiToc,
    InlineCode,
  ],
  templateUrl: './doc-page.html',
  styleUrl: './doc-page.scss',
  // Read by the global [data-dep] rule of src/styles.scss: previews are other components' views.
  host: { '[class.doc-is-scanning]': 'scanning()' },
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
   * int-* components it depends on, for the "Dependencies" popover: `requires` (composed by the base)
   * and `uses` (only inside example templates), with the status of their latest version. A missing one
   * is not created yet; not done = a provisional marked `dep:<id> provisional` stands in for it.
   * `requires` applies to every tab; `uses` only lists the ones the examples of the open tab contain
   * (Variants: variants, Compositions: compositions), so a tab never hints at another tab's examples.
   */
  protected readonly dependencies = computed(() => {
    const { requires, uses: declared } = this.component();
    const compositions = this.nav.activeTab() === 'compositions';
    const used = usedDependencies(
      this.nav.activeVersion()?.exampleHtml,
      compositions ? this.component().compositions : this.component().variants,
    );
    const uses = declared.filter((id) => used.has(id));
    const toItem = (id: string) => {
      const dependency = this.catalog.find(id);
      return {
        id,
        name: dependency?.name ?? id,
        path: dependency?.path,
        status: dependency ? (dependency.versions.at(-1)?.status ?? 'pending') : undefined,
      };
    };
    const groups = [
      {
        kind: 'required',
        title: 'Requeridas',
        hint: 'Las compone la base: el componente no funciona sin ellas.',
        items: requires.map(toItem),
      },
      {
        kind: 'optional',
        title: 'Opcionales',
        hint: `Se usan dentro de los templates de ${compositions ? 'las composiciones' : 'las variantes'}; quien consume el componente decide.`,
        items: uses.map(toItem),
      },
    ].filter((group) => group.items.length > 0);
    return { groups, count: requires.length + uses.length };
  });

  /** Types the $implicit of the #sections template (variants or compositions). */
  protected asVariants(items: readonly CatalogVariant[]): readonly CatalogVariant[] {
    return items;
  }

  /** Entries of the API tab of the selected version (0 = still in template state: placeholder). */
  protected readonly apiCount = computed(() =>
    Object.values(this.nav.activeVersion()?.api ?? {}).reduce(
      (total, block) => total + block.length,
      0,
    ),
  );

  /** Sticky row of chips (version, variants, status, Figma, dependencies, designer). */
  private readonly meta = viewChild.required<ElementRef<HTMLElement>>('meta');

  /** The Dependencies popover is open (aria-expanded of its chip). */
  protected readonly dependenciesOpen = signal(false);

  /** "Scan dependencies": outlines every provisional (`[data-dep]`) in the previews and tags their sections. */
  protected readonly scanning = signal(false);

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

    // The chips row is sticky and its height changes (wrapping, version picker…): publish it as
    // --doc-meta-h so the variant heads stick right below it.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(([entry]) =>
        host.style.setProperty('--doc-meta-h', `${entry.borderBoxSize[0].blockSize}px`),
      );
      observer.observe(this.meta().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    effect(() => {
      if (this.examples.isLoading() || !this.examples.hasValue()) return;
      const variantId = untracked(() => this.nav.activeVariantId());
      if (variantId) afterNextRender(() => scroller.scrollToAnchor(variantId), { injector });
    });

    // A link to an example of the other tab (a composition from Variants, a variant from Compositions)
    // switches the tab: the router tried to scroll before that section existed, so scroll once the new
    // tab is rendered.
    let renderedTab = untracked(() => this.nav.activeTab());
    effect(() => {
      const tab = this.nav.activeTab();
      if (tab === renderedTab) return;
      renderedTab = tab;
      const variantId = untracked(() => this.nav.activeVariantId());
      if (variantId && this.examples.hasValue()) {
        afterNextRender(() => scroller.scrollToAnchor(variantId), { injector });
      }
    });

    // Scan: only the first provisional of each dependency per preview is outlined, with the total
    // (a list of 20 checkboxes or a table with a button per row shows one indicator, not 20). Previews
    // can re-render (pagination, filters…), so the marks are refreshed while scanning is on.
    effect((onCleanup) => {
      if (!this.scanning() || !this.examples.hasValue()) return;
      let frame = 0;
      const mark = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => markProvisionals(host));
      };
      const observer = new MutationObserver(mark);
      afterNextRender(
        () => {
          mark();
          observer.observe(host, { childList: true, subtree: true });
        },
        { injector },
      );
      onCleanup(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        clearProvisionalMarks(host);
      });
    });
  }
}

/** Attribute read by the global scan rule of src/styles.scss; its value is the label ("checkbox ×12"). */
const SCAN_MARK = 'data-dep-scan';

/** Marks the first [data-dep] of each dependency inside every preview, with how many there are. */
function markProvisionals(host: HTMLElement): void {
  for (const preview of host.querySelectorAll<HTMLElement>('.doc-preview')) {
    const byDep = new Map<string, HTMLElement[]>();
    for (const element of preview.querySelectorAll<HTMLElement>('[data-dep]')) {
      const dep = element.dataset['dep'] ?? '';
      byDep.set(dep, [...(byDep.get(dep) ?? []), element]);
    }
    for (const [dep, [first, ...rest]] of byDep) {
      const label = rest.length ? `${dep} ×${rest.length + 1}` : dep;
      if (first.getAttribute(SCAN_MARK) !== label) first.setAttribute(SCAN_MARK, label);
      for (const element of rest) element.removeAttribute(SCAN_MARK);
    }
  }
}

function clearProvisionalMarks(host: HTMLElement): void {
  for (const element of host.querySelectorAll(`[${SCAN_MARK}]`)) element.removeAttribute(SCAN_MARK);
}
