import { inject } from '@angular/core';
import { CanActivateFn, Route, Router, Routes, UrlMatcher } from '@angular/router';

import { CatalogComponent } from './catalog.model';
import { CATALOG, findComponent, findVariant, findVariantInComponent } from './component-catalog';

/*
 * URL strategy
 *  - Route  /components/<componentId>            → documentation page of a component (lazy module).
 *  - Anchor /components/<componentId>#<variantId> → canonical link to a variant inside that page.
 *  Aliases, redirected to the canonical form:
 *  - /components#<variantId>                     (short shareable link)
 *  - /components/<componentId>/<variantSlug|variantId>
 *  Routes declared by a component's own routes.ts (e.g. /components/button/playground) win over
 *  the alias, because the alias route is registered after every component module.
 */

export const APP_TITLE = 'Intelica Components';

/** Mounts every component's routes.ts under /components/<id>. Adding a component = one inventory row. */
export function buildComponentRoutes(components: readonly CatalogComponent[] = CATALOG): Routes {
  return components.map((component) => ({
    path: component.id,
    title: `${component.name} · ${APP_TITLE}`,
    loadChildren: component.loadRoutes,
  }));
}

const variantPathMatcher: UrlMatcher = (segments) => {
  if (segments.length !== 2) return null;
  return findVariantInComponent(segments[0].path, segments[1].path) ? { consumed: segments } : null;
};

/** /components/<componentId>/<variant> → /components/<componentId>#<variantId>. */
export const variantPathAlias: Route = {
  matcher: variantPathMatcher,
  redirectTo: ({ url }) => {
    const variant = findVariantInComponent(url[0].path, url[1].path)!;
    return inject(Router).createUrlTree([variant.path], { fragment: variant.id });
  },
};

/** /components#<variantId> (or #<componentId>) → canonical component page. */
export const redirectAnchorAlias: CanActivateFn = (route) => {
  const fragment = route.fragment;
  if (!fragment) return true;
  const router = inject(Router);
  const variant = findVariant(fragment);
  if (variant) return router.createUrlTree([variant.path], { fragment: variant.id });
  const component = findComponent(fragment);
  return component ? router.createUrlTree([component.path]) : true;
};
