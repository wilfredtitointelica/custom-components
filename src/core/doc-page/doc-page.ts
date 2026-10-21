import { Component, computed, contentChildren, effect, inject, input, isDevMode, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CodeLanguage } from '../../service/catalog.model';
import { CodeVisibility } from '../../service/code-visibility';
import { ComponentCatalog } from '../../service/component-catalog';
import { NavigationState } from '../../service/navigation-state';
import { CodePanel } from '../toggle-code/code-panel';
import { DocCode, DocVariant } from './doc-slots';

/**
 * Documentation layout shared by every component page. Renders one anchored section per
 * inventory variant; authors fill sections through DocVariant / DocCode templates.
 */
@Component({
  selector: 'app-doc-page',
  imports: [NgTemplateOutlet, RouterLink, CodePanel],
  templateUrl: './doc-page.html',
  styleUrl: './doc-page.scss',
})
export class DocPage {
  readonly componentId = input.required<string>();

  private readonly catalog = inject(ComponentCatalog);
  protected readonly nav = inject(NavigationState);
  protected readonly code = inject(CodeVisibility);

  private readonly variantSlots = contentChildren(DocVariant);
  private readonly codeSlots = contentChildren(DocCode);

  protected readonly component = computed(() => {
    const component = this.catalog.find(this.componentId());
    if (!component) throw new Error(`[doc-page] "${this.componentId()}" is not in the component inventory.`);
    return component;
  });

  protected readonly previews = computed(
    () => new Map(this.variantSlots().map((slot) => [slot.variantId(), slot.template])),
  );

  protected readonly snippets = computed(() => {
    const byVariant = new Map<string, Map<CodeLanguage, TemplateRef<unknown>>>();
    for (const slot of this.codeSlots()) {
      const languages = byVariant.get(slot.variantId()) ?? new Map();
      byVariant.set(slot.variantId(), languages.set(slot.language(), slot.template));
    }
    return byVariant;
  });

  constructor() {
    if (isDevMode()) {
      effect(() => {
        const known = new Set(this.component().variants.map((v) => v.id));
        const used = [...this.variantSlots(), ...this.codeSlots()].map((slot) => slot.variantId());
        for (const id of used.filter((id) => !known.has(id))) {
          console.warn(`[doc-page] Slot "${id}" does not match any variant of "${this.componentId()}".`);
        }
      });
    }
  }
}
