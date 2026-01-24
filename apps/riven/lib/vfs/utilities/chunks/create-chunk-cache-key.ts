export const createChunkCacheKey = (
  fileId: number,
  start: number,
  end: number,
) => {
  return [fileId, start, end].join("-") as `${string}-${string}-${string}`;
};
