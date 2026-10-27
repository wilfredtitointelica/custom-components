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
  /** Dependencies still provisional in example.html (`data-dep="<id>"` of the provisional element). */
  readonly provisionalDeps: readonly string[];
}

/** `data-dep="<id>"`: root element of a provisional marked `dep:<id> provisional` (skill replicar-primeng). */
const PROVISIONAL_DEP = /\bdata-dep="([a-z0-9-]+)"/g;

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
  const provisionalDeps = [...new Set([...(sources.html ?? '').matchAll(PROVISIONAL_DEP)].map((m) => m[1]))];
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
 */
@Component({
  selector: 'app-doc-page',
  imports: [NgComponentOutlet, RouterLink, CodePanel, VersionPicker, StatusChip, DesignerBadge],
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
   * and `uses` (only inside variant templates), with the status of their latest version. A missing one
   * is not created yet; not done = a provisional marked `dep:<id> provisional` stands in for it.
   */
  protected readonly dependencies = computed(() => {
    const { requires, uses, variants } = this.component();
    const examples = this.examples.value();
    const toItem = (id: string) => {
      const dependency = this.catalog.find(id);
      return {
        id,
        name: dependency?.name ?? id,
        path: dependency?.path,
        status: dependency ? (dependency.versions.at(-1)?.status ?? 'pending') : undefined,
        /** Variants of the selected version whose example.html still has a provisional for it. */
        usedIn: variants.filter((v) => examples?.get(v.slug)?.provisionalDeps.includes(id)),
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
        hint: 'Se usan dentro de los templates de las variantes; quien consume el componente decide.',
        items: uses.map(toItem),
      },
    ].filter((group) => group.items.length > 0);
    return { groups, count: requires.length + uses.length };
  });

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
  }
}
