import { Component } from '@angular/core';

import { DocPage } from '../../core/doc-page/doc-page';

/**
 * Documentation page of "ToggleSwitch".
 * Sections come from <id>.config.ts + the version-N/variants/<slug>/ folders, which are detected
 * automatically: nothing is registered here. Optional intro content goes inside <app-doc-page>.
 */
@Component({
  selector: 'app-toggle-switch-page',
  imports: [DocPage],
  template: `<app-doc-page componentId="toggle-switch" />`,
})
export class ToggleSwitchPage {}
