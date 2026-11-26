import { Component } from '@angular/core';

import { IntLitetable, IntLitetableCellBackground } from '../../base/litetable';

@Component({
  selector: 'litetable-single-cell-background-example',
  templateUrl: './example.html',
  imports: [IntLitetable, IntLitetableCellBackground],
})
export class LitetableSingleCellBackgroundExample {
  readonly rows = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
  ];
}
