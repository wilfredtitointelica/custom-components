export interface MainSection {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /** primeicons class shown in the navigation rail. */
  readonly icon: string;
  /** 'pending' sections are visible but only show their initial structure. */
  readonly status: 'available' | 'pending';
  readonly description: string;
}

export const MAIN_SECTIONS: readonly MainSection[] = [
  {
    id: 'components',
    label: 'Components',
    path: '/components',
    icon: 'pi-th-large',
    status: 'available',
    description: 'Reusable UI components with their variants, usage and code.',
  },
  {
    id: 'prototypes',
    label: 'Prototypes',
    path: '/prototypes',
    icon: 'pi-desktop',
    status: 'pending',
    description: 'Interactive prototypes built with the component library.',
  },
  {
    id: 'interface-lab',
    label: 'Interface Lab',
    path: '/interface-lab',
    icon: 'pi-sliders-h',
    status: 'pending',
    description: 'A space to experiment with interface patterns and compositions.',
  },
  {
    id: 'icon-lab',
    label: 'Icon Lab',
    path: '/icon-lab',
    icon: 'pi-images',
    status: 'pending',
    description: 'The icon catalog of the design system.',
  },
];
