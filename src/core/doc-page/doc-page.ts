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
import { DocTab, NavigationState } from '../../service/navigation-state';
import { DocApiView } from './doc-api';
import { DocApiToc } from './doc-api-toc';
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
 * `intButton`, `[intTooltip]`: an int-* component applied as an attribute (`button[intButton]`,
 * `input[intInputText]`, `[intTooltip]`). Its name is the id without dashes, lowercased ("inputtext").
 */
const INT_ATTRIBUTE = /[\s[]int([A-Z][A-Za-z0-9]*)\b/g;

/** Ids an example template uses as a tag (`button`) and as an attribute, normalized (`inputtext`). */
function intComponentsIn(html: string): Set<string> {
  return new Set([
    ...[...html.matchAll(INT_TAG)].map((m) => m[1]),
    ...[...html.matchAll(INT_ATTRIBUTE)].map((m) => m[1].toLowerCase()),
  ]);
}

/** The template uses the component `id`, as a tag (`<int-treeselect>`) or an attribute (`intTreeselect`). */
function usesComponent(found: ReadonlySet<string>, id: string): boolean {
  return found.has(id) || found.has(id.replace(/-/g, ''));
}

/**
 * IDs of the int-* components the given examples contain, real (`<int-button>`, `<button intButton>`) or
 * provisional (`data-dep="button"`), read from their example.html of the selected version. `provisional`
 * keeps the ones still waiting for their dependency.
 */
function usedDependencies(
  exampleHtml: Readonly<Record<string, string>> | undefined,
  examples: readonly CatalogVariant[],
): { all: ReadonlySet<string>; provisional: ReadonlySet<string> } {
  const html = examples.map((example) => exampleHtml?.[example.slug] ?? '').join('\n');
  const provisional = new Set([...html.matchAll(PROVISIONAL_DEP)].map((m) => m[1]));
  return { all: new Set([...provisional, ...intComponentsIn(html)]), provisional };
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
   * A dependency is pending (fuchsia) while it is not created, not done or still provisional in the
   * examples; otherwise it is resolved (green). `state` is pending as soon as one of them is.
   */
  protected readonly dependencies = computed(() => {
    const { requires, uses: declared } = this.component();
    const compositions = this.nav.activeTab() === 'compositions';
    const used = usedDependencies(
      this.nav.activeVersion()?.exampleHtml,
      compositions ? this.component().compositions : this.component().variants,
    );
    const uses = declared.filter((id) => usesComponent(used.all, id));
    // Provisionals of the base (dep:<id> provisional in base/ and styles/) count on every tab: the base
    // renders them in every example, even when the dependency itself is already done.
    const baseProvisionals = new Set(this.nav.activeVersion()?.baseProvisionals ?? []);
    const toItem = (id: string) => {
      const dependency = this.catalog.find(id);
      const status = dependency ? (dependency.versions.at(-1)?.status ?? 'pending') : undefined;
      const provisional = baseProvisionals.has(id) || used.provisional.has(id);
      return {
        id,
        name: dependency?.name ?? id,
        path: dependency?.path,
        status,
        /** Done, but a provisional still stands in for it: pending until it is replaced. */
        provisional: status === 'done' && provisional,
        pending: status !== 'done' || provisional,
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
    const items = groups.flatMap((group) => group.items);
    return {
      groups,
      /** Every dependency the component declares: the only ones the scan marks. */
      ids: [...requires, ...declared],
      count: requires.length + uses.length,
      state: items.some((item) => item.pending) ? ('pending' as const) : ('resolved' as const),
      resolvedIds: items.filter((item) => !item.pending).map((item) => item.id),
    };
  });

  /**
   * Resolved dependencies an example uses as a real int-* (`<int-button>` or `<button intButton>`): the
   * "Resueltas" line while scanning.
   */
  protected resolvedIn(example: DocExample | undefined): string[] {
    const found = intComponentsIn(example?.sources.html ?? '');
    return this.dependencies().resolvedIds.filter((id) => usesComponent(found, id));
  }

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

  /** Suffix of the page title for each tab: "Card" (Variants), "Card API", "Card Compositions". */
  protected readonly tabTitle: Readonly<Record<DocTab, string>> = {
    variants: '',
    api: 'API',
    compositions: 'Compositions',
  };

  /**
   * Description under the title for the open tab: description-variants|api|compositions: of the selected
   * version's header. Variants falls back to description:, API and Compositions to a generic text.
   */
  protected readonly tabDescription = computed(() => {
    const current = this.component();
    const version = this.nav.activeVersion();
    const name = version?.title ?? current.name;
    switch (this.nav.activeTab()) {
      case 'api':
        return (
          version?.descriptionApi ??
          `La API define las propiedades, eventos, templates y tokens CSS del componente ${name}.`
        );
      case 'compositions':
        return (
          version?.descriptionCompositions ??
          `Las composiciones son casos de uso reales armados con la API de ${name} y los helpers \`u-*\`.`
        );
      default:
        return version?.descriptionVariants ?? version?.description ?? current.description;
    }
  });

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

    // The variant heads stick below the chips row too: publish their height as --doc-section-head-h, so an
    // example can stick a int-* below the whole stack (treetable stickyTop). All heads are the same
    // height; the first one is measured once the examples are rendered. Switching tabs destroys the heads
    // and renders new ones, so the effect also tracks the tab: otherwise it keeps observing a detached head,
    // which reports 0px, and the sticky int-* ends up under the variant head.
    let headObserver: ResizeObserver | undefined;
    destroyRef.onDestroy(() => headObserver?.disconnect());
    effect(() => {
      this.nav.activeTab();
      if (!this.examples.hasValue()) return;
      afterNextRender(
        () => {
          const head = host.querySelector<HTMLElement>('.doc-section-head');
          if (!head) return;
          headObserver?.disconnect();
          headObserver = new ResizeObserver(([entry]) => {
            const height = entry.borderBoxSize[0].blockSize;
            // A head that leaves the DOM reports 0px: keep the last real height.
            if (height > 0) host.style.setProperty('--doc-section-head-h', `${height}px`);
          });
          headObserver.observe(head);
        },
        { injector },
      );
    });

    // A variant head only gets its background (and z-index) while it is stuck: at rest it stays
    // transparent and below the previous preview, so an open overlay (select, datepicker…) is not cut.
    // It is stuck once its section's top has scrolled above the head's sticky offset.
    afterNextRender(() => {
      let frame = 0;
      const update = (): void => {
        frame = 0;
        for (const head of host.querySelectorAll<HTMLElement>('.doc-section-head')) {
          const top = parseFloat(getComputedStyle(head).top) || 0;
          const sectionTop = head.parentElement?.getBoundingClientRect().top ?? 0;
          head.classList.toggle('doc-is-stuck', sectionTop < top - 0.5);
        }
      };
      const schedule = (): void => {
        frame ||= requestAnimationFrame(update);
      };
      document.addEventListener('scroll', schedule, { capture: true, passive: true });
      destroyRef.onDestroy(() => {
        document.removeEventListener('scroll', schedule, { capture: true });
        cancelAnimationFrame(frame);
      });
    });
    effect(() => {
      if (this.examples.isLoading() || !this.examples.hasValue()) return;
      const variantId = untracked(() => this.nav.activeVariantId());
      if (variantId) afterNextRender(() => scroller.scrollToAnchor(variantId), { injector });
    });

    // A link to an example of the other tab (a composition from Variants, a variant from Compositions)
    // switches the tab: the router tried to scroll before that section existed, so scroll once the new
    // tab is rendered. Any other tab switch (the top bar tabs) starts the new tab from the top of the
    // page, with the title in view, whatever the old tab's scroll left.
    let renderedTab = untracked(() => this.nav.activeTab());
    effect(() => {
      const tab = this.nav.activeTab();
      if (tab === renderedTab) return;
      renderedTab = tab;
      const variantId = untracked(() => this.nav.activeVariantId());
      if (variantId) {
        if (this.examples.hasValue()) afterNextRender(() => scroller.scrollToAnchor(variantId), { injector });
      } else {
        afterNextRender(() => scroller.scrollToPosition([0, 0], { behavior: 'instant' }), { injector });
      }
    });

    // Scan: only the first provisional (fuchsia) or real int-* of a resolved dependency (green) per
    // preview is outlined, with the total (a list of 20 checkboxes or a table with a button per row shows
    // one indicator, not 20). Previews can re-render (pagination, filters…), so the marks are refreshed
    // while scanning is on.
    effect((onCleanup) => {
      if (!this.scanning() || !this.examples.hasValue()) return;
      const { resolvedIds: resolved, ids: declared } = this.dependencies();
      let frame = 0;
      const mark = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => markDependencies(host, resolved, declared));
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
        clearDependencyMarks(host);
      });
    });
  }
}

/**
 * Attributes read by the global scan rules of src/styles.scss; their value is the label ("checkbox ×12"):
 * a provisional still waiting (fuchsia) and a real int-* of a resolved dependency (green).
 */
const SCAN_MARK = 'data-dep-scan';
const DONE_MARK = 'data-dep-done';
/** Set on a marked element that already has its own position (fixed, absolute…), so the scan keeps it. */
const POSITIONED_MARK = 'data-dep-positioned';
/**
 * Set on a marked element that clips its own content (a label truncated with an ellipsis): it stays static
 * and the label is anchored to it from outside, so its overflow does not cut the label.
 */
const CLIPPED_MARK = 'data-dep-clipped';
/**
 * Outline without label ("scan" | "done") on the other elements of the dependency in its first table
 * row: a button repeated per row shows up once, in the first row, instead of in every row.
 */
const ROW_MARK = 'data-dep-row';

/**
 * Marks the first element of a dependency with how many there are, outlines the others in its first
 * table row and clears the mark from the rest.
 */
function markFirst(attribute: string, dep: string, [first, ...rest]: HTMLElement[]): void {
  if (!first) return;
  const row = [first, ...rest].map((element) => element.closest('tbody tr')).find(Boolean);
  const kind = attribute === SCAN_MARK ? 'scan' : 'done';
  for (const element of rest) {
    if (row && element.closest('tbody tr') === row) element.setAttribute(ROW_MARK, kind);
    else if (element.getAttribute(ROW_MARK) === kind) element.removeAttribute(ROW_MARK);
  }
  const label = rest.length ? `${dep} ×${rest.length + 1}` : dep;
  if (first.getAttribute(attribute) !== label) {
    // Read before marking: once marked, the scan rule would make a static element relative.
    if (!first.hasAttribute(SCAN_MARK) && !first.hasAttribute(DONE_MARK)) {
      const style = getComputedStyle(first);
      first.toggleAttribute(POSITIONED_MARK, style.position !== 'static');
      first.toggleAttribute(CLIPPED_MARK, style.overflowX !== 'visible' || style.overflowY !== 'visible');
    }
    first.setAttribute(attribute, label);
  }
  for (const element of rest) element.removeAttribute(attribute);
}

/**
 * Real instances of the int-* `id` inside a preview: its tag (`<int-button>`), the element it is applied
 * to as an attribute, found by its host class (`<button intButton>` → `.int-button`) or by its host
 * marker (`[intTooltip]` → `[data-int-tooltip]`, when it adds no class). The element a `<int-<id>>`
 * renders inside itself (`<int-button>` → `<button class="int-button">`) is the same instance, not another one.
 */
function instancesOf(preview: HTMLElement, id: string): HTMLElement[] {
  return [
    ...preview.querySelectorAll<HTMLElement>(`int-${id}, .int-${id}, [data-int-${id}]`),
  ].filter((element) => !element.parentElement?.closest(`int-${id}`));
}

/**
 * Inside every preview, marks the first [data-dep] of each pending dependency and the first real
 * instance (tag or attribute, see instancesOf) of each resolved one. The page's own component is never a dependency, so it is never marked; neither are
 * the provisionals inside another int-* it uses (its own dependencies, e.g. dep:input inside <int-search>):
 * only the ids the page's component declares in requires / uses count.
 */
function markDependencies(host: HTMLElement, resolved: readonly string[], declared: readonly string[]): void {
  for (const preview of host.querySelectorAll<HTMLElement>('.doc-preview')) {
    const byDep = new Map<string, HTMLElement[]>();
    for (const element of preview.querySelectorAll<HTMLElement>('[data-dep]')) {
      const dep = element.dataset['dep'] ?? '';
      if (!declared.includes(dep)) {
        element.removeAttribute(SCAN_MARK);
        continue;
      }
      byDep.set(dep, [...(byDep.get(dep) ?? []), element]);
    }
    for (const [dep, elements] of byDep) markFirst(SCAN_MARK, dep, elements);
    for (const id of resolved) {
      markFirst(DONE_MARK, id, instancesOf(preview, id));
    }
  }
}

function clearDependencyMarks(host: HTMLElement): void {
  for (const element of host.querySelectorAll(`[${SCAN_MARK}], [${DONE_MARK}], [${ROW_MARK}]`)) {
    element.removeAttribute(SCAN_MARK);
    element.removeAttribute(DONE_MARK);
    element.removeAttribute(POSITIONED_MARK);
    element.removeAttribute(CLIPPED_MARK);
    element.removeAttribute(ROW_MARK);
  }
}
