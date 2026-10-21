import { Routes } from '@angular/router';

import { APP_TITLE, buildComponentRoutes, redirectAnchorAlias, variantPathAlias } from '../../service/component-routes';
import { ComponentsPage } from './components-page';
import { GUIDE_SEGMENT } from './guide/guide-sections';
import { ComponentsOverview } from './overview/components-overview';
import { STATUS_SEGMENT } from './status/status-route';

export default [
  {
    path: '',
    component: ComponentsPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: `Components · ${APP_TITLE}`,
        component: ComponentsOverview,
        canActivate: [redirectAnchorAlias],
        runGuardsAndResolvers: 'always',
      },
      {
        path: GUIDE_SEGMENT,
        title: `Guía de uso · ${APP_TITLE}`,
        loadComponent: () => import('./guide/components-guide').then((m) => m.ComponentsGuide),
      },
      {
        path: STATUS_SEGMENT,
        title: `Avance de componentes · ${APP_TITLE}`,
        loadComponent: () => import('./status/status-page').then((m) => m.StatusPage),
      },
      ...buildComponentRoutes(),
      variantPathAlias,
    ],
  },
] satisfies Routes;
