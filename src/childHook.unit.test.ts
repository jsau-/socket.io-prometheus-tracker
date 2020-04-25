import { childHook } from './childHook';


describe('childHook', () => {
  it('Skips if parent property not found', () => {
    const objectToHook = {};
    const initialKeys = Object.keys(objectToHook);
    childHook(objectToHook, 'unfoundProperty', 'unfoundChildProperty', () => {});
    expect(Object.keys(objectToHook)).toEqual(initialKeys);
  });

  it('Invokes parent if function', () => {
    const parentReturn = { foo: 'bar' };
    const parent = jest.fn(() => parentReturn);

    const objectToHook = { parent };
    const result = childHook(objectToHook, 'parent', 'child', () => {});
    expect(parent).toHaveBeenCalledTimes(1);
    expect(result).toBe(parentReturn);
  });

  it('Does not invoke parent if not function', () => {
    const objectToHook = { parent: {} };
    const result = childHook(objectToHook, 'parent', 'child', () => {});
    expect(result).toBe(objectToHook.parent);
  });

  it('Invokes hook and child function on calling parent function', () => {
    const hookFunc = jest.fn();
    const child = jest.fn();

    const parentReturn = { child };
    const parent = jest.fn(() => parentReturn);

    const objectToHook = { parent };
    const result = childHook(objectToHook, 'parent', 'child', hookFunc);
    expect(result).toBe(parentReturn);

    objectToHook.parent().child('one');

    expect(child).toHaveBeenCalledTimes(1);
    expect(child).toHaveBeenCalledWith('one');

    expect(hookFunc).toHaveBeenCalledTimes(1);
    expect(hookFunc).toHaveBeenCalledWith('one');
  });

  it('Invokes hook and child function on calling parent non-function', () => {
    const hookFunc = jest.fn();
    const child = jest.fn();

    const objectToHook = { parent: { child } };

    const result = childHook(objectToHook, 'parent', 'child', hookFunc);
    expect(result).toBe(objectToHook.parent);

    objectToHook.parent.child('one');

    expect(child).toHaveBeenCalledTimes(1);
    expect(child).toHaveBeenCalledWith('one');

    expect(hookFunc).toHaveBeenCalledTimes(1);
    expect(hookFunc).toHaveBeenCalledWith('one');
  });
});
