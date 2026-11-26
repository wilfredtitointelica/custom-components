import { Component } from '@angular/core';

import { IntLitetable, IntLitetableColumn } from '../../base/litetable';

@Component({
  selector: 'litetable-full-first-column-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableFullFirstColumnExample {
  readonly columns: IntLitetableColumn[] = [
    { field: 'label', header: 'January 25' },
    { field: 'value', header: '60K' },
  ];

  readonly rows = [
    { label: 'Issuer', value: '20K' },
    { label: 'Acquirer', value: '25K' },
    { label: 'Network', value: '15K' },
  ];
}
