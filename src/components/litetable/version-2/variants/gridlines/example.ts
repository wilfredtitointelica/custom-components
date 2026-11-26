import { Component } from '@angular/core';

import { IntLitetable } from '../../base/litetable';

@Component({
  selector: 'litetable-gridlines-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableGridlinesExample {
  readonly rows = [
    { category: 'Issuer', transactions: '1,240', total: '20K' },
    { category: 'Acquirer', transactions: '980', total: '25K' },
    { category: 'Network', transactions: '310', total: '15K' },
  ];
}
