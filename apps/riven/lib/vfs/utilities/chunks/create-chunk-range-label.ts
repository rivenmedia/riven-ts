/**
 *
 * @param start Start byte of the chunk
 * @param end End byte of the chunk
 * @returns A human-readable range label for the chunk, e.g. `[0-1048576]`
 */
export const createChunkRangeLabel = (range: readonly [number, number]) =>
  `[${range.join("-")}]` as `[${string}-${string}]`;
