import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatusChip } from '../../../core/status-chip/status-chip';
import { GUIDE_PATH, GUIDE_SECTIONS } from './guide-sections';

/** /components/guide: how to create components, variants and versions with the Claude skills. */
@Component({
  selector: 'app-components-guide',
  imports: [RouterLink, StatusChip],
  templateUrl: './components-guide.html',
  styleUrl: './components-guide.scss',
})
export class ComponentsGuide {
  protected readonly path = GUIDE_PATH;
  protected readonly sections = GUIDE_SECTIONS;
}
