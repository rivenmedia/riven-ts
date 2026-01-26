/**
 * Creates a human-readable label for a chunk range.
 *
 * @param range A tuple containing the start and end byte of the chunk
 * @returns A human-readable range label for the chunk, e.g. `[0-1048576]`
 */
export const createChunkRangeLabel = (range: readonly [number, number]) =>
  `[${range.join("-")}]` as `[${string}-${string}]`;
