import { Component } from '@angular/core';

import { IntTabValue, IntTabsImports } from '../../base/tabs';

@Component({
  selector: 'tabs-basic-example',
  templateUrl: './example.html',
  imports: [IntTabsImports],
})
export class TabsBasicExample {
  tab: IntTabValue | null = 'summary';
}
