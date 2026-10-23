import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  filterIcons,
  FOUNDATION_SECTIONS,
  ICON_CATEGORIES,
  ICON_LAB_PATH,
  ICON_TOTAL,
  IconResults,
  splitMatches,
  TextPart,
} from '../icon-sections';

/** Time the copied card stays green with its "Copiado" tip. */
const COPIED_MS = 1600;

/**
 * Content of the Icon Lab: hero, sizes, brands and one section per category of icon-categories.json
 * (edit that file to add, move or remove icons). Clicking a card copies its class name.
 */
@Component({
  selector: 'app-icon-gallery',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './icon-gallery.html',
  styleUrl: './icon-gallery.scss',
})
export class IconGallery {
  /** Slug of the active section (URL #fragment): its title is painted with the accent. */
  readonly active = input<string | null>(null);
  /** Sections and icons left by the search of the top bar (everything when it is empty). */
  readonly results = input<IconResults>(filterIcons(''));
  /** Search text, to highlight it. */
  readonly query = input('');

  protected readonly path = ICON_LAB_PATH;
  protected readonly foundations = FOUNDATION_SECTIONS;
  protected readonly categoryCount = ICON_CATEGORIES.length;
  protected readonly total = ICON_TOTAL;

  protected parts(text: string): readonly TextPart[] {
    return splitMatches(text, this.query());
  }

  /** Name copied last, while its confirmation is shown. */
  protected readonly copied = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected async copy(name: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      return; // Clipboard blocked (insecure context or denied permission): no confirmation.
    }
    clearTimeout(this.timer);
    this.copied.set(name);
    this.timer = setTimeout(() => this.copied.set(null), COPIED_MS);
  }
}
