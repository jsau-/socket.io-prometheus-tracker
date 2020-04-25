/**
 * @fileoverview Function to approximate the byte size of some value sent or
 * received by a websocket event. Note that this _won't_ be exact but should
 * suffice as a solid approximation.
 */
export function getByteSize(data: unknown): number {
  try {
    const stringData = 'string' === typeof data ? data : JSON.stringify(data);
    return Buffer.byteLength(stringData || '', 'utf8');
  } catch (error) {
    return 0;
  }
}
