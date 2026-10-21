import { Directive, inject, input, TemplateRef } from '@angular/core';

import { CodeLanguage } from '../../service/catalog.model';

/**
 * Content slot for one variant's preview, used inside <app-doc-page>:
 *   <ng-template docVariant="button-basic"> …examples… </ng-template>
 */
@Directive({ selector: 'ng-template[docVariant]' })
export class DocVariant {
  readonly variantId = input.required<string>({ alias: 'docVariant' });
  readonly template = inject(TemplateRef);
}

/**
 * Code slot for one variant, shown in its code panel:
 *   <ng-template docCode="button-basic" docCodeLang="ts"> <pre>…</pre> </ng-template>
 */
@Directive({ selector: 'ng-template[docCode]' })
export class DocCode {
  readonly variantId = input.required<string>({ alias: 'docCode' });
  readonly language = input<CodeLanguage>('html', { alias: 'docCodeLang' });
  readonly template = inject(TemplateRef);
}
