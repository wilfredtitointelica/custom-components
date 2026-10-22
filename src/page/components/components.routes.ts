import { Routes } from '@angular/router';

import { APP_TITLE, buildComponentRoutes, redirectAnchorAlias, variantPathAlias } from '../../service/component-routes';
import { CatalogPage } from './catalog/catalog-page';
import { ComponentsPage } from './components-page';
import { SKILLS_SEGMENT } from './skills/skills-sections';
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
        component: CatalogPage,
        canActivate: [redirectAnchorAlias],
        runGuardsAndResolvers: 'always',
      },
      {
        path: SKILLS_SEGMENT,
        title: `Guía de uso · ${APP_TITLE}`,
        loadComponent: () => import('./skills/skills-page').then((m) => m.SkillsPage),
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
