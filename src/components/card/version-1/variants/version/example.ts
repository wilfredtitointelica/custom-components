import { Component, signal } from '@angular/core';

import { IntCard } from '../../base/card';

interface Version {
  id: string;
  name: string;
  date: string;
  notes: string;
}

const VERSIONS: readonly Version[] = [
  { id: 'v3', name: 'Version 3', date: 'Jan 2026', notes: 'New fee categories and monthly summary.' },
  { id: 'v2', name: 'Version 2', date: 'Jul 2025', notes: 'Regional breakdown of interchange.' },
  { id: 'v1', name: 'Version 1', date: 'Jan 2025', notes: 'First release of the report.' },
];

@Component({
  selector: 'card-version-example',
  templateUrl: './example.html',
  imports: [IntCard],
})
export class CardVersionExample {
  readonly versions = VERSIONS;
  readonly chosen = signal('v3');
}
