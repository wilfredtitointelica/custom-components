import {
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, PRIMARY_OUTLET, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { ComponentCatalog } from '../../../service/component-catalog';
import { groupComponents } from '../catalog/catalog-groups';
import { NavigationState } from '../../../service/navigation-state';
import { SKILL_GROUP_LABELS, SKILLS_PATH, SKILLS_SECTIONS, SKILLS_SEGMENT } from '../skills/skills-sections';
import { STATUS_PATH, STATUS_SEGMENT } from '../status/status-route';

/** Nearest ancestor that scrolls vertically (the drawer), or null. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return null;
}

/** Side menu: one expandable entry per inventory component. */
@Component({
  selector: 'app-component-nav',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './component-nav.html',
  styleUrl: './component-nav.scss',
})
export class ComponentNav {
  /** Emitted after following a link (used to close the drawer on small screens). */
  readonly navigated = output<void>();

  private readonly catalog = inject(ComponentCatalog).components;
  /** Reference implementations (_demo_), pinned above the divider together with the Skills page. */
  protected readonly references = this.catalog.filter((c) => c.reference);
  protected readonly components = this.catalog.filter((c) => !c.reference);
  /** Same categories as the gallery (/components/catalog), in the same order. */
  protected readonly groups = groupComponents(this.components);
  protected readonly nav = inject(NavigationState);
  /** Skills page (usage guide), pinned first under "Reference", before the reference implementations. */
  protected readonly skills = {
    key: '__skills__',
    segment: SKILLS_SEGMENT,
    path: SKILLS_PATH,
    // separator: null inside a group; at the first item of a new group, its label ('' = line only).
    sections: SKILLS_SECTIONS.map((section, i) => ({
      ...section,
      separator:
        i > 0 && section.group !== SKILLS_SECTIONS[i - 1].group ? SKILL_GROUP_LABELS[section.group] : null,
    })),
  };
  /** Progress page, pinned last under "Reference". */
  protected readonly status = { segment: STATUS_SEGMENT, path: STATUS_PATH };

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());
  /** Categories the user opened; every category starts collapsed (the open component's one opens itself). */
  private readonly openGroups = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Keep the open component expanded and visible in the drawer (click, direct URL, reload,
    // shared link, search): the drawer scrolls on its own, so it would otherwise start at the top.
    effect(() => {
      const componentId =
        this.nav.componentId() ?? (this.nav.page() === SKILLS_SEGMENT ? this.skills.key : null);
      if (!componentId) return;
      untracked(() => {
        this.setExpanded(componentId, true);
        // The open component is never hidden inside a collapsed category.
        const group = this.groups.find((g) => g.items.some((c) => c.id === componentId));
        if (group && !this.isGroupOpen(group.name)) this.toggleGroup(group.name);
      });
      afterNextRender(() => this.revealCurrent(), { injector: this.injector });
    });

    // Landing on the catalog (/components: the rail "Components" button or the breadcrumb, also when it
    // is already open, since the router reloads same-URL navigations) collapses every category and entry.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const segments =
          this.router.parseUrl(event.urlAfterRedirects).root.children[PRIMARY_OUTLET]?.segments ?? [];
        if (segments.length === 1 && segments[0].path === 'components') {
          this.openGroups.set(new Set());
          this.expanded.set(new Set());
        }
      });
  }

  protected isGroupOpen(name: string): boolean {
    return this.openGroups().has(name);
  }

  protected toggleGroup(name: string): void {
    this.openGroups.update((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  protected isExpanded(componentId: string): boolean {
    return this.expanded().has(componentId);
  }

  /**
   * Click on an entry's name: on another entry it navigates, leaving only that entry expanded, and
   * the drawer closes; on the open one it collapses / expands it, like the arrow, and keeps the
   * drawer open. The arrow and the variant links never collapse the other entries.
   */
  protected itemClicked(componentId: string, current: boolean): void {
    if (current) {
      this.toggle(componentId);
      return;
    }
    this.expanded.set(new Set([componentId]));
    this.navigated.emit();
  }

  /** Click on an entry without sub-items (Status): collapses every other entry. */
  protected leafClicked(): void {
    this.expanded.set(new Set());
    this.navigated.emit();
  }

  protected toggle(componentId: string): void {
    this.setExpanded(componentId, !this.isExpanded(componentId));
  }

  private setExpanded(componentId: string, open: boolean): void {
    this.expanded.update((current) => {
      if (current.has(componentId) === open) return current;
      const next = new Set(current);
      if (open) next.add(componentId);
      else next.delete(componentId);
      return next;
    });
  }

  /**
   * Scrolls the drawer (not the page) so the open component and its variants are visible.
   * Does nothing when it is already in view, so clicking in the menu never makes it jump.
   */
  private revealCurrent(): void {
    const row = this.host.nativeElement.querySelector<HTMLElement>('.doc-nav-row.doc-is-current');
    const item = row?.closest<HTMLElement>('.doc-nav-item');
    const drawer = item && scrollParent(item);
    if (!row || !item || !drawer) return;

    const view = drawer.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    // The variant list may still be animating open: use its final height, not the current one.
    const listHeight = item.querySelector('.doc-variant-list')?.scrollHeight ?? 0;
    if (rowBox.top >= view.top && rowBox.bottom + listHeight <= view.bottom) return;

    // Row near the top, leaving room below for its variant list.
    drawer.scrollTop += rowBox.top - view.top - Math.min(view.height / 4, 120);
  }
}
