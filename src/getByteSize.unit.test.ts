import { getByteSize } from './getByteSize';

describe('getByteSize', () => {
  it('Gets size of string literal', () => {
    expect(getByteSize('foo')).toBe(3);
  });

  it('Handles extended Unicode string literals', () => {
    expect(getByteSize('你好')).toBe(6);
  });

  it('Handles number literals', () => {
    expect(getByteSize(100)).toBe(3);
  });

  it('Handles boolean literals', () => {
    expect(getByteSize(true)).toBe(4);
  });

  it('Handles object literals', () => {
    const data = {
      foo: 'bar',
      fooTwo: 'baz',
    };

    expect(getByteSize(data)).toBe(28);
  });

  it('Returns 0 on error', () => {
    const circularArray: Array<unknown> = [];
    circularArray[0] = circularArray;

    expect(getByteSize(circularArray)).toBe(0);
  });
});
