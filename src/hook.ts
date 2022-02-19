/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Method for monkey-patching a hook to run before the existing logic for a
 * method on an object prototype.
 *
 * @param objectToHook - The object to apply a hook on. This should be an object
 * of Functions indexed by string keys.
 * @param methodToHook - The method on the object we want to apply a hook to.
 * @param hookFunc - The hook function to run before the provided method.
 * @example
 * ```javascript
 * const exampleObject = {
 *   methodToHook: () => console.log('Hello, world!'),
 * };
 *
 * hook(exampleObject, 'methodToHook', () => console.log('Hook!'));
 *
 * // Outputs 'Hook!'; 'Hello, world!'
 * exampleObject.methodToHook();
 * ```
 */
export const hook = (
  objectToHook: any,
  methodToHook: string,
  hookFunc: (...args: any[]) => unknown,
): any => {
  if (!objectToHook || !objectToHook[methodToHook]) {
    return;
  }

  const originalMethod = objectToHook[methodToHook];

  objectToHook[methodToHook] = (...args: any): any => {
    hookFunc(...args);
    return originalMethod.apply(objectToHook, args);
  };
}
