/* eslint-disable @typescript-eslint/no-explicit-any */

import { hook } from './hook';

/**
 * @fileoverview Helper function for applying hooks to nested properties of an
 * object. Useful for nested Socket.IO emit methods, eg. `io.to('room').emit`,
 * or `socket.volatile.emit`. Note that because these methods can either be
 * properties on an object literal, or properties set on the result of a
 * function call we have to take some extra steps.
 * @param objectToHook - The object to apply a hook to. This should be an
 * object with properties that are either functions generating objects, or
 * objects themselves.
 * @param parentProperty - The parent property to hook into (i.e. a property on
 * the above object).
 * @param childMethodToHook - The child property to hook into (i.e. either a
 * property on the parent property, or on the object generated after invoking
 * it).
 * @param hookFunc - The hook function to run before the child property.
 * @example
 * ```javascript
 * const exampleObject = {
 *   parentPropertyOne: () => ({
 *     childPropertyOne: () => console.log('Hello, world!'),
 *   }),
 *   parentPropertyTwo: {
 *     childPropertyTwo: () => console.log('Hello, again!'),
 *   },
 * };
 *
 * childHook(
 *   exampleObject,
 *   'parentPropertyOne',
 *   'childPropertyOne',
 *   () => console.log('Hook one!'),
 * );
 *
 * childHook(
 *   exampleObject,
 *   'parentPropertyTwo',
 *   'childPropertyTwo',
 *   () => console.log('Hook two!'),
 * );
 *
 * // Outputs 'Hook one!'; 'Hello, world!';
 * exampleObject.parentPropertyOne().childPropertyOne();
 *
 * // Outputs 'Hook two!'; 'Hello, again!';
 * exampleObject.parentPropertyTwo.childPropertyTwo();
 * ```
 */
export function childHook(
  objectToHook: any,
  parentProperty: string,
  childMethodToHook: string,
  hookFunc: (...args: any[]) => unknown,
): void {
  if (!objectToHook[parentProperty]) {
    return;
  }

  const originalParentProperty = objectToHook[parentProperty];

  if ('function' === typeof originalParentProperty) {
    objectToHook[parentProperty] = function(...args: any[]): any {
      const parentResult = originalParentProperty.apply(this, args);
      hook(parentResult, childMethodToHook, hookFunc);
      return parentResult;
    };
  } else {
    hook(originalParentProperty, childMethodToHook, hookFunc);
  }
}
