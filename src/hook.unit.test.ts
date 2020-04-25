import { hook } from './hook';

interface ObjectToHook {
  propertyToHook: Function;
}

const returnValueBeforeHook = 'returned';
let hookFunction: jest.Mock;
let objectToHook: ObjectToHook;

describe('hook', () => {
  beforeEach(() => {
    hookFunction = jest.fn();

    objectToHook = {
      propertyToHook: () => returnValueBeforeHook,
    };
  });

  it('Skips trying to hook unfound properties', () => {
    const initialKeys = Object.keys(objectToHook);
    hook(objectToHook, 'unfoundProperty', hookFunction);
    expect(Object.keys(objectToHook)).toEqual(initialKeys);
  });

  it('Overwrites the initial object property with a new function', () => {
    const intialProperty = objectToHook.propertyToHook;
    hook(objectToHook, 'propertyToHook', hookFunction);

    expect(objectToHook.propertyToHook).not.toBe(intialProperty);
    expect(typeof objectToHook.propertyToHook).toBe('function');
  });

  it('Invokes hook and original function on calling object property', () => {
    hook(objectToHook, 'propertyToHook', hookFunction);
    const returnValueAfterHook = objectToHook.propertyToHook('one');

    expect(returnValueAfterHook).toEqual(returnValueBeforeHook);
    expect(hookFunction).toHaveBeenCalledTimes(1);
    expect(hookFunction).toHaveBeenCalledWith('one');
  });
});
