import { Component } from '@angular/core';

import { ComingSoon } from '../../core/coming-soon/coming-soon';

@Component({
  selector: 'app-prototypes',
  imports: [ComingSoon],
  template: `<app-coming-soon title="Prototypes" description="Interactive prototypes built with the component library will be published here." />`,
})
export class PrototypesPage {}
