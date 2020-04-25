/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @fileoverview Method for monkey-patching a hook to run before the existing
 * logic for a method on an object prototype.
 */
export function hook(
  objectToHook: any,
  methodToHook: string,
  hookFunc: Function,
): any {
  if (!objectToHook || !objectToHook[methodToHook]) {
    return;
  }

  const originalMethod = objectToHook[methodToHook];

  objectToHook[methodToHook] = (...args: any): any => {
    hookFunc(...args);
    return originalMethod.apply(objectToHook, args);
  };
}
