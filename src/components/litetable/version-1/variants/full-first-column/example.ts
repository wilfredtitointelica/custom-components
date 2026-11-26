import { Component } from '@angular/core';

import { IntLitetable } from '../../base/litetable';

@Component({
  selector: 'litetable-full-first-column-example',
  templateUrl: './example.html',
  imports: [IntLitetable],
})
export class LitetableFullFirstColumnExample {
  readonly rows = [
    { label: 'Issuer', value: '20K' },
    { label: 'Acquirer', value: '25K' },
    { label: 'Network', value: '15K' },
  ];
}
