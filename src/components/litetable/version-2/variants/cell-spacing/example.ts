import { Component } from '@angular/core';

import { IntLitetable, IntLitetableSpacing } from '../../base/litetable';

@Component({
  selector: 'litetable-cell-spacing-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableCellSpacingExample {
  readonly sizes: IntLitetableSpacing[] = ['small', 'medium', 'large'];

  readonly rows = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
  ];
}
