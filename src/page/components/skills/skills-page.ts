import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusChip } from '../../../core/status-chip/status-chip';
import { NavigationState } from '../../../service/navigation-state';
import { FolderDiagram } from './folder-diagram/folder-diagram';
import { SKILLS_PATH, SKILLS_SECTIONS } from './skills-sections';

/** /components/skills: how to create components, variants and versions with the Claude skills. */
@Component({
  selector: 'app-skills-page',
  imports: [RouterLink, StatusChip, FolderDiagram],
  templateUrl: './skills-page.html',
  styleUrl: './skills-page.scss',
})
export class SkillsPage {
  protected readonly path = SKILLS_PATH;
  protected readonly sections = SKILLS_SECTIONS;
  /** The #fragment marks the active section (the same one highlighted in the menu). */
  protected readonly nav = inject(NavigationState);
}
