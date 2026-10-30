import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface Version {
  id: string;
  name: string;
  notes: string;
  date: string;
  latest: boolean;
}

const VERSIONS: readonly Version[] = [
  { id: 'v12', name: 'Version 12', notes: 'Initial threshold 1.0%, USD 22,000 penalty', date: '19 feb, 2026', latest: true },
  { id: 'v11', name: 'Version 11', notes: 'Initial threshold 1.5%, USD 18,000 penalty', date: '03 nov, 2025', latest: false },
];

@Component({
  selector: 'card-version-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardVersionExample {
  readonly versions = VERSIONS;
  readonly chosen = signal('v12');
}
