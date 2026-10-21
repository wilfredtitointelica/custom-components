import { Component } from '@angular/core';

import { ComingSoon } from '../../core/coming-soon/coming-soon';

@Component({
  selector: 'app-icon-lab',
  imports: [ComingSoon],
  template: `<app-coming-soon title="Icon Lab" description="The icon catalog of the design system will be available here." />`,
})
export class IconLabPage {}
