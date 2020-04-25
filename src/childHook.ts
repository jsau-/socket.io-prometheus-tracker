/* eslint-disable @typescript-eslint/no-explicit-any */

import { hook } from './hook';

/**
 * @fileoverview Helper function for applying hooks to nested properties of an
 * object. Useful for nested Socket.IO emit methods, eg. `io.to('room').emit`,
 * or `socket.volatile.emit`. Note that because these methods can either be
 * properties on an object literal, or properties set on the result of a
 * function call we have to take some extra steps.
 */
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
