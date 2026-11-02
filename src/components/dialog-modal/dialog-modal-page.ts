import { Component } from '@angular/core';

import { DocPage } from '../../core/doc-page/doc-page';

/**
 * Documentation page of "Dialog (Modal)".
 * Sections come from <id>.config.ts + the version-N/variants/<slug>/ folders, which are detected
 * automatically: nothing is registered here. Optional intro content goes inside <app-doc-page>.
 */
@Component({
  selector: 'app-dialog-modal-page',
  imports: [DocPage],
  template: `<app-doc-page componentId="dialog-modal" />`,
})
export class DialogModalPage {}
