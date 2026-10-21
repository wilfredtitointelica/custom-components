import { Routes } from '@angular/router';

import { NotFound } from '../core/not-found/not-found';
import { APP_TITLE } from '../service/component-routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'components' },
  { path: 'components', loadChildren: () => import('../page/components/components.routes') },
  {
    path: 'prototypes',
    title: `Prototypes · ${APP_TITLE}`,
    loadComponent: () => import('../page/prototypes/prototypes').then((m) => m.PrototypesPage),
  },
  {
    path: 'interface-lab',
    title: `Interface Lab · ${APP_TITLE}`,
    loadComponent: () => import('../page/interface-lab/interface-lab').then((m) => m.InterfaceLabPage),
  },
  {
    path: 'icon-lab',
    title: `Icon Lab · ${APP_TITLE}`,
    loadComponent: () => import('../page/icon-lab/icon-lab').then((m) => m.IconLabPage),
  },
  { path: '**', title: `Not found · ${APP_TITLE}`, component: NotFound },
];
