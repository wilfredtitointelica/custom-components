import { ApplicationRef, EnvironmentInjector, Type, createComponent, inject } from '@angular/core';

const loaded = new WeakMap<ApplicationRef, Set<Type<unknown>>>();

/**
 * Directives cannot declare styles. Call this from a directive constructor with a style-only
 * component (`template: ''`, `ViewEncapsulation.None`, `styleUrl`): the component is created
 * once per application, detached, which makes Angular register its stylesheet.
 * Same technique as Angular CDK's private style loader.
 */
export function injectStyles(component: Type<unknown>): void {
  const appRef = inject(ApplicationRef);
  let set = loaded.get(appRef);
  if (!set) loaded.set(appRef, (set = new Set()));
  if (set.has(component)) return;
  set.add(component);
  createComponent(component, { environmentInjector: inject(EnvironmentInjector) });
}
