import { Component } from '@angular/core';

import { DocPage } from '../../core/doc-page/doc-page';

/**
 * Documentation page of "ListBox".
 * Fill each variant inside <app-doc-page> with:
 *   <ng-template docVariant="<variant-id>"> …preview… </ng-template>
 *   <ng-template docCode="<variant-id>" docCodeLang="html|ts"> …code… </ng-template>
 * (import DocVariant / DocCode from core/doc-page/doc-slots). Variant IDs come from the inventory.
 */
@Component({
  selector: 'app-list-box-page',
  imports: [DocPage],
  template: `<app-doc-page componentId="list-box" />`,
})
export class ListBoxPage {}
