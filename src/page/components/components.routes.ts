import { Routes } from '@angular/router';

import { APP_TITLE, buildComponentRoutes, redirectAnchorAlias, variantPathAlias } from '../../service/component-routes';
import { ComponentsPage } from './components-page';
import { ComponentsOverview } from './overview/components-overview';

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
      ...buildComponentRoutes(),
      variantPathAlias,
    ],
  },
] satisfies Routes;
