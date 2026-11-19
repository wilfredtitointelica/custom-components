export interface MainSection {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /** Incontrol icon class (icon-*) shown in the navigation rail. */
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
    icon: 'icon-dashboard-01',
    status: 'available',
    description: 'Componentes de UI reutilizables con sus variantes, uso y código.',
  },
  {
    id: 'prototypes',
    label: 'Prototypes',
    path: '/prototypes',
    icon: 'icon-computer',
    status: 'pending',
    description: 'Prototipos interactivos construidos con la librería de componentes.',
  },
  {
    id: 'interface-lab',
    label: 'Interface Lab',
    path: '/interface-lab',
    icon: 'icon-filter',
    status: 'pending',
    description: 'Un espacio para experimentar con patrones y composiciones de interfaz.',
  },
  {
    id: 'icon-lab',
    label: 'Icon Lab',
    path: '/icon-lab',
    icon: 'icon-image',
    status: 'available',
    description: 'El catálogo de íconos del sistema de diseño.',
  },
];
