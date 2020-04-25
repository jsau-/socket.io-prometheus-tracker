/* eslint-disable @typescript-eslint/no-explicit-any */
export function hook(
  objectToHook: any,
  methodToHook: string,
  hookFunc: Function,
): any {
  if (!objectToHook[methodToHook]) {
    return;
  }

  const originalMethod = objectToHook[methodToHook];

  objectToHook[methodToHook] = (...args: any): any => {
    hookFunc(...args);
    return originalMethod.apply(objectToHook, [...args]);
  };
}
