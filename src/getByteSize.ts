export function getByteSize(data: unknown): number {
  try {
    const stringData = 'string' === typeof data ? data : JSON.stringify(data);
    return Buffer.byteLength(stringData || '', 'utf8');
  } catch (error) {
    return 0;
  }
}
