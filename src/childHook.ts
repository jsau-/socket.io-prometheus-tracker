/* eslint-disable @typescript-eslint/no-explicit-any */
export function childHook(
  objectToHook: any,
  parentToHook: string,
  childToHook: string,
  hookFunc: Function,
): any {
  if (!objectToHook[parentToHook]) {
    return undefined;
  }

  const parentResult =
    'function' === typeof objectToHook[parentToHook] ?
      objectToHook[parentToHook].apply(objectToHook, arguments) :
      objectToHook[parentToHook];

  if (!parentResult || !parentResult[childToHook]) {
    return parentResult;
  }

  const childMethod = parentResult[childToHook];

  parentResult[childToHook] = (...args: any): any => {
    hookFunc(...args);
    childMethod.apply(parentResult, args);
  };

  return parentResult;
}
