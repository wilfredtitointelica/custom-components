import { Component } from '@angular/core';

import { IntButton } from '../../base/button';

@Component({
  selector: 'button-severities-example',
  templateUrl: './example.html',
  imports: [IntButton],
})
export class ButtonSeveritiesExample {
  readonly severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const;
}
