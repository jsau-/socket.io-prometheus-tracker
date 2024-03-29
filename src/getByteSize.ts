/**
 * Function to approximate the byte size of some value sent or
 * received by a websocket event. Note that this _won't_ be exact but should
 * suffice as a solid approximation.
 *
 * @param data - Data to get byte size of.
 * @returns Byte size of provided data.
 * @example
 * ```javascript
 * const byteSize = getByteSize({ foo: 'bar' });
 * ```
 */
export const getByteSize = (data?: unknown): number => {
  if (undefined === data) {
    return 0;
  }

  try {
    const stringData = 'string' === typeof data ? data : JSON.stringify(data);
    return Buffer.from(stringData).length;
  } catch (error) {
    return 0;
  }
}
