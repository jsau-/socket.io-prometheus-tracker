import { hook } from './hook';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function childHook(
  objectToHook: any,
  parentToHook: string,
  childToHook: string,
  hookFunc: Function,
): void {
  if (!objectToHook[parentToHook]) {
    return;
  }

  const parentProperty = objectToHook[parentToHook];

  if ('function' === typeof parentProperty) {
    objectToHook[parentToHook] = function(...args: any[]): any {
      const parentResult = parentProperty.apply(this, args);
      hook(parentResult, childToHook, hookFunc);
      return parentResult;
    };
  } else {
    hook(parentProperty, childToHook, hookFunc);
  }
}
