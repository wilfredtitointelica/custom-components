import { Component } from '@angular/core';

import { ComingSoon } from '../../core/coming-soon/coming-soon';

@Component({
  selector: 'app-interface-lab',
  imports: [ComingSoon],
  template: `<app-coming-soon title="Interface Lab" description="A space to experiment with interface patterns and compositions. Coming in a future release." />`,
})
export class InterfaceLabPage {}
