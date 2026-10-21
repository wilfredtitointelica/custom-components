export interface MainSection {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /** 'pending' sections are visible but only show their initial structure. */
  readonly status: 'available' | 'pending';
}

export const MAIN_SECTIONS: readonly MainSection[] = [
  { id: 'components', label: 'Components', path: '/components', status: 'available' },
  { id: 'prototypes', label: 'Prototypes', path: '/prototypes', status: 'pending' },
  { id: 'interface-lab', label: 'Interface Lab', path: '/interface-lab', status: 'pending' },
  { id: 'icon-lab', label: 'Icon Lab', path: '/icon-lab', status: 'pending' },
];
