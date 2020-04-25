import { childHook } from './childHook';


describe('childHook', () => {
  it('Skips if parent property not found', () => {
    const objectToHook = {};
    const initialKeys = Object.keys(objectToHook);
    childHook(objectToHook, 'unfoundProperty', 'unfoundChildProperty', () => {});
    expect(Object.keys(objectToHook)).toEqual(initialKeys);
  });

  it('Invokes hook and child function on calling parent if function', () => {
    const hookFunc = jest.fn();
    const child = jest.fn();

    const parentReturn = { child };
    const parent = jest.fn(() => parentReturn);

    const objectToHook = { parent };

    childHook(objectToHook, 'parent', 'child', hookFunc);

    objectToHook.parent().child('one');

    expect(child).toHaveBeenCalledTimes(1);
    expect(child).toHaveBeenCalledWith('one');

    expect(hookFunc).toHaveBeenCalledTimes(1);
    expect(hookFunc).toHaveBeenCalledWith('one');
  });

  it('Invokes hook and child function on calling parent if non-function', () => {
    const hookFunc = jest.fn();
    const child = jest.fn();

    const objectToHook = { parent: { child } };

    childHook(objectToHook, 'parent', 'child', hookFunc);

    objectToHook.parent.child('one');

    expect(child).toHaveBeenCalledTimes(1);
    expect(child).toHaveBeenCalledWith('one');

    expect(hookFunc).toHaveBeenCalledTimes(1);
    expect(hookFunc).toHaveBeenCalledWith('one');
  });
});
